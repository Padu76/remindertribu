// assets/js/app.js
(function () {
  'use strict';

  const qs = (s) => document.querySelector(s);

  const isClass = (fn) => {
    try { return typeof fn === 'function' && /^class\s/.test(Function.prototype.toString.call(fn)); }
    catch { return false; }
  };
  const ensureInstance = (maybe) => {
    if (!maybe) return null;
    try { return isClass(maybe) ? new maybe() : maybe; }
    catch { return maybe; }
  };
  const getGlobal = (names=[]) => { for (const n of names) if (typeof window[n] !== 'undefined') return window[n]; };

  const mountModule = (mod, container, page) => {
    if (!mod || !container) return false;
    try {
      if (typeof mod.renderInto === 'function') { mod.renderInto(container); return true; }
      if (typeof mod.mount === 'function')      { mod.mount(container); return true; }
      if (typeof mod.getPageContent === 'function') {
        const html = mod.getPageContent(page) || mod.getPageContent();
        if (typeof html === 'string') container.innerHTML = html;
        if (typeof mod.initializePage === 'function') mod.initializePage(container, page);
        return true;
      }
      if (typeof mod.initializePage === 'function') { container.innerHTML = ''; mod.initializePage(container, page); return true; }
      if (typeof mod.render === 'function')         { mod.render(container, page); return true; }
    } catch (e) { console.error('Errore mount modulo:', e); }
    return false;
  };

  const existingApp = window.App || {};
  existingApp.modules = existingApp.modules || {};

  const App = Object.assign(existingApp, {
    currentPage: existingApp.currentPage || 'dashboard',

    async init() {
      try { if (window.Firebase_Instance?.init) await window.Firebase_Instance.init(); } catch (e) { console.warn('Firebase init warn:', e); }
      try { if (window.Storage_Instance?.init)  await window.Storage_Instance.init(); }  catch (e) { console.warn('Storage init warn:', e); }

      this.modules.storage   = this.modules.storage   || window.Storage_Instance || null;
      this._attachModule('contacts',  ['contacts','Contacts_Module','ContactsModule']);
      this._attachModule('analytics', ['analytics','AnalyticsModule']);
      this._attachModule('reminders', ['reminders','RemindersModule']);
      this._attachModule('billing',   ['billing','BillingModule']);
      this._attachModule('whatsapp',  ['WhatsAppModule','WhatsApp_Module']);
      this._attachModule('scadenze',  ['ScadenzeUI','Scadenze_Module']);
      this._attachModule('calendar',  ['CalendarModule']);
      this._attachModule('importcsv', ['ImportCSVModule','Import_Module']); // 👈 nuovo

      for (const k of Object.keys(this.modules)) {
        const m = this.modules[k];
        if (m && typeof m.init === 'function') { try { await m.init(); } catch (e) { console.warn(`Init ${k} warn:`, e); } }
      }

      this.bindNavigation();
      this.showMainApp();

      const nav = qs('#main-navigation');
      const active = nav ? nav.querySelector('.nav-item.active') : null;
      this.renderPage(active ? active.getAttribute('data-page') : 'dashboard');

      console.log('TribuReminder Application initialized successfully');
      return true;
    },

    _attachModule(key, names) {
      if (this.modules[key]) return;
      const fromApp = (window.App && window.App[key]) ? window.App[key] : null;
      if (fromApp) { this.modules[key] = ensureInstance(fromApp); return; }
      const g = getGlobal(names);
      if (g) { this.modules[key] = ensureInstance(g); return; }
      this.modules[key] = null;
    },

    hideLoading(){ qs('#loading-screen')?.classList.add('hidden'); },
    showMainApp(){ this.hideLoading(); qs('#auth-container')?.classList.add('hidden'); qs('#main-app')?.classList.remove('hidden'); },
    showAuth(){ this.hideLoading(); qs('#main-app')?.classList.add('hidden'); qs('#auth-container')?.classList.remove('hidden'); },

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
      const c = qs('#page-content'); if (!c) return;
      this.currentPage = page;

      const map = {
        dashboard: () => {
          const m = this.modules.analytics;
          if (m) {
            if (typeof m.renderDashboard === 'function') { c.innerHTML=''; return m.renderDashboard(c); }
            if (mountModule(m, c, 'dashboard')) return;
          }
          c.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2><p>Benvenuto in ReminderTribù.</p></section>`;
        },
        tesserati: () => {
          const m = this.modules.contacts;
          if (mountModule(m, c, 'tesserati')) return;
          c.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-id-card"></i> Tesserati</h2><p>Modulo contatti non disponibile.</p></section>`;
        },
        scadenze: () => {
          const m = this.modules.scadenze;
          if (mountModule(m, c, 'scadenze')) return;
          c.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-exclamation-triangle"></i> Scadenze</h2><p>Modulo scadenze non disponibile.</p></section>`;
        },
        marketing: () => {
          const m = this.modules.analytics;
          if (mountModule(m, c, 'marketing')) return;
          c.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-bullhorn"></i> Marketing</h2><p>Modulo marketing non disponibile.</p></section>`;
        },
        calendario: () => {
          const m = this.modules.calendar;
          if (mountModule(m, c, 'calendario')) return;
          c.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-calendar-alt"></i> Calendario</h2><p>Modulo calendario non disponibile.</p></section>`;
        },
        automazione: () => {
          const m1 = this.modules.reminders, m2 = this.modules.billing;
          if (mountModule(m1, c, 'automazione')) return;
          if (mountModule(m2, c, 'automazione')) return;
          c.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-robot"></i> Automazione</h2><p>Nessun modulo disponibile.</p></section>`;
        },
        whatsapp: () => {
          const m = this.modules.whatsapp;
          if (mountModule(m, c, 'whatsapp')) return;
          c.innerHTML = `<section style="padding:1rem"><h2><i class="fab fa-whatsapp"></i> WhatsApp</h2><p>Modulo WhatsApp non disponibile.</p></section>`;
        },
        import: () => {
          const m = this.modules.importcsv; // 👈 usa modulo dedicato
          if (mountModule(m, c, 'import')) return;
          c.innerHTML = `<section style="padding:1rem"><h2><i class="fas fa-upload"></i> Import CSV</h2><p>Modulo import non disponibile.</p></section>`;
        }
      };

      if (map[page]) map[page]();
      else c.innerHTML = `<section style="padding:1rem"><h2>${page}</h2><p>Pagina non trovata.</p></section>`;
    }
  });

  window.App = App;
  window.App_Instance = window.App_Instance || App;
})();
