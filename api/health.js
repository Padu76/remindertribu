// api/health.js
// Endpoint diagnostico (no segreti)

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function has(val) { return Boolean(val && String(val).length > 0); }

export default async function handler(req, res) {
  try {
    const env = {
      hasServiceAccount: has(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
      hasWaToken: has(process.env.WA_META_TOKEN),
      hasWaPhoneId: has(process.env.WA_META_PHONE_ID),
      dryRun: (process.env.DRY_RUN || 'true') === 'true',
      daysAhead: parseInt(process.env.NEXT_PUBLIC_REMINDER_DAYS_AHEAD || '7', 10),
      onlyExpired: (process.env.REMINDER_ONLY_EXPIRED || 'false') === 'true',
      cooldownDays: parseInt(process.env.REMINDER_COOLDOWN_DAYS || '7', 10)
    };

    let firestoreOk = false;
    let sample = null;

    if (env.hasServiceAccount) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (!getApps().length) initializeApp({ credential: cert(sa) });
      const db = getFirestore();
      const qs = await db.collection('members').limit(1).get();
      firestoreOk = true;
      sample = qs.empty ? null : { id: qs.docs[0].id };
    }

    return res.status(200).json({ ok: true, env, firestoreOk, sample });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
