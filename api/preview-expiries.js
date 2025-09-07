// api/preview-expiries.js
// Anteprima membri in scadenza (nessun invio, nessuna scrittura)

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DAYS_AHEAD = parseInt(process.env.NEXT_PUBLIC_REMINDER_DAYS_AHEAD || '7', 10);
const ONLY_EXPIRED = (process.env.REMINDER_ONLY_EXPIRED || 'false') === 'true';
const COOLDOWN_DAYS = parseInt(process.env.REMINDER_COOLDOWN_DAYS || '7', 10);

let db;
function initAdmin() {
  if (db) return db;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON mancante');
  const sa = JSON.parse(raw);
  if (!getApps().length) initializeApp({ credential: cert(sa) });
  db = getFirestore();
  return db;
}

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
  const just = digits.replace(/\D/g, '');
  if (/^3\d{8,9}$/.test(just)) return `+39${just}`;
  if (/^39\d{8,10}$/.test(just)) return `+${just}`;
  return null;
}

function withinCooldown(lastAtIso, cooldownDays) {
  if (!lastAtIso) return false;
  const last = new Date(lastAtIso);
  const nextAllowed = new Date(last);
  nextAllowed.setDate(last.getDate() + cooldownDays);
  return nextAllowed > new Date();
}

export default async function handler(req, res) {
  try {
    const database = initAdmin();

    const today = new Date();
    const limit = new Date();
    limit.setDate(today.getDate() + DAYS_AHEAD);

    const snap = await database.collection('members').get();

    const results = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      const expiry = toDateAny(data.dataScadenza);
      if (!expiry) continue;

      const dLeft = daysBetween(expiry, today);
      if (ONLY_EXPIRED && dLeft >= 0) continue;
      if (!ONLY_EXPIRED && expiry > limit) continue;

      const phone = normalizeItalianE164(data.whatsapp || data.telefono || data.phone);
      if (!phone) continue;
      if (withinCooldown(data.lastReminderAt, COOLDOWN_DAYS)) continue;

      results.push({
        id: doc.id,
        name: [data.nome, data.cognome, data.fullName].filter(Boolean).join(' ').trim() || null,
        phone,
        daysLeft: dLeft,
        plan: data.plan || data.tesseramento || 'tesseramento',
        lastReminderAt: data.lastReminderAt || null
      });
    }

    return res.status(200).json({ ok: true, onlyExpired: ONLY_EXPIRED, cooldownDays: COOLDOWN_DAYS, count: results.length, results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
