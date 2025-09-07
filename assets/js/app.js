// assets/js/app.js
(function () {
  'use strict';

  const qs = (s) => document.querySelector(s);

  const App = {
    modules: {},

    async init() {
      // Inizializza (se presente) il modulo WhatsApp
      if (window.WhatsAppModule && !this.modules.whatsapp) {
        this.modules.whatsapp = window.WhatsAppModule;
        if (this.modules.whatsapp.init) await this.modules.whatsapp.init();
      }

      // Mostra l'app (prima era tutto hidden)
      this.showMainApp();       // <- se vuoi il login prima, usa this.showAuth()

      // Bind navigazione e vai alla pagina attiva
      this.bindNavigation();

      // Se non c'è item attivo, forzo la dashboard
      const nav = qs('#main-navigation');
      const active = nav ? nav.querySelector('.nav-item.active') : null;
      if (!active) this.renderPage('dashboard');

      console.log('TribuReminder Application initialized successfully');
      return true;
    },

    // ---- UI helpers ----
    hideLoading() {
      qs('#loading-screen')?.classList.add('hidden');
    },
    showMainApp() {
      this.hideLoading();
      qs('#auth-container')?.classList.add('hidden');
      qs('#main-app')?.classList.remove('hidden');
    },
    showAuth() {
      this.hideLoading();
      qs('#main-app')?.classList.add('hidden');
      qs('#auth-container')?.classList.remove('hidden');
    },

    // ---- Navigazione ----
    bindNavigation() {
      const nav = qs('#main-navigation');
      if (!nav) return;

      nav.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (!item) return;
        const page = item.getAttribute('data-page');
        if (!page) return;

        // attiva item
        nav.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        // cambia pagina
        this.renderPage(page);
        console.log('Page changed to:', page);
      });

      // pagina iniziale
      const active = nav.querySelector('.nav-item.active');
      if (active) this.renderPage(active.getAttribute('data-page'));
    },

    // ---- Pagine ----
    renderPage(page) {
      const container = qs('#page-content');
      if (!container) return;

      if (page === 'whatsapp') {
        if (!this.modules.whatsapp) {
          container.innerHTML = `<div style="padding:1rem">Modulo WhatsApp non disponibile.</div>`;
          return;
        }
        this.modules.whatsapp.mount(container);
        return;
      }

      if (page === 'dashboard') {
        container.innerHTML = `
          <section style="padding:1rem">
            <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
            <p>Benvenuto in ReminderTribù.</p>
          </section>
        `;
        return;
      }

      // Le altre sezioni vengono gestite dai loro moduli (es. scadenze.js)
      container.innerHTML = `
        <section style="padding:1rem">
          <h2>${page.charAt(0).toUpperCase() + page.slice(1)}</h2>
          <p>Sezione in caricamento...</p>
        </section>
      `;
    }
  };

  // Espone globalmente
  window.App = App;
  window.App_Instance = App;

})(); // <-- chiusura IIFE corretta
