// assets/js/app.js
(function () {
  'use strict';

  const qs = (s) => document.querySelector(s);

  // Montaggio universale: supporta vari pattern usati nei moduli
  function mountModule(mod, container, page) {
    if (!mod || !container) return false;
    try {
      // 1) scadenze.js (oggetto): { renderInto(container) }
      if (typeof mod.renderInto === 'function') { mod.renderInto(container); return true; }
      // 2) pattern classico: { mount(container) }
      if (typeof mod.mount === 'function') { mod.mount(container); return true; }
      // 3) pattern pagina: { getPageContent(page), initializePage(container,page) }
      if (typeof mod.getPageContent === 'function') {
        const html = mod.getPageContent(page) || mod.getPageContent();
        if (typeof html === 'string') container.innerHTML = html;
        if (typeof mod.initializePage === 'function') mod.initializePage(container, page);
        return true;
      }
      // 4) solo initializePage
      if (typeof mod.initializePage === 'function') { container.innerHTML=''; mod.initializePage(container,page); return true; }
      // 5) render generico
      if (typeof mod.render === 'function') { mod.render(container,page); return true; }
    } catch (e) {
      console.error('Errore montaggio modulo:', e);
    }
    return false;
  }

  // Se window.X è una classe, istanziala; se è già istanza/oggetto, usala
  function ensureInstance(MaybeClassOrInstance) {
    if (!MaybeClassOrInstance) return null;
    try {
      // euristica: le classi JS hanno "prototype" con "constructor"
      const isClass = typeof MaybeClassOrInstance === 'function' &&
                      /^class\s/.test(Function.prototype.toString.call(MaybeClassOrInstance));
      if (isClass) return new MaybeClassOrInstance();
      // Oggetto/istanza già pronto
      return MaybeClassOrInstance;
    } catch {
      return MaybeClassOrInstance;
    }
  }

  const App = {
    modules: {},

    async init() {
      // 1) Firebase prima di tutto
      if (window.Firebase_Instance?.init) {
        try { await window.Firebase_Instance.init(); }
        catch (e) { console.warn('Firebase init error:', e); }
      }

      // 2) Storage (usa Firebase se disponibile)
      if (window.Storage_Instance?.init) {
        try { await window.Storage_Instance.init(); }
        catch (e) { console.warn('Storage init error:', e); }
      }
      // Espongo storage nel namespace atteso dai moduli
      this.modules.storage = window.Storage_Instance || null;

      // 3) Istanzio i moduli caricati via <script>
      this.modules.scadenze  = window.ScadenzeUI || null; // oggetto
      this.modules.contacts  = ensureInstance(window.ContactsModule);
      this.modules.analytics = ensureInstance(window.AnalyticsModule);
      this.modules.reminders = ensureInstance(window.RemindersModule);
      this.modules.billing   = ensureInstance(window.BillingModule);
      this.modules.whatsapp  = ensureInstance(window.WhatsAppModule);
      this.modules.calendar  = ensureInstance(window.CalendarModule); // se esiste

      // 4) init() dei moduli (se esiste)
      for (const key of Object.keys(this.modules)) {
        const m = this.modules[key];
        if (m && typeof m.init === 'function') {
          try { await m.init(); } catch (e) { console.warn(`Init modulo ${key} fallito:`, e); }
        }
      }

      // 5) Bind router e mostra app
      this.bindNavigation();
      this.showMainApp();

      const nav = qs('#main-navigation');
      const active = nav ? nav.querySelector('.nav-item.active') : null;
      this.renderPage(active ? active.getAttribute('data-page') : 'dashboard');

      console.log('TribuReminder Application initialized successfully');
      return true;
    },

    hideLoading() { qs('#loading-screen')?.classList.add('hidden'); },
    showMainApp() { this.hideLoading(); qs('#auth-container')?.classList.add('hidden'); qs('#main-app')?.classList.remove('hidden'); },
    showAuth()    { this.hideLoading(); qs('#main-app')?.classList.add('hidden'); qs('#auth-container')?.classList.remove('hidden'); },

    bindNavigation() {
      const nav = qs('#main-navigation'); if (!nav) return;
      nav.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item'); if (!item) return;
        const page = item.getAttribute('data-page'); if (!page) return;
        nav.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        this.renderPage(page);
        window.dispatchEvent(new CustomEvent('route:change', { detail: { page } }));
        console.log('Page changed to:', page);
      });
    },

    renderPage(page) {
      const container = qs('#page-content'); if (!container) return;

      const map = {
        dashboard: () => {
          // Se analytics ha una dashboard, prova a usarla
          if (this.modules.analytics &&
              (this.modules.analytics.renderDashboard ||
               this.modules.analytics.getPageContent ||
               this.modules.analytics.mount)) {
            if (typeof this.modules.analytics.renderDashboard === 'function') {
              container.innerHTML = ''; return this.modules.analytics.renderDashboard(container);
            }
            if (mountModule(this.modules.analytics, container, 'dashboard')) return;
          }
          container.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2><p>Benvenuto in ReminderTribù.</p></section>`;
        },

        tesserati: () => {
          if (mountModule(this.modules.contacts, container, 'tesserati')) return;
          container.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-id-card"></i> Tesserati</h2><p>Modulo contatti non disponibile.</p></section>`;
        },

        scadenze: () => {
          if (mountModule(this.modules.scadenze, container, 'scadenze')) return;
          container.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-exclamation-triangle"></i> Scadenze</h2><p>Modulo scadenze non disponibile.</p></section>`;
        },

        marketing: () => {
          if (mountModule(this.modules.analytics, container, 'marketing')) return;
          container.innerHTML = `<section style="padding:1rem"><h2><i class="fas a-bullhorn"></i> Marketing</h2><p>Modulo marketing/analytics non disponibile.</p></section>`;
        },

        calendario: () => {
          if (mountModule(this.modules.calendar, container, 'calendario')) return;
          container.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-calendar-alt"></i> Calendario</h2><p>Modulo calendario non disponibile.</p></section>`;
        },

        automazione: () => {
          if (mountModule(this.modules.reminders, container, 'automazione')) return;
          if (mountModule(this.modules.billing, container, 'automazione')) return;
          container.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-robot"></i> Automazione</h2><p>Nessun modulo di automazione disponibile.</p></section>`;
        },

        whatsapp: () => {
          if (mountModule(this.modules.whatsapp, container, 'whatsapp')) return;
          container.innerHTML = `<section style="padding:1rem"><h2><i class="fab fa-whatsapp"></i> WhatsApp</h2><p>Modulo WhatsApp non disponibile.</p></section>`;
        },

        import: () => {
          if (mountModule(this.modules.contacts, container, 'import')) return;
          if (mountModule(this.modules.storage, container, 'import')) return;
          container.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-upload"></i> Import CSV</h2><p>Funzione import non disponibile.</p></section>`;
        }
      };

      if (map[page]) map[page]();
      else container.innerHTML = `<section style="padding:1rem"><h2>${page}</h2><p>Pagina non trovata.</p></section>`;
    }
  };

  window.App = App;
  window.App_Instance = App;
})();
