// assets/js/modules/scadenze.js
(function () {
  const ScadenzeUI = {
    state: {
      loading: false,
      items: [],
      serverSettings: null
    },

    init() {
      // Bind al click della voce di menu "Scadenze"
      const navItem = document.querySelector('.nav-item[data-page="scadenze"]');
      if (navItem && !navItem.dataset.rtBound) {
        navItem.addEventListener('click', (e) => {
          e.preventDefault();
          this.renderInto(document.getElementById('page-content'));
        });
        navItem.dataset.rtBound = '1';
      }

      // Se all'avvio è già attiva la pagina scadenze, renderizza
      if (navItem && navItem.classList.contains('active')) {
        this.renderInto(document.getElementById('page-content'));
      }
    },

    async renderInto(container) {
      if (!container) return;
      this.state.loading = true;
      container.innerHTML = this._skeleton();

      try {
        // Impostazioni server (no segreti)
        const health = await this._fetchJSON('/api/health');
        this.state.serverSettings = health?.env ? {
          daysAhead: health.env.daysAhead,
          onlyExpired: health.env.onlyExpired,
          cooldownDays: health.env.cooldownDays,
          dryRun: health.env.dryRun
        } : null;

        // Anteprima scadenze
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

        // Ricarico per aggiornare cooldown/lastReminderAt
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
      if (!normalized) {
        this._toast('Numero non valido', 'error');
        return;
      }
      const url = `https://wa.me/${normalized.replace('+','')}?text=${encodeURIComponent(message || 'Ciao!')}`;
      window.open(url, '_blank');
    },

    // ----------------- Helpers -----------------
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
            <button class="btn btn-xs btn-wa" data-action="wa" data-phone="${phone}" data-message="${encodeURIComponent(msg)}">
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
          <h2><i class="fas fa-exclamation-triangle"></i> Scadenze</h2>
          <div class="meta">
            <span>daysAhead: <b>${s.daysAhead ?? '—'}</b></span>
            <span>onlyExpired: <b>${s.onlyExpired ? 'true' : 'false'}</b></span>
            <span>cooldownDays: <b>${s.cooldownDays ?? '—'}</b></span>
            <span>dryRun: <b>${s.dryRun ? 'true' : 'false'}</b></span>
          </div>
          <div class="actions">
            <button class="btn btn-secondary" data-action="refresh"><i class="fas fa-rotate"></i> Aggiorna elenco</button>
            <button class="btn btn-primary" data-action="send"><i class="fas fa-paper-plane"></i> Invia ora</button>
          </div>
        </section>

        <section class="summary">
          <div class="card stat">
            <div class="stat-num">${count}</div>
            <div class="stat-label">Clienti da contattare</div>
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
        </section>

        <style>
          .page-head{display:flex;align-items:center;gap:1rem;justify-content:space-between;flex-wrap:wrap;margin-bottom:1rem}
          .page-head .meta{display:flex;gap:1rem;flex-wrap:wrap;font-size:.9rem;opacity:.9}
          .actions .btn{margin-right:.5rem}
          .summary{margin:1rem 0}
          .card.stat{background:#101827;border:1px solid #243041;border-radius:10px;padding:1rem;display:inline-block}
          .stat-num{font-size:2rem;font-weight:700}
          .stat-label{opacity:.8}
          .table-wrap{overflow:auto}
          .rt-table{width:100%;border-collapse:collapse}
          .rt-table th,.rt-table td{padding:.75rem;border-bottom:1px solid #243041;text-align:left}
          .muted{opacity:.8;font-size:.9rem}
          .badge{padding:.25rem .5rem;border-radius:.5rem;font-size:.75rem}
          .badge.success{background:#065f46;color:#a7f3d0}
          .badge.ok{background:#1f2937;color:#fef3c7}
          .badge.warn{background:#7c2d12;color:#fde68a}
          .badge.alert{background:#991b1b;color:#fecaca}
          .badge.danger{background:#7f1d1d;color:#fecaca}
          .badge.neutral{background:#374151;color:#e5e7eb}
          .btn-xs{font-size:.8rem;padding:.3rem .5rem}
          .btn-wa{background:#1f2937;color:#a7f3d0;border:1px solid #334155}
          .c-name .title{font-weight:600}
        </style>
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
      const tbody = container.querySelector('tbody');

      if (btnRefresh) btnRefresh.addEventListener('click', () => this.refresh(container));
      if (btnSend) btnSend.addEventListener('click', () => this.sendNow(container));

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
      if (!n || n <= 0) {
        b.textContent = '';
        b.style.display = 'none';
      } else {
        b.textContent = n;
        b.style.display = 'inline-block';
      }
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
