// api/send-reminders.js
// Invio reminder WhatsApp ai membri in scadenza (PROD-ready)

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --------- CONFIG LETTA DA ENV (nessuna chiave hardcoded) ----------
const DRY_RUN = (process.env.DRY_RUN || 'true') === 'true';
const DAYS_AHEAD = parseInt(process.env.NEXT_PUBLIC_REMINDER_DAYS_AHEAD || '7', 10);
const ONLY_EXPIRED = (process.env.REMINDER_ONLY_EXPIRED || 'false') === 'true';
const COOLDOWN_DAYS = parseInt(process.env.REMINDER_COOLDOWN_DAYS || '7', 10);

// WhatsApp Cloud API (PRIVATE)
const WA_TOKEN = process.env.WA_META_TOKEN || '';
const WA_PHONE_ID = process.env.WA_META_PHONE_ID || '';
const WA_TEMPLATE_NAME = process.env.WA_TEMPLATE_NAME || ''; // opzionale
const WA_TEMPLATE_LANG = process.env.WA_TEMPLATE_LANG || 'it'; // es. 'it', 'en_US'

// ---------------------- FIREBASE ADMIN INIT ------------------------
let db;
function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON mancante');
  return JSON.parse(raw);
}

function initAdmin() {
  if (db) return db;
  const serviceAccount = parseServiceAccount();
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  db = getFirestore();
  return db;
}

// --------------------------- UTIL -------------------------------
function toDateAny(v) {
  if (!v) return null;
  if (typeof v === 'string') return new Date(v);
  if (v.toDate) return v.toDate();
  return new Date(v);
}

function daysBetween(a, b = new Date()) {
  const d1 = new Date(a); d1.setHours(0,0,0,0);
  const d2 = new Date(b); d2.setHours(0,0,0,0);
  return Math.ceil((d1 - d2) / (1000*60*60*24));
}

function normalizeItalianE164(phoneRaw) {
  if (!phoneRaw) return null;
  const digits = String(phoneRaw).replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  // Se inizia con 3 ed è 9-10 cifre (cell IT), prefissa +39
  const justNums = digits.replace(/\D/g, '');
  if (/^3\d{8,9}$/.test(justNums)) return `+39${justNums}`;
  // Se già include "39" all'inizio ma senza +, aggiungilo
  if (/^39\d{8,10}$/.test(justNums)) return `+${justNums}`;
  // Altrimenti, non tocco (evito errori)
  return null;
}

function buildTextMessage(client, dLeft) {
  const name = (client.nome || client.fullName || client.cognome || 'Ciao').toString().split(' ')[0].toUpperCase();
  const plan = client.plan || client.tesseramento || 'tesseramento';
  if (dLeft > 0) return `${name}, promemoria: il tuo ${plan} scade tra ${dLeft} giorno/i. Vuoi rinnovare ora? 💪`;
  if (dLeft === 0) return `${name}, promemoria: il tuo ${plan} scade OGGI. Vuoi rinnovare ora? 💪`;
  return `${name}, promemoria: il tuo ${plan} è scaduto da ${Math.abs(dLeft)} giorno/i. Vuoi riattivarlo? 💪`;
}

function withinCooldown(lastAtIso, cooldownDays) {
  if (!lastAtIso) return false;
  const last = new Date(lastAtIso);
  const nextAllowed = new Date(last);
  nextAllowed.setDate(last.getDate() + cooldownDays);
  return nextAllowed > new Date();
}

async function sendWhatsApp(toE164, text, ctx) {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    return { ok: false, skipped: true, reason: 'WA_META_TOKEN/WA_META_PHONE_ID non configurati' };
  }

  const to = toE164.replace('+', '').replace(/\s+/g, '');

  // Se è definito un template, prova prima il template
  let payload;
  if (WA_TEMPLATE_NAME) {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: WA_TEMPLATE_NAME,
        language: { code: WA_TEMPLATE_LANG },
        // body params classici: [nome, giorni, piano]
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: ctx.name || '' },
              { type: 'text', text: String(ctx.daysLeft) },
              { type: 'text', text: ctx.plan || 'tesseramento' }
            ]
          }
        ]
      }
    };
  } else {
    // fallback testo semplice
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    };
  }

  const url = `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`WhatsApp API error: ${res.status} ${t}`);
  }
  return { ok: true };
}

// --------------------------- HANDLER ----------------------------
export default async function handler(req, res) {
  try {
    const database = initAdmin();

    // Finestra temporale
    const today = new Date();
    const limit = new Date();
    limit.setDate(today.getDate() + DAYS_AHEAD);

    const snap = await database.collection('members').get();

    const candidates = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      const expiry = toDateAny(data.dataScadenza);
      if (!expiry) continue;

      const dLeft = daysBetween(expiry, today);
      if (ONLY_EXPIRED && dLeft >= 0) continue; // solo scaduti
      if (!ONLY_EXPIRED && expiry > limit) continue; // entro giorni avanti

      const rawPhone = data.whatsapp || data.telefono || data.phone;
      const phone = normalizeItalianE164(rawPhone);
      if (!phone) continue;

      if (withinCooldown(data.lastReminderAt, COOLDOWN_DAYS)) continue;

      const ctx = {
        name: (data.nome || data.fullName || data.cognome || '').toString().split(' ')[0],
        daysLeft: dLeft,
        plan: data.plan || data.tesseramento || 'tesseramento'
      };

      candidates.push({
        id: doc.id,
        phone,
        daysLeft: dLeft,
        payload: data,
        ctx
      });
    }

    const details = [];
    let sent = 0;

    for (const c of candidates) {
      const msg = buildTextMessage(c.payload, c.daysLeft);

      if (DRY_RUN) {
        details.push({ id: c.id, phone: c.phone, daysLeft: c.daysLeft, dryRun: true, message: msg });
        continue;
      }

      try {
        const wa = await sendWhatsApp(c.phone, msg, c.ctx);
        details.push({ id: c.id, phone: c.phone, daysLeft: c.daysLeft, sent: wa.ok === true, template: !!WA_TEMPLATE_NAME });

        if (wa.ok) {
          sent++;
          // log + update membro
          await database.collection('reminders_log').add({
            memberId: c.id,
            phone: c.phone,
            daysLeft: c.daysLeft,
            channel: 'whatsapp',
            template: WA_TEMPLATE_NAME || null,
            messagePreview: msg.slice(0, 120),
            sentAt: new Date().toISOString()
          });
          await database.collection('members').doc(c.id).update({
            lastReminderAt: new Date().toISOString(),
            lastReminderStatus: 'sent'
          });
        }
      } catch (err) {
        details.push({ id: c.id, phone: c.phone, daysLeft: c.daysLeft, error: err.message });
      }
    }

    return res.status(200).json({
      ok: true,
      dryRun: DRY_RUN,
      onlyExpired: ONLY_EXPIRED,
      cooldownDays: COOLDOWN_DAYS,
      candidates: candidates.length,
      sent,
      details
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
