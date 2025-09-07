// assets/js/modules/analytics.js
(function () {
  'use strict';

  class AnalyticsModule {
    async init() {
      console.log('📊 [Analytics] init…');
      console.log('✅ [Analytics] initialized');
    }

    renderDashboard(container) {
      const s = window.App?.modules?.storage || window.Storage_Instance;
      if (!s) {
        container.innerHTML = `<section style="padding:1rem"><h2>Dashboard</h2><p>Storage non disponibile.</p></section>`;
        return;
      }

      // Dati reali in cache
      const members = s.getMembersCached();
      const reminders = s.getRemindersCached();

      const today = new Date(); today.setHours(0,0,0,0);
      const daysDiff = (d) => Math.ceil((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - today) / 86400000);

      let total = members.length;
      let expired = 0, expiring30 = 0, active = 0;
      for (const m of members) {
        const n = typeof m.daysTillExpiry === 'number'
          ? m.daysTillExpiry
          : (m.dataScadenza ? daysDiff(new Date(m.dataScadenza)) : null);
        if (n === null) { active++; continue; }
        if (n < 0) expired++;
        else if (n <= 30) expiring30++;
        else active++;
      }

      const kpi = [
        { key:'total', label:'Tesserati totali', value: total, icon:'fa-users', action: {page:'tesserati'} },
        { key:'active', label:'Attivi', value: active, icon:'fa-circle-check', action: {page:'tesserati', status:'active'} },
        { key:'expiring', label:'In scadenza ≤30gg', value: expiring30, icon:'fa-hourglass-half', action: {page:'tesserati', status:'expiring'} },
        { key:'expired', label:'Scaduti', value: expired, icon:'fa-triangle-exclamation', action: {page:'tesserati', status:'expired'} },
        { key:'reminders', label:'Reminders', value: reminders.length, icon:'fa-bell', action: {page:'automazione'} },
      ];

      const lastSync = s.cache?.lastSync ? new Date(s.cache.lastSync).toLocaleString('it-IT') : '—';

      container.innerHTML = `
        <section class="dash-sec" style="padding:1rem">
          <div class="dash-head" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1rem;">
            <div>
              <h2 style="margin:0;"><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
              <small style="opacity:.7">Ultimo aggiornamento: ${lastSync}</small>
            </div>
            <div>
              <button id="kpiRefresh" class="btn btn-outline"><i class="fas fa-rotate-right"></i> Aggiorna</button>
            </div>
          </div>

          <div class="kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
            ${kpi.map(k => `
              <div class="kpi-card" data-key="${k.key}" style="border:1px solid #243041;border-radius:12px;padding:1rem;cursor:pointer;background:var(--glass-bg);">
                <div style="display:flex;align-items:center;gap:.6rem;">
                  <div class="kpi-ico" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;border:1px solid #243041;background:#0b1220;">
                    <i class="fas ${k.icon}"></i>
                  </div>
                  <div style="flex:1">
                    <div style="font-size:1.4rem;font-weight:700">${k.value}</div>
                    <div style="opacity:.75">${k.label}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top:1.2rem;opacity:.8;font-size:.9rem">
            <i class="fas fa-lightbulb"></i> Clicca una card per aprire il relativo filtro.
          </div>
        </section>
      `;

      // Bind
      container.querySelectorAll('.kpi-card').forEach(card => {
        card.addEventListener('click', () => {
          const key = card.getAttribute('data-key');
          const cfg = kpi.find(x => x.key === key)?.action;
          if (!cfg) return;

          if (cfg.page === 'tesserati') {
            this._goToTesserati(cfg.status);
          } else if (cfg.page) {
            window.App?.renderPage?.(cfg.page);
          }
        });
      });

      container.querySelector('#kpiRefresh')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true; btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Aggiorno…`;
        try {
          await Promise.allSettled([
            window.App?.modules?.storage?.refreshMembers?.(),
            window.App?.modules?.storage?.refreshReminders?.()
          ]);
          this.renderDashboard(container);
        } finally {
          btn.disabled = false; btn.innerHTML = `<i class="fas fa-rotate-right"></i> Aggiorna`;
        }
      });
    }

    _goToTesserati(status) {
      const setFilter = () => {
        const mod = window.App?.modules?.contacts;
        if (!mod) return;
        // prova a impostare filtro UI
        mod.statusFilter = status || 'all';
        const sel = document.getElementById('contactsStatus');
        if (sel) { sel.value = status || 'all'; }
        if (typeof mod._renderTable === 'function') mod._renderTable();
      };

      window.App?.renderPage?.('tesserati');
      // aspetta che la pagina monti
      setTimeout(setFilter, 50);
    }
  }

  window.AnalyticsModule = new AnalyticsModule();
})();
