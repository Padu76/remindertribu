// assets/js/modules/whatsapp.js
(function () {
  'use strict';

  const BASE = (window.AppConfig && window.AppConfig.WHATSAPP_API_BASE) || '';
  function assertBase() {
    if (!BASE) throw new Error('WHATSAPP_API_BASE non configurato in window.AppConfig');
  }

  // Normalizza in E.164 con auto +39 per cellulari IT
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

  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async function postJSON(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    return r.json().catch(() => ({}));
  }

  async function checkHealth() {
    assertBase();
    // endpoint standard
    try { return await getJSON(`${BASE}/health`); }
    catch (_) { /* fallback */ }
    // fallback generico
    return { ok: false, note: 'Endpoint /health non disponibile' };
  }

  async function sendMessage(to, message) {
    assertBase();
    const n = normalizeE164(to);
    if (!n) throw new Error('Numero non valido (manca prefisso internazionale?)');
    // endpoint standard
    try { return await postJSON(`${BASE}/messages/send`, { to: n, message }); }
    catch (_) { /* fallback */ }
    // fallback legacy
    return await postJSON(`${BASE}/send`, { to: n, message });
  }

  function toast(msg, type = 'info', duration = 4000) {
    if (window.Toast_Instance?.show) return window.Toast_Instance.show(msg, type, duration);
    if (window.App?.modules?.toast?.success && window.App?.modules?.toast?.error) {
      const fn = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
      return window.App.modules.toast[fn](msg);
    }
    console.log(`[${type}]`, msg);
  }

  function tpl() {
    return `
      <section class="wa-head">
        <h2><i class="fab fa-whatsapp"></i> WhatsApp</h2>
        <div class="meta">
          <span>API Base: <b class="mono">${BASE || '—'}</b></span>
          <button class="btn btn-secondary" data-action="health"><i class="fas fa-heartbeat"></i> Health</button>
        </div>
      </section>

      <section class="wa-grid">
        <div class="card">
          <h3>Invio singolo</h3>
          <div class="form">
            <label>Numero (accetta 347..., 0039..., +39347...)</label>
            <input id="wa-single-to" class="form-control" placeholder="+39347...">
            <label>Messaggio</label>
            <textarea id="wa-single-msg" class="form-control" rows="3" placeholder="Scrivi il messaggio..."></textarea>
            <div class="actions">
              <button class="btn btn-primary" data-action="send-one"><i class="fas fa-paper-plane"></i> Invia</button>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Invio massivo</h3>
          <div class="form">
            <label>Numeri (uno per riga)</label>
            <textarea id="wa-bulk-list" class="form-control" rows="6" placeholder="347...\n+39348...\n0039..."></textarea>
            <label>Messaggio</label>
            <textarea id="wa-bulk-msg" class="form-control" rows="3" placeholder="Scrivi il messaggio..."></textarea>
            <div class="actions">
              <button class="btn" data-action="bulk-preview"><i class="fas fa-list-check"></i> Anteprima</button>
              <button class="btn btn-primary" data-action="bulk-send"><i class="fas fa-paper-plane"></i> Invia tutti</button>
            </div>
          </div>
          <div id="wa-bulk-result" class="result"></div>
        </div>
      </section>

      <style>
        .wa-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}
        .wa-head .meta{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
        .wa-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        @media(max-width: 1100px){ .wa-grid{grid-template-columns:1fr} }
        .card{background:#0f172a;border:1px solid #243041;border-radius:12px;padding:1rem}
        .form{display:flex;flex-direction:column;gap:.5rem}
        .form-control{background:#0b1220;border:1px solid #243041;border-radius:10px;padding:.6rem;color:#e5e7eb}
        .actions{margin-top:.5rem;display:flex;gap:.5rem}
        .btn{border-radius:10px}
        .mono{font-family:monospace}
        .result{margin-top:1rem;max-height:300px;overflow:auto;border-top:1px dashed #243041;padding-top:.75rem}
        .log{font-family:monospace;font-size:.9rem;line-height:1.3}
        .ok{color:#a7f3d0}
        .err{color:#fecaca}
      </style>
    `;
  }

  function parseBulkList(str) {
    return String(str || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  }

  async function bulkSend(numbers, message, logEl) {
    const lines = numbers.map(n => ({ raw: n, norm: normalizeE164(n), ok: false, error: null }));
    const append = (html) => { logEl.innerHTML += html; logEl.scrollTop = logEl.scrollHeight; };
    append(`<div class="log">Totale numeri: ${lines.length}</div>`);
    let sent = 0;

    for (const item of lines) {
      if (!item.norm) {
        item.error = 'Numero non valido';
        append(`<div class="log err">✗ ${item.raw} → ERRORE: ${item.error}</div>`);
        continue;
      }
      try {
        await sendMessage(item.norm, message);
        item.ok = true; sent++;
        append(`<div class="log ok">✓ ${item.norm} → inviato</div>`);
      } catch (err) {
        item.error = err.message || 'Errore invio';
        append(`<div class="log err">✗ ${item.norm} → ${item.error}</div>`);
      }
    }

    append(`<div class="log">Completato. Inviati: ${sent}/${lines.length}</div>`);
    return { sent, total: lines.length };
  }

  const WhatsAppModule = {
    async init() { /* hook in futuro se serve */ },
    mount(container) {
      container.innerHTML = tpl();
      this.bind(container);
    },
    bind(container) {
      const btnHealth = container.querySelector('[data-action="health"]');
      const btnOne = container.querySelector('[data-action="send-one"]');
      const btnPrev = container.querySelector('[data-action="bulk-preview"]');
      const btnBulk = container.querySelector('[data-action="bulk-send"]');
      const resBox = container.querySelector('#wa-bulk-result');

      if (btnHealth) btnHealth.addEventListener('click', async () => {
        try {
          const h = await checkHealth();
          toast(`Health: ${h.ok ? 'OK' : 'KO'}${h.note ? ' - ' + h.note : ''}`, h.ok ? 'success' : 'error');
        } catch (err) { toast(err.message, 'error'); }
      });

      if (btnOne) btnOne.addEventListener('click', async () => {
        try {
          const to = (container.querySelector('#wa-single-to') || {}).value || '';
          const msg = (container.querySelector('#wa-single-msg') || {}).value || '';
          if (!to || !msg) return toast('Numero e messaggio sono obbligatori', 'error');
          await sendMessage(to, msg);
          toast('Messaggio inviato', 'success');
        } catch (err) { toast(err.message, 'error'); }
      });

      if (btnPrev) btnPrev.addEventListener('click', () => {
        const list = parseBulkList((container.querySelector('#wa-bulk-list') || {}).value);
        if (!list.length) return toast('Inserisci almeno un numero', 'error');
        const preview = list.map(n => `${n} → ${normalizeE164(n) || 'INVAL'}`).join('\n');
        resBox.innerHTML = `<pre class="log">${preview}</pre>`;
      });

      if (btnBulk) btnBulk.addEventListener('click', async () => {
        const list = parseBulkList((container.querySelector('#wa-bulk-list') || {}).value);
        const msg = (container.querySelector('#wa-bulk-msg') || {}).value || '';
        if (!list.length || !msg) return toast('Numeri e messaggio obbligatori', 'error');
        resBox.innerHTML = '';
        await bulkSend(list, msg, resBox);
      });
    }
  };

  window.WhatsAppModule = WhatsAppModule;
})();
