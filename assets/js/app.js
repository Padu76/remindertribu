// assets/js/app.js
(function () {
  'use strict';

  const qs = (s) => document.querySelector(s);

  // Helper: prova a montare un modulo con le varie convenzioni usate in progetto
  function mountModule(mod, container, page) {
    if (!mod || !container) return false;

    try {
      // 1) scadenze.js: { renderInto(container) }
      if (typeof mod.renderInto === 'function') {
        mod.renderInto(container);
        return true;
      }
      // 2) moduli classici: { mount(container) }
      if (typeof mod.mount === 'function') {
        mod.mount(container);
        return true;
      }
      // 3) pattern "getPageContent" + "initializePage"
      if (typeof mod.getPageContent === 'function') {
        const html = mod.getPageContent(page) || mod.getPageContent();
        if (typeof html === 'string') container.innerHTML = html;
        if (typeof mod.initializePage === 'function') mod.initializePage(container, page);
        return true;
      }
      // 4) pattern "initializePage" che disegna da sé
      if (typeof mod.initializePage === 'function') {
        container.innerHTML = '';
        mod.initializePage(container, page);
        return true;
      }
      // 5) pattern "render" generico
      if (typeof mod.render === 'function') {
        mod.render(container, page);
        return true;
      }
    } catch (err) {
      console.error('Errore mount modulo:', err);
    }
    return false;
  }

  const App = {
    modules: {},

    async init() {
      // Colleziona moduli se già caricati
      this.modules.whatsapp   = window.WhatsAppModule || this.modules.whatsapp || null;   // tuo modulo "template"
      this.modules.contacts   = window.ContactsModule || this.modules.contacts || null;
      this.modules.analytics  = window.AnalyticsModule || this.modules.analytics || null;
      this.modules.reminders  = window.RemindersModule || this.modules.reminders || null;
      this.modules.billing    = window.BillingModule || this.modules.billing || null;
      this.modules.scadenze   = window.ScadenzeUI || this.modules.scadenze || null;
      this.modules.calendar   = window.CalendarModule || this.modules.calendar || null;    // se esiste

      // Inizializza se previsto
      for (const key of Object.keys(this.modules)) {
        const m = this.modules[key];
        if (m && typeof m.init === 'function') {
          try { await m.init(); } catch (e) { console.warn(`Init modulo ${key} fallito:`, e); }
        }
      }

      this.bindNavigation();

      // Se non c'è un item attivo, vai alla dashboard
      const nav = qs('#main-navigation');
      const active = nav ? nav.querySelector('.nav-item.active') : null;
      if (!active) this.renderPage('dashboard');
      else this.renderPage(active.getAttribute('data-page'));

      console.log('TribuReminder Application initialized successfully');
      return true;
    },

    // ---- UI helpers
    hideLoading() { qs('#loading-screen')?.classList.add('hidden'); },
    showMainApp() { this.hideLoading(); qs('#auth-container')?.classList.add('hidden'); qs('#main-app')?.classList.remove('hidden'); },
    showAuth()    { this.hideLoading(); qs('#main-app')?.classList.add('hidden'); qs('#auth-container')?.classList.remove('hidden'); },

    // ---- Router
    bindNavigation() {
      const nav = qs('#main-navigation');
      if (!nav) return;

      nav.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (!item) return;
        const page = item.getAttribute('data-page');
        if (!page) return;

        nav.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        this.renderPage(page);
        window.dispatchEvent(new CustomEvent('route:change', { detail: { page } }));
        console.log('Page changed to:', page);
      });
    },

    renderPage(page) {
      const container = qs('#page-content');
      if (!container) return;

      // Mappa pagina → modulo
      const map = {
        'dashboard': () => {
          // Se il modulo analytics ha una dashboard, usala; altrimenti placeholder
          if (this.modules.analytics && (
                this.modules.analytics.renderDashboard ||
                this.modules.analytics.getPageContent ||
                this.modules.analytics.mount
              )) {
            if (typeof this.modules.analytics.renderDashboard === 'function') {
              container.innerHTML = '';
              return this.modules.analytics.renderDashboard(container);
            }
            if (mountModule(this.modules.analytics, container, 'dashboard')) return;
          }
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
              <p>Benvenuto in ReminderTribù.</p>
            </section>
          `;
        },

        'tesserati': () => {
          if (mountModule(this.modules.contacts, container, 'tesserati')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-id-card"></i> Tesserati</h2>
              <p>Modulo contatti non disponibile.</p>
            </section>
          `;
        },

        'scadenze': () => {
          if (mountModule(this.modules.scadenze, container, 'scadenze')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-exclamation-triangle"></i> Scadenze</h2>
              <p>Modulo scadenze non disponibile.</p>
            </section>
          `;
        },

        'marketing': () => {
          // Marketing spesso sta in analytics.js
          if (mountModule(this.modules.analytics, container, 'marketing')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-bullhorn"></i> Marketing</h2>
              <p>Modulo marketing/analytics non disponibile.</p>
            </section>
          `;
        },

        'calendario': () => {
          if (mountModule(this.modules.calendar, container, 'calendario')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-calendar-alt"></i> Calendario</h2>
              <p>Modulo calendario non disponibile.</p>
            </section>
          `;
        },

        'automazione': () => {
          // Automazione: spesso reminders (cron/flows) o billing (webhook/stripe)
          if (mountModule(this.modules.reminders, container, 'automazione')) return;
          if (mountModule(this.modules.billing, container, 'automazione')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-robot"></i> Automazione</h2>
              <p>Nessun modulo di automazione disponibile.</p>
            </section>
          `;
        },

        'whatsapp': () => {
          if (mountModule(this.modules.whatsapp, container, 'whatsapp')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fab fa-whatsapp"></i> WhatsApp</h2>
              <p>Modulo WhatsApp non disponibile.</p>
            </section>
          `;
        },

        'import': () => {
          // Potresti avere un modulo import in contacts/storage; provo entrambi
          if (mountModule(this.modules.contacts, container, 'import')) return;
          if (mountModule(this.modules.storage, container, 'import')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-upload"></i> Import CSV</h2>
              <p>Funzione import non disponibile.</p>
            </section>
          `;
        }
      };

      // Esegue la pagina o fallback
      if (map[page]) map[page]();
      else container.innerHTML = `<section style="padding:1rem"><h2>${page}</h2><p>Pagina non trovata.</p></section>`;
    }
  };

  window.App = App;
  window.App_Instance = App;

})();
