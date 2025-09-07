// api/send-reminders.js
// Serverless function per inviare reminder WhatsApp ai membri in scadenza.
// Nessuna chiave nel codice. Legge ENV private su Vercel.

let admin; // lazy import per cold start
let firestore;

async function initFirebaseAdmin() {
  if (firestore) return firestore;

  // Legge il service account JSON da ENV privata (NO NEXT_PUBLIC)
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON mancante: imposta una service account JSON come ENV privata");
  }

  const serviceAccount = JSON.parse(saJson);

  // Import dinamico per ridurre cold start
  const adminModule = await import('firebase-admin');
  admin = adminModule.default;

  // Evita doppia init su re-invocazioni nello stesso runtime
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  firestore = admin.firestore();
  return firestore;
}

// Utilità: normalizza date (ISO string o Timestamp) -> oggetto Date
function toDateAny(v) {
  if (!v) return null;
  if (typeof v === 'string') return new Date(v);
  if (v.toDate) return v.toDate(); // Firestore Timestamp
  return new Date(v);
}

function daysBetween(a, b) {
  const ms = a.setHours(0,0,0,0) - b.setHours(0,0,0,0);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function buildMessage(client, dLeft) {
  const name = (client.nome || client.fullName || client.cognome || 'Ciao').toString().split(' ')[0];
  const plan = client.plan || client.tesseramento || 'tesseramento';
  if (dLeft > 0) {
    return `${name}, promemoria dal Tribù Studio: il tuo ${plan} scade tra ${dLeft} giorno/i. Vuoi rinnovare ora? Ti mandiamo noi il link. 💪`;
  } else if (dLeft === 0) {
    return `${name}, promemoria: il tuo ${plan} scade OGGI. Vuoi rinnovare ora? 💪`;
  } else {
    return `${name}, promemoria: il tuo ${plan} è scaduto da ${Math.abs(dLeft)} giorno/i. Vuoi riattivarlo? 💪`;
  }
}

async function sendViaWhatsAppMeta(toPhone, text) {
  const token = process.env.WA_META_TOKEN;       // PRIVATA (senza NEXT_PUBLIC)
  const phoneId = process.env.WA_META_PHONE_ID;  // PRIVATA (senza NEXT_PUBLIC)

  if (!token || !phoneId) {
    return { ok: false, skipped: true, reason: "WA_META_TOKEN/WA_META_PHONE_ID non configurati" };
  }

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone.replace('+', '').replace(/\s+/g, ''),
      type: 'text',
      text: { body: text }
    })
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`WhatsApp API error: ${res.status} ${t}`);
  }
  return { ok: true };
}

export default async function handler(req, res) {
  const method = req.method || 'GET';
  const dryRun = (process.env.DRY_RUN || 'false') === 'true';
  const daysAhead = parseInt(process.env.NEXT_PUBLIC_REMINDER_DAYS_AHEAD || '7', 10);

  try {
    const db = await initFirebaseAdmin();

    // Finestra temporale
    const today = new Date();
    const limit = new Date();
    limit.setDate(today.getDate() + daysAhead);

    // Leggi collezione "members"
    // NOTA: qui scarichiamo e filtriamo lato server per compatibilità sia con ISO string che Timestamp
    const snap = await db.collection('members').get();

    const candidates = [];
    snap.forEach(doc => {
      const data = doc.data();
      const expiry = toDateAny(data.dataScadenza);
      if (!expiry) return;

      if (expiry <= limit) {
        const phone = data.whatsapp || data.telefono || data.phone;
        if (!phone) return;

        const dLeft = daysBetween(expiry, new Date());
        candidates.push({
          id: doc.id,
          phone,
          daysLeft: dLeft,
          payload: data
        });
      }
    });

    let sent = 0;
    const details = [];

    for (const c of candidates) {
      const msg = buildMessage(c.payload, c.daysLeft);

      if (dryRun) {
        details.push({ id: c.id, phone: c.phone, daysLeft: c.daysLeft, dryRun: true, message: msg });
        continue;
      }

      const waRes = await sendViaWhatsAppMeta(c.phone, msg);
      details.push({ id: c.id, phone: c.phone, daysLeft: c.daysLeft, sent: waRes.ok === true, skipped: waRes.skipped || false });

      if (waRes.ok) sent++;
    }

    return res.status(200).json({
      ok: true,
      dryRun,
      candidates: candidates.length,
      sent,
      details
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
