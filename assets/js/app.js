// assets/js/app.js
(function () {
  'use strict';

  const App = {
    state: { currentPage: 'dashboard', inited: false },
    modules: {},

    async init() {
      if (this.state.inited) return true;

      // Layout: assicurati che esistano i contenitori
      this.sidebar = document.getElementById('sidebar');
      this.container = document.getElementById('page-content');
      if (!this.container) {
        console.error('Container #page-content mancante');
        return false;
      }

      // Storage warm-up senza bloccare l’UI
      const S = window.Storage_Instance;
      try {
        if (S && !S.isInitialized && typeof S.init === 'function') {
          await S.init();
        }
        // in parallelo, prova a caricare cache
        await Promise.allSettled([
          S?.refreshMembers?.(),
          S?.refreshReminders?.(),
          S?.refreshTemplates?.()
        ]);
      } catch (e) {
        console.warn('Storage init non critico:', e);
      }

      this._bindNavigation();
      this._updateBadges(); // primo update
      this.state.inited = true;

      console.log('TribuReminder Application initialized successfully');
      return true;
    },

    _bindNavigation() {
      const nav = document.getElementById('main-navigation');
      if (!nav) return;

      nav.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (!item) return;
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (!page) return;

        // attiva elemento
        nav.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        // render
        this.renderPage(page);
      });
    },

    async renderPage(page) {
      this.state.currentPage = page;
      const c = this.container;
      if (!c) return;

      // mapping pagina -> modulo
      const map = {
        dashboard : () => window.AnalyticsModule,
        tesserati : () => window.ContactsModule,
        scadenze  : () => window.ScadenzeModule,
        marketing : () => window.MarketingModule,
        calendario: () => window.CalendarModule,
        automazione:() => window.RemindersModule,
        whatsapp  : () => window.WhatsAppModule,
        importcsv : () => null // se non hai ancora un modulo dedicato
      };

      const modFactory = map[page] || (()=>null);
      const mod = modFactory();

      if (mod && typeof mod.init === 'function') {
        try { await mod.init(); } catch (e) { console.warn(`[${page}] init err:`, e); }
      }

      if (mod && typeof mod.mount === 'function') {
        try {
          await mod.mount(c);
        } catch (e) {
          console.error(`[${page}] mount error`, e);
          c.innerHTML = `
            <section class="card">
              <h2>${this._title(page)}</h2>
              <p>Errore durante il caricamento della sezione.</p>
            </section>`;
        }
      } else {
        // fallback se modulo mancante
        c.innerHTML = `
          <section class="card">
            <h2>${this._title(page)}</h2>
            <p>${page === 'importcsv'
                ? 'Carica qui il tuo CSV per aggiornare i tesserati (modulo in arrivo).'
                : 'Modulo non disponibile.'}</p>
          </section>`;
      }

      // aggiorna badge in background
      setTimeout(()=>this._updateBadges(), 0);
    },

    _title(page){
      const map = {
        dashboard:'Dashboard',
        tesserati:'Tesserati CSEN',
        scadenze: 'Scadenze',
        marketing:'Marketing',
        calendario:'Calendario',
        automazione:'Automazione',
        whatsapp:'WhatsApp',
        importcsv:'Import CSV'
      };
      return map[page] || page;
    },

    _updateBadges() {
      const S = window.Storage_Instance;
      if (!S) return;

      try {
        const members = S.getMembersCached?.() || [];
        const reminders = S.getRemindersCached?.() || [];

        // calcolo scadenze: scaduti + in scadenza ≤30gg
        const DAY = 86400000;
        const parseD = (v)=>{
          if (!v) return null;
          if (v instanceof Date) return v;
          if (v?.toDate) try { return v.toDate(); } catch {}
          const d = new Date(String(v)); return isNaN(d)?null:d;
        };
        const daysLeft = (d)=>{
          if (!d) return null;
          const t = new Date();
          const a = Date.UTC(t.getFullYear(),t.getMonth(),t.getDate());
          const b = Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());
          return Math.floor((b-a)/DAY);
        };

        let due = 0;
        for (const m of members) {
          const ex = parseD(m.scadenza || m.expiryDate || m.expiry || m.nextRenewal);
          const dl = daysLeft(ex);
          if (dl == null) continue;
          if (dl < 0 || dl <= 30) due++;
        }

        const bScad = document.getElementById('badge-scadenze');
        if (bScad) bScad.textContent = due > 0 ? String(due) : '';

        const bAuto = document.getElementById('badge-automazione');
        if (bAuto) bAuto.textContent = reminders.length > 0 ? String(reminders.length) : '';
      } catch (e) {
        console.warn('updateBadges error', e);
      }
    }
  };

  window.App = App;
})();
