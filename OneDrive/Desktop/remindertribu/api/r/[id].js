// api/r/[id].js
import admin from 'firebase-admin';

let app;
function ensureAdmin() {
  if (app) return admin.firestore();
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  const creds = JSON.parse(json);
  app = admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
  return admin.firestore();
}

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ ok:false, error:'Bad request' });
    const db = ensureAdmin();

    const ref = db.collection('links').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).send('Not found');

    const data = snap.data() || {};
    const target = data.urlTarget;
    if (!target || !/^https?:\/\//i.test(target)) return res.status(400).send('Invalid target');

    // incrementa contatore (best-effort)
    await ref.update({
      clicks: admin.firestore.FieldValue.increment(1),
      lastClickAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(()=>{});

    // redirect
    res.setHeader('Cache-Control','no-store');
    return res.redirect(302, target);
  } catch (e) {
    console.error('shortlink error', e);
    return res.status(500).send('Internal error');
  }
}
