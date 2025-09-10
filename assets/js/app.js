// assets/js/app.js
(function () {
  'use strict';

  const App = {
    modules: {},                 // moduli agganciati
    _initedModules: new Set(),   // moduli già inizializzati (init one-shot)
    state: {
      currentPage: 'dashboard'
    },

    async init() {
      try {
        this._wireModules();          // auto-wiring dai global window.*
        await this._waitStorage();    // aspetta Storage + primo warmup
        this._bindUI();               // navbar + refresh
        this._renderInitialPage();    // monta pagina attiva
        this._updateBadges();         // aggiorna contatori in sidebar
        console.log('TribuReminder Application initialized successfully');
        return true;
      } catch (e) {
        console.error('❌ App init error:', e);
        this._renderError('Errore di inizializzazione. Riprova a ricaricare la pagina.');
        return false;
      }
    },

    // ---------------- Wiring ----------------
    _wireModules() {
      const candidates = {
        storage:   window.Storage_Instance,
        analytics: window.AnalyticsModule,
        auth:      window.AuthModule,         // può essere uno stub
        contacts:  window.ContactsModule,
        scadenze:  window.ScadenzeModule,
        marketing: window.MarketingModule,
        reminders: window.RemindersModule,
        calendar:  window.CalendarModule,
        billing:   window.BillingModule,
        whatsapp:  window.WhatsAppModule,
        importcsv: window.ImportCsvModule     // opzionale
      };
      this.modules = candidates;
      if (!this.modules.auth) {
        this.modules.auth = { init: async ()=>true, mount: ()=>{} };
      }
    },

    async _waitStorage() {
      const timeoutMs = 10000; // 10s
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (this.modules.storage) break;
        await new Promise(r => setTimeout(r, 100));
      }
      const s = this.modules.storage;
      if (!s) throw new Error('Storage non disponibile');

      if (!s.isInitialized && typeof s.init === 'function') {
        await s.init();
      }

      if (typeof s.getMembersCached === 'function' &&
          s.getMembersCached().length === 0 &&
          typeof s.refreshMembers === 'function') {
        try { await s.refreshMembers(); } catch(_) {}
      }
    },

    // --------------- UI / Routing ---------------
    _bindUI() {
      const nav = document.getElementById('main-navigation');
      if (nav) {
        nav.addEventListener('click', (e) => {
          const item = e.target.closest('.nav-item');
          if (!item) return;
          const page = item.getAttribute('data-page');
          if (!page) return;
          this._activateNavItem(item);
          this.renderPage(page);
        });

        const active = nav.querySelector('.nav-item.active');
        if (active) this.state.currentPage = active.getAttribute('data-page') || 'dashboard';
      }

      const btnRefresh = document.getElementById('btn-refresh');
      if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
          btnRefresh.disabled = true;
          try {
            await this._refreshData();
            await this.renderPage(this.state.currentPage);
            this._updateBadges();
          } finally {
            btnRefresh.disabled = false;
          }
        });
      }
    },

    _renderInitialPage() {
      this.renderPage(this.state.currentPage || 'dashboard');
    },

    _activateNavItem(item) {
      document.querySelectorAll('.nav .nav-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
    },

    // --------------- Render ---------------
    async renderPage(page) {
      this.state.currentPage = page;
      const container = document.getElementById('page-content');
      const titleEl = document.getElementById('page-title');
      if (titleEl) titleEl.textContent = this._prettyTitle(page);
      if (!container) return;

      container.innerHTML = `
        <div class="loading">
          <i class="fa-solid fa-spinner fa-spin"></i> Caricamento…
        </div>
      `;

      const map = {
        dashboard: 'analytics',
        tesserati: 'contacts',
        scadenze:  'scadenze',
        marketing: 'marketing',
        calendario:'calendar',
        automazione:'reminders',
        whatsapp:  'whatsapp',
        'import-csv':'importcsv'
      };

      const key = map[page] || page;
      const mod = this.modules[key];

      if (!mod) {
        container.innerHTML = `
          <section class="empty-state">
            <h2>Modulo ${this._prettyTitle(page)} non disponibile</h2>
            <p>Il modulo "${key}" non è stato caricato. Verifica che il file esista e che esponga <code>window.${this._guessGlobalName(key)}</code>.</p>
          </section>
        `;
        return;
      }

      if (typeof mod.init === 'function' && !this._initedModules.has(key)) {
        try { await mod.init(); } catch (e) { console.warn(`[${key}] init`, e); }
        this._initedModules.add(key);
      }

      if (typeof mod.mount === 'function') {
        try { await mod.mount(container, { page, app: this }); }
        catch (e) {
          console.error(`[${key}] mount error:`, e);
          container.innerHTML = `
            <section class="empty-state">
              <h2>Errore nel modulo ${this._prettyTitle(page)}</h2>
              <p>${e?.message || e}</p>
            </section>
          `;
        }
      } else {
        container.innerHTML = `
          <section class="empty-state">
            <h2>${this._prettyTitle(page)}</h2>
            <p>Modulo caricato ma non espone <code>mount(container)</code>.</p>
          </section>
        `;
      }
    },

    // --------------- Helpers ---------------
    async _refreshData() {
      const s = this.modules.storage;
      if (!s) return;
      const ops = [];
      if (typeof s.refreshMembers === 'function')   ops.push(s.refreshMembers());
      if (typeof s.refreshReminders === 'function') ops.push(s.refreshReminders());
      if (typeof s.refreshTemplates === 'function') ops.push(s.refreshTemplates());
      try { await Promise.all(ops); } catch(_) {}
    },

    _updateBadges() {
      const s = this.modules.storage;
      if (!s || typeof s.getMembersCached !== 'function') return;
      const list = s.getMembersCached() || [];
      const expired  = list.filter(x => x.status === 'expired').length;
      const expiring = list.filter(x => x.status === 'expiring').length;

      const bScad = document.getElementById('badge-scadenze');
      if (bScad) {
        const total = expired + expiring;
        bScad.textContent = total;
        bScad.hidden = total <= 0;
      }

      const tpls = (typeof s.getTemplates === 'function' ? s.getTemplates() : {}) || {};
      const bMkt = document.getElementById('badge-marketing');
      if (bMkt) {
        const n = Object.keys(tpls).length;
        bMkt.textContent = n;
        bMkt.hidden = n <= 0;
      }

      const bCal = document.getElementById('badge-calendario');
      if (bCal) bCal.hidden = true;

      const rems = (typeof s.getRemindersCached === 'function' ? s.getRemindersCached() : []) || [];
      const bAuto = document.getElementById('badge-automazione');
      if (bAuto) {
        bAuto.textContent = rems.length;
        bAuto.hidden = rems.length <= 0;
      }
    },

    _prettyTitle(page) {
      const map = {
        dashboard: 'Dashboard',
        tesserati: 'Tesserati CSEN',
        scadenze:  'Scadenze',
        marketing: 'Marketing',
        calendario:'Calendario',
        automazione:'Automazione',
        whatsapp:  'WhatsApp',
        'import-csv': 'Import CSV'
      };
      return map[page] || (page.charAt(0).toUpperCase() + page.slice(1));
    },

    _guessGlobalName(key) {
      const map = {
        analytics: 'AnalyticsModule',
        contacts:  'ContactsModule',
        scadenze:  'ScadenzeModule',
        marketing: 'MarketingModule',
        reminders: 'RemindersModule',
        calendar:  'CalendarModule',
        billing:   'BillingModule',
        whatsapp:  'WhatsAppModule',
        importcsv: 'ImportCsvModule'
      };
      return map[key] || key;
    },

    _renderError(msg) {
      const container = document.getElementById('page-content');
      if (!container) return;
      container.innerHTML = `
        <section class="empty-state">
          <h2>Errore</h2>
          <p>${msg}</p>
        </section>
      `;
    }
  };

  // Esporta global
  window.App = App;
  window.App_Instance = App; // compat vecchio codice

  // -------- AUTOBOOT SICURO --------
  function boot() {
    try { window.App.init(); }
    catch (e) { console.error('App boot error:', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    // con <script defer> DOM è già pronto
    boot();
  }
})();
