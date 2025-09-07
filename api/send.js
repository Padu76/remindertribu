// api/messages/send.js
// Invia un messaggio WhatsApp tramite WhatsApp Cloud API (Meta)
// Richiede ENV: WA_META_TOKEN, WA_META_PHONE_ID
// Rispetta DRY_RUN: se DRY_RUN=true (o ?dryRun=true), non invia davvero.

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
    }

    const token = process.env.WA_META_TOKEN;
    const phoneId = process.env.WA_META_PHONE_ID;
    if (!token || !phoneId) {
      return res.status(500).json({
        ok: false,
        error: 'Configurazione WhatsApp mancante (imposta WA_META_TOKEN e WA_META_PHONE_ID su Vercel).'
      });
    }

    const body = await readJson(req);
    const toRaw = (body?.to || '').toString();
    const message = (body?.message || '').toString();
    const previewUrl = !!body?.preview_url; // opzionale

    const to = normalizeE164(toRaw);
    if (!to) return res.status(400).json({ ok: false, error: 'Numero non valido o senza prefisso internazionale.' });
    if (!message.trim()) return res.status(400).json({ ok: false, error: 'Messaggio vuoto.' });
    if (message.length > 4096) return res.status(400).json({ ok: false, error: 'Messaggio troppo lungo (max 4096 caratteri).' });

    const isDry =
      (process.env.DRY_RUN || '').toLowerCase() === 'true' ||
      (req.query?.dryRun || '').toString().toLowerCase() === 'true';

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message, preview_url: previewUrl }
    };

    if (isDry) {
      return res.status(200).json({
        ok: true,
        dryRun: true,
        to,
        payload
      });
    }

    const url = `https://graph.facebook.com/v17.0/${encodeURIComponent(phoneId)}/messages`;
    const waRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const waJson = await waRes.json().catch(() => ({}));

    if (!waRes.ok) {
      const msg = waJson?.error?.message || waJson?.error?.error_user_msg || JSON.stringify(waJson);
      return res.status(waRes.status).json({
        ok: false,
        error: `Meta API error: ${msg}`
      });
    }

    // Successo
    return res.status(200).json({
      ok: true,
      dryRun: false,
      to,
      meta: {
        messages: waJson?.messages || null,
        contacts: waJson?.contacts || null
      }
    });
  } catch (err) {
    console.error('messages/send error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
}

// -------- utils --------
function normalizeE164(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  const just = digits.replace(/\D/g, '');
  if (/^3\d{8,9}$/.test(just)) return `+39${just}`;         // 347... -> +39...
  if (/^39\d{8,10}$/.test(just)) return `+${just}`;          // 39... -> +39...
  return null;
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}
