// assets/js/modules/billing.js
(function () {
  'use strict';

  class BillingModule {
    async init() {
      console.log('💰 Initializing Billing module...');
      try {
        await this.loadUsageData();
        console.log('✅ Billing module initialized');
      } catch (e) {
        console.warn('⚠️ Billing module initialization soft-failed:', e?.message || e);
      }
      return true;
    }

    async loadUsageData() {
      const storage = window.App?.modules?.storage || window.Storage_Instance;
      if (!storage) {
        console.warn('⚠️ Billing: storage non disponibile');
        this.render({ members: 'N/D', expiring: 'N/D', expired: 'N/D' });
        return;
      }

      let stats = null;
      if (typeof storage.getUserStats === 'function') {
        stats = await storage.getUserStats();
      } else {
        console.warn('⚠️ Billing: getUserStats non disponibile, calcolo da cache.');
        const list = storage.getMembersCached ? storage.getMembersCached() : [];
        stats = {
          members: list.length || 0,
          expiring: list.filter(m => m.status === 'expiring').length || 0,
          expired: list.filter(m => m.status === 'expired').length || 0
        };
      }
      this.render(stats);
    }

    render(stats) {
      // opzionale: se non esiste una sezione billing dedicata, salta
      const el = document.getElementById('billing-usage');
      if (!el) return;
      el.innerHTML = `
        <div class="kpi-grid">
          <div class="card"><div class="kpi-label">Tesserati</div><div class="kpi-value">${stats.members}</div></div>
          <div class="card"><div class="kpi-label">In scadenza</div><div class="kpi-value">${stats.expiring}</div></div>
          <div class="card"><div class="kpi-label">Scaduti</div><div class="kpi-value">${stats.expired}</div></div>
        </div>
      `;
    }
  }

  window.BillingModule = new BillingModule();
})();
