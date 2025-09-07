// api/phones-preview.js
// Anteprima normalizzazione numeri (nessuna scrittura)

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

function normalizeE164(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  const just = digits.replace(/\D/g, '');
  if (/^3\d{8,9}$/.test(just)) return `+39${just}`;
  if (/^39\d{8,10}$/.test(just)) return `+${just}`;
  return null;
}

export default async function handler(req, res) {
  try {
    const database = initAdmin();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '200', 10), 1000));
    const fields = (req.query.fields || 'phone,whatsapp,telefono')
      .split(',').map(s => s.trim()).filter(Boolean);

    const snap = await database.collection('members').limit(limit).get();

    const results = [];
    let totalInvalid = 0;
    let totalUpdates = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const perDoc = {
        id: doc.id,
        name: [data.nome, data.cognome, data.fullName].filter(Boolean).join(' ').trim() || null,
        updates: [],
        invalids: [],
        oks: []
      };

      for (const f of fields) {
        if (!(f in data)) continue;
        const before = data[f];
        if (!before) continue;
        const after = normalizeE164(before);
        if (after === null) {
          perDoc.invalids.push({ field: f, before });
          totalInvalid++;
        } else if (after !== before) {
          perDoc.updates.push({ field: f, before, after });
          totalUpdates++;
        } else {
          perDoc.oks.push({ field: f, value: before });
        }
      }

      if (perDoc.updates.length || perDoc.invalids.length) {
        results.push(perDoc);
      }
    }

    return res.status(200).json({
      ok: true,
      scanned: snap.size,
      fields,
      toUpdateDocs: results.length,
      fieldUpdates: totalUpdates,
      invalidFields: totalInvalid,
      results
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
