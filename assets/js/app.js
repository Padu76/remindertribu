// assets/js/app.js
(function () {
  'use strict';

  const App = {
    state: { 
      currentPage: 'dashboard', 
      initialized: false,
      modules: {},
      retryCount: 0,
      maxRetries: 3
    },
    
    config: {
      initTimeout: 5000,
      moduleTimeout: 3000
    },

    async init() {
      if (this.state.initialized) return true;

      console.log('🚀 Initializing ReminderTribù Application...');

      try {
        // Verifica elementi DOM essenziali
        this.sidebar = document.getElementById('sidebar');
        this.container = document.getElementById('page-content');
        
        if (!this.container) {
          throw new Error('Container #page-content not found');
        }

        // Attendi che Firebase sia pronto (con timeout)
        await this.waitForFirebase();

        // Inizializza Storage con gestione errori
        await this.initStorage();

        // Configura navigazione
        this._bindNavigation();
        
        // Aggiorna badge
        this._updateBadges();
        
        // Registra moduli disponibili
        this._registerModules();

        this.state.initialized = true;
        console.log('✅ ReminderTribù Application initialized successfully');
        
        // Rimuovi overlay di caricamento
        this.hideLoadingOverlay();
        
        return true;

      } catch (error) {
        console.error('❌ Initialization failed:', error);
        this.handleInitError(error);
        return false;
      }
    },

    async waitForFirebase(timeout = 3000) {
      const startTime = Date.now();
      
      while (!window.FirebaseModule) {
        if (Date.now() - startTime > timeout) {
          console.warn('⚠️ Firebase initialization timeout - continuing without Firebase');
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!window.FirebaseModule.ready) {
        console.warn('⚠️ Firebase not ready:', window.FirebaseModule.error);
        return false;
      }
      
      console.log('✅ Firebase is ready');
      return true;
    },

    async initStorage() {
      const Storage = window.Storage_Instance;
      
      if (!Storage) {
        console.warn('⚠️ Storage module not found - some features may be limited');
        return false;
      }

      try {
        if (!Storage.isInitialized && typeof Storage.init === 'function') {
          await Storage.init();
        }
        
        // Carica dati in parallelo senza bloccare
        const loadPromises = [
          Storage.refreshMembers?.(),
          Storage.refreshReminders?.(),
          Storage.refreshTemplates?.()
        ].filter(Boolean);
        
        // Usa allSettled per non bloccare su errori
        const results = await Promise.allSettled(loadPromises);
        
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.warn('⚠️ Some storage operations failed:', failures);
        }
        
        console.log('✅ Storage initialized');
        return true;
        
      } catch (error) {
        console.warn('⚠️ Storage initialization error:', error);
        return false;
      }
    },

    _registerModules() {
      // Registra tutti i moduli disponibili
      const modules = {
        analytics: window.AnalyticsModule,
        contacts: window.ContactsModule,
        scadenze: window.ScadenzeModule,
        marketing: window.MarketingModule,
        calendar: window.CalendarModule,
        reminders: window.RemindersModule,
        whatsapp: window.WhatsAppModule,
        import: window.ImportModule
      };

      let registered = 0;
      for (const [name, module] of Object.entries(modules)) {
        if (module) {
          this.state.modules[name] = module;
          registered++;
        }
      }
      
      console.log(`📦 Registered ${registered} modules`);
    },

    _bindNavigation() {
      const nav = document.getElementById('main-navigation');
      if (!nav) return;

      nav.addEventListener('click', async (e) => {
        const item = e.target.closest('.nav-item');
        if (!item) return;
        
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (!page) return;

        // Aggiorna stato attivo
        nav.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        // Mostra loading indicator
        this.showPageLoading();

        // Carica pagina
        await this.renderPage(page);
      });
    },

    async renderPage(page) {
      this.state.currentPage = page;
      const container = this.container;
      if (!container) return;

      console.log(`📄 Loading page: ${page}`);

      // Mapping pagine -> moduli
      const pageModuleMap = {
        dashboard: 'analytics',
        tesserati: 'contacts',
        scadenze: 'scadenze',
        marketing: 'marketing',
        calendario: 'calendar',
        automazione: 'reminders',
        whatsapp: 'whatsapp',
        importcsv: 'import'
      };

      const moduleName = pageModuleMap[page];
      const module = this.state.modules[moduleName] || window[`${this._capitalize(moduleName)}Module`];

      try {
        // Inizializza modulo se necessario
        if (module && typeof module.init === 'function' && !module.initialized) {
          console.log(`🔧 Initializing module: ${moduleName}`);
          await this.withTimeout(module.init(), this.config.moduleTimeout);
          module.initialized = true;
        }

        // Monta il modulo
        if (module && typeof module.mount === 'function') {
          console.log(`🎯 Mounting module: ${moduleName}`);
          await this.withTimeout(module.mount(container), this.config.moduleTimeout);
        } else {
          // Contenuto di fallback
          this.renderFallback(container, page);
        }

        // Aggiorna badge dopo il rendering
        setTimeout(() => this._updateBadges(), 100);
        
      } catch (error) {
        console.error(`❌ Error loading page ${page}:`, error);
        this.renderError(container, page, error);
      } finally {
        this.hidePageLoading();
      }
    },

    renderFallback(container, page) {
      const content = this.getFallbackContent(page);
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2>${this._getPageTitle(page)}</h2>
          </div>
          <div class="card-body">
            ${content}
          </div>
        </div>
      `;
    },

    getFallbackContent(page) {
      const fallbacks = {
        dashboard: '<p>Caricamento dashboard in corso...</p>',
        tesserati: '<p>Caricamento elenco tesserati...</p>',
        scadenze: '<p>Caricamento scadenze...</p>',
        marketing: '<p>Caricamento strumenti marketing...</p>',
        calendario: '<p>Caricamento calendario...</p>',
        automazione: '<p>Caricamento automazioni...</p>',
        whatsapp: '<p>Caricamento WhatsApp...</p>',
        importcsv: `
          <p>Importa i tuoi dati da file CSV.</p>
          <div class="upload-area" style="margin-top: 1rem; padding: 2rem; border: 2px dashed #ddd; border-radius: 10px; text-align: center;">
            <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #089e89;"></i>
            <p style="margin-top: 1rem;">Trascina qui il tuo file CSV o clicca per selezionare</p>
            <input type="file" accept=".csv" style="display: none;" id="csv-upload">
            <button class="btn btn-primary" onclick="document.getElementById('csv-upload').click()">
              Seleziona File
            </button>
          </div>
        `
      };
      
      return fallbacks[page] || '<p>Modulo in fase di sviluppo...</p>';
    },

    renderError(container, page, error) {
      container.innerHTML = `
        <div class="card error-card">
          <div class="card-header">
            <h2 style="color: var(--danger);">
              <i class="fas fa-exclamation-triangle"></i> 
              Errore di caricamento
            </h2>
          </div>
          <div class="card-body">
            <p>Si è verificato un errore durante il caricamento della sezione <strong>${this._getPageTitle(page)}</strong>.</p>
            <details style="margin-top: 1rem;">
              <summary style="cursor: pointer; color: var(--primary);">Dettagli tecnici</summary>
              <pre style="margin-top: 0.5rem; padding: 1rem; background: #f5f5f5; border-radius: 5px; font-size: 0.875rem;">
${error.message || error}
              </pre>
            </details>
            <button class="btn btn-primary" style="margin-top: 1rem;" onclick="window.App.renderPage('${page}')">
              <i class="fas fa-redo"></i> Riprova
            </button>
          </div>
        </div>
      `;
    },

    handleInitError(error) {
      const container = this.container;
      if (!container) return;
      
      container.innerHTML = `
        <div class="card error-card">
          <div class="card-header">
            <h2 style="color: var(--danger);">
              <i class="fas fa-exclamation-circle"></i> 
              Errore di inizializzazione
            </h2>
          </div>
          <div class="card-body">
            <p>L'applicazione non è riuscita ad avviarsi correttamente.</p>
            <p style="margin-top: 1rem;">Possibili cause:</p>
            <ul style="margin-top: 0.5rem;">
              <li>Configurazione Firebase mancante o errata</li>
              <li>Problemi di connessione di rete</li>
              <li>Browser non supportato</li>
            </ul>
            <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="location.reload()">
              <i class="fas fa-sync"></i> Ricarica l'applicazione
            </button>
          </div>
        </div>
      `;
      
      this.hideLoadingOverlay();
    },

    _updateBadges() {
      try {
        const Storage = window.Storage_Instance;
        if (!Storage) return;

        const members = Storage.getMembersCached?.() || [];
        const reminders = Storage.getRemindersCached?.() || [];

        // Calcola scadenze
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        let expiringCount = 0;
        for (const member of members) {
          const expiryDate = this._parseDate(
            member.scadenza || 
            member.expiryDate || 
            member.expiry || 
            member.nextRenewal
          );
          
          if (expiryDate && expiryDate <= thirtyDaysFromNow) {
            expiringCount++;
          }
        }

        // Aggiorna badge scadenze
        const badgeScadenze = document.getElementById('badge-scadenze');
        if (badgeScadenze) {
          if (expiringCount > 0) {
            badgeScadenze.textContent = String(expiringCount);
            badgeScadenze.style.display = 'inline-block';
          } else {
            badgeScadenze.style.display = 'none';
          }
        }

        // Aggiorna badge automazioni
        const badgeAutomazione = document.getElementById('badge-automazione');
        if (badgeAutomazione) {
          if (reminders.length > 0) {
            badgeAutomazione.textContent = String(reminders.length);
            badgeAutomazione.style.display = 'inline-block';
          } else {
            badgeAutomazione.style.display = 'none';
          }
        }
      } catch (error) {
        console.warn('Error updating badges:', error);
      }
    },

    _parseDate(value) {
      if (!value) return null;
      if (value instanceof Date) return value;
      if (value?.toDate) {
        try { return value.toDate(); } catch {}
      }
      const date = new Date(String(value));
      return isNaN(date.getTime()) ? null : date;
    },

    _getPageTitle(page) {
      const titles = {
        dashboard: 'Dashboard',
        tesserati: 'Tesserati CSEN',
        scadenze: 'Scadenze',
        marketing: 'Marketing',
        calendario: 'Calendario',
        automazione: 'Automazione',
        whatsapp: 'WhatsApp',
        importcsv: 'Import CSV'
      };
      return titles[page] || page;
    },

    _capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    async withTimeout(promise, timeout) {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ]);
    },

    showLoadingOverlay() {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) overlay.classList.remove('hidden');
    },

    hideLoadingOverlay() {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) overlay.classList.add('hidden');
    },

    showPageLoading() {
      if (this.container) {
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'page-loader';
        loader.innerHTML = '<div class="loading-spinner"></div>';
        this.container.prepend(loader);
      }
    },

    hidePageLoading() {
      const loader = document.getElementById('page-loader');
      if (loader) loader.remove();
    },

    // Metodo pubblico per mostrare toast
    showToast(message, type = 'info') {
      if (window.Toast && typeof window.Toast.show === 'function') {
        window.Toast.show(message, type);
      } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
    }
  };

  // Esponi globalmente
  window.App = App;
  
  // Auto-init quando il DOM è pronto (gestito da index.html)
  console.log('✅ App module loaded and ready');
})();