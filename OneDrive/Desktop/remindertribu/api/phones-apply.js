// api/phones-apply.js
// Applica normalizzazione numeri con guardrail (ENV ALLOW_PHONE_APPLY=true)

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
    const applyAllowed = (process.env.ALLOW_PHONE_APPLY || 'false') === 'true';
    const dryRunParam = (req.query.dryRun || '').toString().toLowerCase() === 'true';
    const DRY_RUN = dryRunParam || !applyAllowed; // se non autorizzato, forzo dry-run

    if (!applyAllowed && !dryRunParam) {
      return res.status(403).json({
        ok: false,
        error: 'Operazione disabilitata. Imposta ALLOW_PHONE_APPLY=true o usa ?dryRun=true per simulare.'
      });
    }

    const database = initAdmin();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '100', 10), 500));
    const fields = (req.query.fields || 'phone,whatsapp,telefono')
      .split(',').map(s => s.trim()).filter(Boolean);

    const snap = await database.collection('members').limit(limit).get();

    let scanned = 0;
    let docsToUpdate = 0;
    let fieldsUpdated = 0;
    let invalidFields = 0;
    const details = [];

    // Firestore batch (max 500 writes). Gestione semplice: un batch unico.
    const batch = database.batch();

    for (const doc of snap.docs) {
      scanned++;
      const data = doc.data();
      const patch = {};
      const logEntry = { id: doc.id, updates: [], invalids: [] };

      for (const f of fields) {
        if (!(f in data)) continue;
        const before = data[f];
        if (!before) continue;

        const after = normalizeE164(before);
        if (after === null) {
          invalidFields++;
          logEntry.invalids.push({ field: f, before });
          continue;
        }
        if (after !== before) {
          patch[f] = after;
          // salva l'originale solo se non esiste già un raw
          const rawKey = `${f}Raw`;
          if (!data[rawKey]) patch[rawKey] = before;

          logEntry.updates.push({ field: f, before, after });
          fieldsUpdated++;
        }
      }

      if (logEntry.updates.length || logEntry.invalids.length) {
        docsToUpdate++;
        details.push(logEntry);

        // metadati
        const meta = {
          lastPhoneNormalizationAt: new Date().toISOString(),
          phoneNormalizationVersion: '1'
        };

        if (!DRY_RUN && logEntry.updates.length) {
          batch.update(doc.ref, { ...patch, ...meta });
        }

        // log collection
        const logRef = database.collection('phone_normalizations').doc();
        const logPayload = {
          memberId: doc.id,
          updates: logEntry.updates,
          invalids: logEntry.invalids,
          dryRun: DRY_RUN,
          at: FieldValue.serverTimestamp()
        };
        if (!DRY_RUN) {
          batch.set(logRef, logPayload);
        }
      }
    }

    if (!DRY_RUN) {
      await batch.commit();
    }

    return res.status(200).json({
      ok: true,
      dryRun: DRY_RUN,
      scanned,
      docsToUpdate,
      fieldsUpdated,
      invalidFields,
      details
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
