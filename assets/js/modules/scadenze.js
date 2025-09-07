// assets/js/modules/scadenze.js
(function () {
  const ScadenzeUI = {
    state: {
      loading: false,
      items: [],
      serverSettings: null,
      audit: null,       // preview result
      applyResult: null  // apply result
    },

    init() {
      const navItem = document.querySelector('.nav-item[data-page="scadenze"]');
      if (navItem && !navItem.dataset.rtBound) {
        navItem.addEventListener('click', (e) => {
          e.preventDefault();
          this.renderInto(document.getElementById('page-content'));
          this._setActive(navItem);
        });
        navItem.dataset.rtBound = '1';
      }
      if (navItem && navItem.classList.contains('active')) {
        this.renderInto(document.getElementById('page-content'));
      }
    },

    async renderInto(container) {
      if (!container) return;
      this.state.loading = true;
      container.innerHTML = this._skeleton();

      try {
        const health = await this._fetchJSON('/api/health');
        this.state.serverSettings = health?.env ? {
          daysAhead: health.env.daysAhead,
          onlyExpired: health.env.onlyExpired,
          cooldownDays: health.env.cooldownDays,
          dryRun: health.env.dryRun
        } : null;

        const data = await this._fetchJSON('/api/preview-expiries');
        this.state.items = Array.isArray(data?.results) ? data.results : [];

        container.innerHTML = this._layout(this.state);
        this._bindActions(container);
        this._updateBadge(this.state.items.length);
        this._toast(`Scadenze caricate: ${this.state.items.length}`, 'info');
      } catch (err) {
        console.error(err);
        container.innerHTML = this._errorBox(err?.message || 'Errore caricamento scadenze');
        this._toast('Errore caricamento scadenze', 'error');
      } finally {
        this.state.loading = false;
      }
    },

    // --------- Actions base ---------
    async refresh(container) {
      if (this.state.loading) return;
      await this.renderInto(container);
    },

    async sendNow(container) {
      if (this.state.loading) return;
      this.state.loading = true;
      this._toast('Invio reminder in corso...', 'info', 3000);

      try {
        const res = await this._fetchJSON('/api/send-reminders');
        const sent = res?.sent ?? 0;
        const dry = res?.dryRun === true;
        const msg = dry
          ? `Dry-run completato. Candidati: ${res?.candidates ?? 0}.`
          : `Inviati ${sent} reminder.`;
        this._toast(msg, 'success');
        await this.renderInto(container);
      } catch (err) {
        console.error(err);
        this._toast(err?.message || 'Errore invio reminder', 'error');
      } finally {
        this.state.loading = false;
      }
    },

    openWhatsApp(phone, message) {
      const normalized = this._normalizeE164(phone);
      if (!normalized) return this._toast('Numero non valido', 'error');
      const url = `https://wa.me/${normalized.replace('+','')}?text=${encodeURIComponent(message || 'Ciao!')}`;
      window.open(url, '_blank');
    },

    // --------- Phone tools ---------
    async previewPhones(container) {
      try {
        this._toast('Verifica numeri in corso...', 'info');
        const res = await this._fetchJSON('/api/phones-preview?limit=200');
        this.state.audit = res;
        this._renderAudit(container);
        this._toast(`Anteprima: ${res.toUpdateDocs} contatti con aggiornamenti, ${res.invalidFields} campi invalidi`, 'success');
      } catch (err) {
        console.error(err);
        this._toast(err?.message || 'Errore anteprima numeri', 'error');
      }
    },

    async applyPhones(container) {
      const ok = confirm('Confermi la normalizzazione dei numeri? (userà i dati di anteprima, applicazione a blocchi)');
      if (!ok) return;
      try {
        this._toast('Normalizzazione numeri in corso...', 'info', 4000);
        const res = await this._fetchJSON('/api/phones-apply?limit=100');
        this.state.applyResult = res;
        this._renderApplyResult(container);
        const msg = res.dryRun
          ? `Simulazione completata: ${res.docsToUpdate} contatti da aggiornare.`
          : `Aggiornati ${res.docsToUpdate} contatti (${res.fieldsUpdated} campi).`;
        this._toast(msg, 'success');

        // Dopo l'applicazione, ricarico lista scadenze per riflettere i numeri aggiornati
        await this.renderInto(container);
      } catch (err) {
        console.error(err);
        this._toast(err?.message || 'Errore applicazione numeri', 'error');
      }
    },

    // --------- UI helpers ---------
    _setActive(item) {
      document.querySelectorAll('.nav .nav-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
    },

    _normalizeE164(raw) {
      if (!raw) return null;
      const digits = String(raw).replace(/[^\d+]/g, '');
      if (digits.startsWith('+')) return digits;
      if (digits.startsWith('00')) return '+' + digits.slice(2);
      const just = digits.replace(/\D/g, '');
      if (/^3\d{8,9}$/.test(just)) return `+39${just}`;
      if (/^39\d{8,10}$/.test(just)) return `+${just}`;
      return null;
    },

    _daysBadge(daysLeft) {
      const n = Number(daysLeft);
      if (isNaN(n)) return `<span class="badge neutral">N/D</span>`;
      if (n > 30) return `<span class="badge success">>30</span>`;
      if (n > 7) return `<span class="badge ok">8–30</span>`;
      if (n >= 1) return `<span class="badge warn">1–7</span>`;
      if (n === 0) return `<span class="badge alert">OGGI</span>`;
      return `<span class="badge danger">${Math.abs(n)} gg fa</span>`;
    },

    _row(item) {
      const name = item.name || '—';
      const plan = item.plan || 'tesseramento';
      const phone = item.phone || '—';
      const msg = (() => {
        const base = name.split(' ')[0].toUpperCase();
        if (item.daysLeft > 0) return `${base}, promemoria: il tuo ${plan} scade tra ${item.daysLeft} giorno/i. Vuoi rinnovare ora? 💪`;
        if (item.daysLeft === 0) return `${base}, promemoria: il tuo ${plan} scade OGGI. Vuoi rinnovare ora? 💪`;
        return `${base}, promemoria: il tuo ${plan} è scaduto da ${Math.abs(item.daysLeft)} giorno/i. Vuoi riattivarlo? 💪`;
      })();

      return `
        <tr data-id="${item.id}">
          <td class="c-name">
            <div class="title">${name}</div>
            <div class="muted">${plan}</div>
          </td>
          <td class="c-phone">${phone}</td>
          <td class="c-days">${this._daysBadge(item.daysLeft)}</td>
          <td class="c-last">${item.lastReminderAt ? new Date(item.lastReminderAt).toLocaleString('it-IT') : '—'}</td>
          <td class="c-actions">
            <button class="btn btn-xs btn-wa" data-action="wa" data-phone="${phone}" data-message="${encodeURIComponent(msg)}" title="Apri WhatsApp">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
          </td>
        </tr>
      `;
    },

    _layout(state) {
      const count = state.items.length;
      const s = state.serverSettings || {};
      return `
        <section class="page-head">
          <div class="ph-left">
            <h2><i class="fas fa-exclamation-triangle"></i> Scadenze</h2>
            <div class="meta">
              <span>daysAhead: <b>${s.daysAhead ?? '—'}</b></span>
              <span>onlyExpired: <b>${s.onlyExpired ? 'true' : 'false'}</b></span>
              <span>cooldownDays: <b>${s.cooldownDays ?? '—'}</b></span>
              <span>dryRun: <b>${s.dryRun ? 'true' : 'false'}</b></span>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-secondary" data-action="refresh" title="Ricarica elenco"><i class="fas fa-rotate"></i> Aggiorna</button>
            <button class="btn btn-primary" data-action="send" title="Invia ora tramite API"><i class="fas fa-paper-plane"></i> Invia ora</button>
            <button class="btn" data-action="preview-phones" title="Verifica numeri"><i class="fas fa-check-double"></i> Verifica numeri</button>
            <button class="btn" data-action="apply-phones" title="Normalizza numeri"><i class="fas fa-wrench"></i> Normalizza numeri</button>
          </div>
        </section>

        <section class="summary">
          <div class="card stat">
            <div class="stat-num">${count}</div>
            <div class="stat-label">Clienti da contattare</div>
          </div>
          <div class="tips">
            <i class="fas fa-lightbulb"></i>
            <span>Consiglio: esegui “Verifica numeri” prima di inviare. Per applicare davvero imposta ALLOW_PHONE_APPLY=true su Vercel.</span>
          </div>
        </section>

        <section class="table-wrap">
          <table class="rt-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefono</th>
                <th>Stato</th>
                <th>Ultimo reminder</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              ${state.items.map(it => this._row(it)).join('')}
            </tbody>
          </table>
          ${count === 0 ? `<div class="empty">
              <i class="far fa-smile"></i>
              <p>Nessun cliente da contattare al momento.</p>
            </div>` : ''}
        </section>

        <section id="phones-audit" class="audit-wrap" style="margin-top:1rem;"></section>

        <style>
          .page-head{display:flex;align-items:center;gap:1rem;justify-content:space-between;flex-wrap:wrap;margin-bottom:1rem}
          .ph-left h2{margin:0}
          .page-head .meta{display:flex;gap:.75rem;flex-wrap:wrap;font-size:.9rem;opacity:.9}
          .actions .btn{margin-left:.5rem}
          .summary{margin:1rem 0;display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
          .card.stat{background:#0f172a;border:1px solid #243041;border-radius:12px;padding:1rem 1.25rem;display:inline-block;box-shadow:0 1px 8px rgba(0,0,0,.2)}
          .stat-num{font-size:2rem;font-weight:800}
          .stat-label{opacity:.8}
          .tips{display:flex;align-items:center;gap:.5rem;opacity:.85}
          .tips i{color:#f59e0b}
          .table-wrap{overflow:auto;border-radius:12px;border:1px solid #243041}
          .rt-table{width:100%;border-collapse:separate;border-spacing:0}
          .rt-table thead th{position:sticky;top:0;background:#0b1220;padding:.75rem;border-bottom:1px solid #243041;text-align:left;z-index:1}
          .rt-table td{padding:.75rem;border-bottom:1px solid #1e293b}
          .rt-table tr:hover{background:#0b1220}
          .muted{opacity:.8;font-size:.9rem}
          .badge{padding:.25rem .5rem;border-radius:.5rem;font-size:.75rem}
          .badge.success{background:#065f46;color:#a7f3d0}
          .badge.ok{background:#1f2937;color:#fef3c7}
          .badge.warn{background:#7c2d12;color:#fde68a}
          .badge.alert{background:#991b1b;color:#fecaca}
          .badge.danger{background:#7f1d1d;color:#fecaca}
          .badge.neutral{background:#374151;color:#e5e7eb}
          .btn-xs{font-size:.8rem;padding:.35rem .6rem;border-radius:8px}
          .btn-wa{background:#0b3d2e;color:#a7f3d0;border:1px solid #134e4a}
          .c-name .title{font-weight:600}
          .empty{padding:1.25rem;text-align:center;opacity:.8}
          .audit-card{background:#0f172a;border:1px solid #243041;border-radius:12px;padding:1rem}
          .audit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin:.75rem 0}
          .audit-pill{background:#0b1220;border:1px solid #243041;border-radius:10px;padding:.5rem .75rem}
          .audit-table{width:100%;border-collapse:collapse;margin-top:.5rem}
          .audit-table th,.audit-table td{padding:.5rem;border-bottom:1px solid #1e293b;text-align:left;font-size:.9rem}
          .small{font-size:.85rem;opacity:.9}
          .mono{font-family:monospace}
        </style>
      `;
    },

    _renderAudit(container) {
      const host = container.querySelector('#phones-audit');
      if (!host) return;
      const a = this.state.audit;
      if (!a) { host.innerHTML = ''; return; }

      const rows = (a.results || []).slice(0, 50).map(r => {
        const up = r.updates?.map(u => `<div><b>${u.field}</b>: <span class="mono">${u.before}</span> → <span class="mono">${u.after}</span></div>`).join('') || '';
        const inv = r.invalids?.map(u => `<div><b>${u.field}</b>: <span class="mono">${u.before}</span> → <i>INVAL</i></div>`).join('') || '';
        return `
          <tr>
            <td>${r.name || '—'}<div class="small mono">${r.id}</div></td>
            <td>${up || '—'}</td>
            <td>${inv || '—'}</td>
          </tr>
        `;
      }).join('');

      host.innerHTML = `
        <div class="audit-card">
          <h3 style="margin:0 0 .5rem 0">Verifica numeri (anteprima)</h3>
          <div class="audit-grid">
            <div class="audit-pill">Scansionati: <b>${a.scanned}</b></div>
            <div class="audit-pill">Da aggiornare (doc): <b>${a.toUpdateDocs}</b></div>
            <div class="audit-pill">Campi invalidi: <b>${a.invalidFields}</b></div>
          </div>
          <table class="audit-table">
            <thead><tr><th>Cliente</th><th>Update</th><th>Invalidi</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="small" style="margin-top:.5rem">Mostro max 50 righe per anteprima veloce. Usa l’endpoint per l’elenco completo.</div>
        </div>
      `;
    },

    _renderApplyResult(container) {
      const host = container.querySelector('#phones-audit');
      if (!host) return;
      const r = this.state.applyResult;
      if (!r) return;
      host.innerHTML = `
        <div class="audit-card">
          <h3 style="margin:0 0 .5rem 0">Risultato normalizzazione</h3>
          <div class="audit-grid">
            <div class="audit-pill">Dry-run: <b>${r.dryRun ? 'true' : 'false'}</b></div>
            <div class="audit-pill">Docs da aggiornare: <b>${r.docsToUpdate}</b></div>
            <div class="audit-pill">Campi aggiornati: <b>${r.fieldsUpdated}</b></div>
          </div>
          <div class="small">Se vedi <b>dryRun: true</b>, abilita su Vercel <code>ALLOW_PHONE_APPLY=true</code> e rilancia.</div>
        </div>
      `;
    },

    _skeleton() {
      return `<div style="padding:1rem"><i class="fas fa-spinner fa-spin"></i> Caricamento scadenze...</div>`;
    },

    _errorBox(msg) {
      return `<div style="padding:1rem;border:1px solid #7f1d1d;background:#1f2937;border-radius:8px;color:#fecaca"><b>Errore:</b> ${msg}</div>`;
    },

    _bindActions(container) {
      const btnRefresh = container.querySelector('[data-action="refresh"]');
      const btnSend = container.querySelector('[data-action="send"]');
      const btnPrev = container.querySelector('[data-action="preview-phones"]');
      const btnApply = container.querySelector('[data-action="apply-phones"]');
      const tbody = container.querySelector('tbody');

      if (btnRefresh) btnRefresh.addEventListener('click', () => this.refresh(container));
      if (btnSend) btnSend.addEventListener('click', () => this.sendNow(container));
      if (btnPrev) btnPrev.addEventListener('click', () => this.previewPhones(container));
      if (btnApply) btnApply.addEventListener('click', () => this.applyPhones(container));

      if (tbody) {
        tbody.addEventListener('click', (e) => {
          const target = e.target.closest('[data-action="wa"]');
          if (!target) return;
          const phone = target.getAttribute('data-phone');
          const message = decodeURIComponent(target.getAttribute('data-message') || '');
          this.openWhatsApp(phone, message);
        });
      }
    },

    _updateBadge(n) {
      const b = document.getElementById('scadenzeBadge');
      if (!b) return;
      if (!n || n <= 0) { b.textContent = ''; b.style.display = 'none'; }
      else { b.textContent = n; b.style.display = 'inline-block'; }
    },

    async _fetchJSON(url) {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t}`);
      }
      return res.json();
    },

    _toast(msg, type='info', duration=4000) {
      if (window.Toast_Instance?.show) return window.Toast_Instance.show(msg, type, duration);
      if (window.App?.modules?.toast?.success && window.App?.modules?.toast?.error) {
        const fn = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
        return window.App.modules.toast[fn](msg);
      }
      console.log(`[${type}]`, msg);
    }
  };

  window.ScadenzeUI = ScadenzeUI;
  document.addEventListener('DOMContentLoaded', () => ScadenzeUI.init());
})();
