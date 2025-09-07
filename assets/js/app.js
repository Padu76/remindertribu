// assets/js/app.js
// Router/app core compatibile con moduli già registrati su window.App.modules.
// Non sovrascrive window.App esistente. Supporta nomi multipli (Contacts_Module/ContactsModule).

(function () {
  'use strict';

  const qs = (s) => document.querySelector(s);

  // -------- helpers --------
  const isClass = (fn) => {
    try { return typeof fn === 'function' && /^class\s/.test(Function.prototype.toString.call(fn)); }
    catch { return false; }
  };

  const ensureInstance = (maybe) => {
    if (!maybe) return null;
    try {
      if (isClass(maybe)) return new maybe();
      return maybe; // già oggetto/istanza
    } catch { return maybe; }
  };

  const getGlobal = (names = []) => {
    for (const n of names) {
      if (typeof window[n] !== 'undefined') return window[n];
    }
    return undefined;
  };

  const mountModule = (mod, container, page) => {
    if (!mod || !container) return false;
    try {
      if (typeof mod.renderInto === 'function') { mod.renderInto(container); return true; }
      if (typeof mod.mount === 'function') { mod.mount(container); return true; }
      if (typeof mod.getPageContent === 'function') {
        const html = mod.getPageContent(page) || mod.getPageContent();
        if (typeof html === 'string') container.innerHTML = html;
        if (typeof mod.initializePage === 'function') mod.initializePage(container, page);
        return true;
      }
      if (typeof mod.initializePage === 'function') { container.innerHTML = ''; mod.initializePage(container, page); return true; }
      if (typeof mod.render === 'function') { mod.render(container, page); return true; }
    } catch (e) {
      console.error('Errore mount modulo:', e);
    }
    return false;
  };

  // -------- base App: NON sovrascrivo se esiste --------
  const existingApp = window.App || {};
  existingApp.modules = existingApp.modules || {};

  const App = Object.assign(existingApp, {
    currentPage: existingApp.currentPage || 'dashboard',

    async init() {
      // 1) Inizializza Firebase/Storage (se esistono)
      try { if (window.Firebase_Instance?.init) await window.Firebase_Instance.init(); } catch (e) { console.warn('Firebase init warn:', e); }
      try { if (window.Storage_Instance?.init) await window.Storage_Instance.init(); } catch (e) { console.warn('Storage init warn:', e); }

      // 2) Collega modulo Storage nel namespace App
      this.modules.storage = this.modules.storage || window.Storage_Instance || null;

      // 3) Risolvi e attacca moduli (supporto a nomi diversi + classi)
      this._attachModule('contacts', ['contacts', 'Contacts_Module', 'ContactsModule']);
      this._attachModule('analytics', ['analytics', 'AnalyticsModule']);
      this._attachModule('reminders', ['reminders', 'RemindersModule']);
      this._attachModule('billing', ['billing', 'BillingModule']);
      this._attachModule('whatsapp', ['WhatsAppModule', 'WhatsApp_Module']);
      this._attachModule('scadenze', ['ScadenzeUI', 'Scadenze_Module']);
      this._attachModule('calendar', ['CalendarModule']);

      // 4) init() per i moduli che lo prevedono
      for (const key of Object.keys(this.modules)) {
        const m = this.modules[key];
        if (m && typeof m.init === 'function') {
          try { await m.init(); } catch (e) { console.warn(`Init modulo ${key} fallito:`, e); }
        }
      }

      // 5) UI
      this.bindNavigation();
      this.showMainApp();

      const nav = qs('#main-navigation');
      const active = nav ? nav.querySelector('.nav-item.active') : null;
      const firstPage = active ? active.getAttribute('data-page') : 'dashboard';
      this.renderPage(firstPage);

      console.log('TribuReminder Application initialized successfully');
      return true;
    },

    _attachModule(key, globalNames) {
      // 1) se già valorizzato su App.modules, lo rispetto
      if (this.modules[key]) return;

      // 2) prova su window.App.<Qualcosa> (altri bootstrap)
      const fromApp = (window.App && window.App[key]) ? window.App[key] : null;
      if (fromApp) { this.modules[key] = ensureInstance(fromApp); return; }

      // 3) prova globali diretti
      const g = getGlobal(globalNames);
      if (g) { this.modules[key] = ensureInstance(g); return; }

      // 4) niente: lascio null (il router mostrerà fallback)
      this.modules[key] = null;
    },

    // ---- UI helpers
    hideLoading() { qs('#loading-screen')?.classList.add('hidden'); },
    showMainApp() { this.hideLoading(); qs('#auth-container')?.classList.add('hidden'); qs('#main-app')?.classList.remove('hidden'); },
    showAuth()    { this.hideLoading(); qs('#main-app')?.classList.add('hidden'); qs('#auth-container')?.classList.remove('hidden'); },

    // ---- Router
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
      this.currentPage = page;

      const map = {
        dashboard: () => {
          const m = this.modules.analytics;
          if (m) {
            if (typeof m.renderDashboard === 'function') { container.innerHTML = ''; return m.renderDashboard(container); }
            if (mountModule(m, container, 'dashboard')) return;
          }
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
              <p>Benvenuto in ReminderTribù.</p>
            </section>
          `;
        },

        tesserati: () => {
          const m = this.modules.contacts;
          if (mountModule(m, container, 'tesserati')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-id-card"></i> Tesserati</h2>
              <p>Modulo contatti non disponibile.</p>
            </section>
          `;
        },

        scadenze: () => {
          const m = this.modules.scadenze;
          if (mountModule(m, container, 'scadenze')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-exclamation-triangle"></i> Scadenze</h2>
              <p>Modulo scadenze non disponibile.</p>
            </section>
          `;
        },

        marketing: () => {
          const m = this.modules.analytics;
          if (mountModule(m, container, 'marketing')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-bullhorn"></i> Marketing</h2>
              <p>Modulo marketing/analytics non disponibile.</p>
            </section>
          `;
        },

        calendario: () => {
          const m = this.modules.calendar;
          if (mountModule(m, container, 'calendario')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-calendar-alt"></i> Calendario</h2>
              <p>Modulo calendario non disponibile.</p>
            </section>
          `;
        },

        automazione: () => {
          const m1 = this.modules.reminders;
          const m2 = this.modules.billing;
          if (mountModule(m1, container, 'automazione')) return;
          if (mountModule(m2, container, 'automazione')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-robot"></i> Automazione</h2>
              <p>Nessun modulo di automazione disponibile.</p>
            </section>
          `;
        },

        whatsapp: () => {
          const m = this.modules.whatsapp;
          if (mountModule(m, container, 'whatsapp')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fab fa-whatsapp"></i> WhatsApp</h2>
              <p>Modulo WhatsApp non disponibile.</p>
            </section>
          `;
        },

        import: () => {
          const m1 = this.modules.contacts;
          const m2 = this.modules.storage;
          if (mountModule(m1, container, 'import')) return;
          if (mountModule(m2, container, 'import')) return;
          container.innerHTML = `
            <section style="padding:1rem">
              <h2><i class="fas fa-upload"></i> Import CSV</h2>
              <p>Funzione import non disponibile.</p>
            </section>
          `;
        }
      };

      if (map[page]) map[page]();
      else container.innerHTML = `<section style="padding:1rem"><h2>${page}</h2><p>Pagina non trovata.</p></section>`;
    }
  });

  // Esponi (senza cancellare eventuali reference esistenti)
  window.App = App;
  window.App_Instance = window.App_Instance || App;

})();
