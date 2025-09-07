// assets/js/app.js
(function () {
  'use strict';

  const App = {
    modules: {},
    async init() {
      // Hook moduli esistenti (se esistono)
      if (window.Toast && !window.Toast_Instance) {
        // opzionale: se hai un costruttore Toast
        // window.Toast_Instance = new Toast(...);
      }

      // Inizializza modulo WhatsApp se presente
      if (window.WhatsAppModule && !this.modules.whatsapp) {
        this.modules.whatsapp = window.WhatsAppModule;
        if (this.modules.whatsapp.init) await this.modules.whatsapp.init();
      }

      // Bind navigazione
      this.bindNavigation();

      return true;
    },

    bindNavigation() {
      const nav = document.getElementById('main-navigation');
      if (!nav) return;

      nav.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (!item) return;
        const page = item.getAttribute('data-page');
        if (!page) return;

        // attiva item
        document.querySelectorAll('.nav .nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        // cambia pagina
        this.renderPage(page);
      });

      // pagina iniziale (se non già caricata altrove)
      const active = nav.querySelector('.nav-item.active');
      if (active) this.renderPage(active.getAttribute('data-page'));
    },

    renderPage(page) {
      const container = document.getElementById('page-content');
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

      // Le altre pagine sono gestite dai loro moduli (es. scadenze.js si auto-aggancia al click).
      container.innerHTML = `
        <section style="padding:1rem">
          <h2>${page.charAt(0).toUpperCase() + page.slice(1)}</h2>
          <p>Sezione in caricamento...</p>
        </section>
      `;
    }
  };

  window.App = App;
  window.App_Instance = App; // compat con index.html che chiama App_Instance.init()

})();
