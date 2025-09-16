// assets/js/modules/analytics.js
(function () {
  'use strict';

  const DAY = 24 * 60 * 60 * 1000;

  function parseDateMaybe(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (v && typeof v === 'object' && typeof v.toDate === 'function') {
      try { return v.toDate(); } catch {}
    }
    const s = String(v).trim();
    const iso = new Date(s);
    if (!Number.isNaN(iso.getTime())) return iso;
    const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (m) {
      const d = Number(m[1]), mo = Number(m[2]) - 1, y = Number(m[3]);
      const dt = new Date(Date.UTC(y, mo, d, 12, 0, 0));
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  }

  function daysLeftFromToday(d) {
    if (!d) return null;
    const today = new Date();
    const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor((b - a) / DAY);
  }

  function computeStatus(daysLeft) {
    if (daysLeft == null) return 'unknown';
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring';
    return 'active';
  }

  function pickExpiry(m) { 
    return m?.scadenza || m?.dataScadenza || m?.expiryDate || m?.expiry || m?.nextRenewal || null; 
  }

  function formatISO(d) {
    if (!d) return '';
    const z = new Date(d);
    const yyyy = z.getFullYear();
    const mm = String(z.getMonth() + 1).padStart(2, '0');
    const dd = String(z.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }

  function ensureStylesOnce() {
    if (document.getElementById('analytics-styles')) return;
    const css = `
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      
      .kpi-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        border: 1px solid #e0e0e0;
      }
      
      .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      }
      
      .kpi-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      
      .kpi-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }
      
      .kpi-icon.members { background: #3b82f6; }
      .kpi-icon.expiring { background: #f59e0b; }
      .kpi-icon.templates { background: #10b981; }
      .kpi-icon.reminders { background: #8b5cf6; }
      
      .kpi-title {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .kpi-value {
        font-size: 2.5rem;
        font-weight: 800;
        color: #111827;
        line-height: 1;
        margin-bottom: 0.5rem;
      }
      
      .kpi-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .dashboard-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      
      .refresh-btn {
        padding: 0.5rem 1rem;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .refresh-btn:hover {
        background: #e5e7eb;
        border-color: #9ca3af;
      }
      
      .refresh-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .recent-expiries {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid #e0e0e0;
      }
      
      .section-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .expiry-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .expiry-table th {
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.75rem 0.5rem;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .expiry-table td {
        padding: 0.75rem 0.5rem;
        border-bottom: 1px solid #f3f4f6;
        font-size: 0.875rem;
      }
      
      .expiry-table tbody tr:hover {
        background: #f9fafb;
      }
      
      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .status-active {
        background: #dcfce7;
        color: #166534;
      }
      
      .status-expiring {
        background: #fef3c7;
        color: #92400e;
      }
      
      .status-expired {
        background: #fee2e2;
        color: #991b1b;
      }
      
      .status-unknown {
        background: #f3f4f6;
        color: #6b7280;
      }
      
      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
      }
      
      .empty-state i {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }
    `;
    
    const style = document.createElement('style');
    style.id = 'analytics-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function statusBadge(status) {
    const badges = {
      active: '<span class="status-badge status-active">Attivo</span>',
      expiring: '<span class="status-badge status-expiring">In scadenza</span>',
      expired: '<span class="status-badge status-expired">Scaduto</span>',
      unknown: '<span class="status-badge status-unknown">Sconosciuto</span>'
    };
    return badges[status] || badges.unknown;
  }

  const AnalyticsModule = {
    _initialized: false,

    async init() {
      if (this._initialized) return true;
      
      console.log('📊 [Analytics] Initializing...');
      ensureStylesOnce();

      const storage = window.Storage_Instance;
      if (!storage) {
        console.warn('⚠️ [Analytics] Storage not available');
        this._initialized = true;
        return true;
      }

      try {
        // Assicurati che lo storage sia inizializzato
        if (!storage.isInitialized && typeof storage.init === 'function') {
          await storage.init();
        }

        // Ricarica i dati se necessario
        if (typeof storage.getMembersCached === 'function' && storage.getMembersCached().length === 0) {
          await storage.refreshMembers?.();
        }

        // Carica altri dati per KPI completi
        await Promise.allSettled([
          storage.refreshTemplates?.(),
          storage.refreshReminders?.()
        ]);

        this._initialized = true;
        console.log('✅ [Analytics] Initialized successfully');
        return true;
        
      } catch (error) {
        console.warn('⚠️ [Analytics] Init error:', error);
        this._initialized = true;
        return false;
      }
    },

    async mount(container) {
      const storage = window.Storage_Instance;
      
      if (!storage) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Storage non disponibile</h3>
            <p>Impossibile caricare i dati del dashboard.</p>
          </div>
        `;
        return;
      }

      // Forza refresh dei dati per avere sempre i più recenti
      await storage.refreshMembers?.();
      
      const members = storage.getMembersCached?.() || [];
      const templatesObj = storage.getTemplates?.() || {};
      const reminders = storage.getRemindersCached?.() || [];

      // Calcola KPI utilizzando la stessa logica del modulo scadenze
      let totalMembers = members.length;
      let expiredCount = 0;
      let expiringCount = 0;
      let activeCount = 0;
      let unknownCount = 0;

      const processedMembers = members.map(member => {
        const expiry = parseDateMaybe(pickExpiry(member));
        const daysLeft = daysLeftFromToday(expiry);
        const status = computeStatus(daysLeft);
        
        switch (status) {
          case 'expired': expiredCount++; break;
          case 'expiring': expiringCount++; break;
          case 'active': activeCount++; break;
          default: unknownCount++; break;
        }

        return {
          id: member.id,
          fullName: member.fullName || `${member.nome || ''} ${member.cognome || ''}`.trim() || 'Senza nome',
          phone: member.whatsapp || member.phone || member.telefono || '',
          expiry,
          daysLeft,
          status
        };
      });

      const daContattare = expiredCount + expiringCount;
      
      const templatesCount = Array.isArray(templatesObj) 
        ? templatesObj.length 
        : Object.keys(templatesObj).length;
      
      const remindersCount = reminders.length;

      // Prossime scadenze (solo in scadenza e scaduti, ordinati per giorni)
      const upcomingExpiries = processedMembers
        .filter(m => m.status === 'expiring' || m.status === 'expired')
        .sort((a, b) => (a.daysLeft || -999) - (b.daysLeft || -999))
        .slice(0, 10);

      container.innerHTML = `
        <div class="dashboard-toolbar">
          <h2 style="margin: 0; font-size: 1.5rem; color: #111827;">Dashboard</h2>
          <button id="refresh-dashboard" class="refresh-btn">
            <i class="fas fa-sync-alt"></i>
            Ricarica
          </button>
        </div>

        <div class="dashboard-grid">
          <div class="kpi-card" data-navigate="tesserati">
            <div class="kpi-header">
              <div class="kpi-icon members">
                <i class="fas fa-users"></i>
              </div>
              <div class="kpi-title">Tesserati totali</div>
            </div>
            <div class="kpi-value">${totalMembers}</div>
            <div class="kpi-subtitle">
              Attivi ${activeCount} • In scadenza ${expiringCount} • Scaduti ${expiredCount}
            </div>
          </div>

          <div class="kpi-card" data-navigate="scadenze">
            <div class="kpi-header">
              <div class="kpi-icon expiring">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div class="kpi-title">Da contattare</div>
            </div>
            <div class="kpi-value">${daContattare}</div>
            <div class="kpi-subtitle">
              ${daContattare === 0 ? 'Tutto in regola!' : 'Apri elenco scadenze'}
            </div>
          </div>

          <div class="kpi-card" data-navigate="marketing">
            <div class="kpi-header">
              <div class="kpi-icon templates">
                <i class="fas fa-envelope"></i>
              </div>
              <div class="kpi-title">Template disponibili</div>
            </div>
            <div class="kpi-value">${templatesCount}</div>
            <div class="kpi-subtitle">Gestisci i messaggi</div>
          </div>

          <div class="kpi-card" data-navigate="automazione">
            <div class="kpi-header">
              <div class="kpi-icon reminders">
                <i class="fas fa-clock"></i>
              </div>
              <div class="kpi-title">Reminder automatici</div>
            </div>
            <div class="kpi-value">${remindersCount}</div>
            <div class="kpi-subtitle">
              ${remindersCount === 0 ? 'Configura invii' : 'Gestisci automazioni'}
            </div>
          </div>
        </div>

        <div class="recent-expiries">
          <h3 class="section-title">
            <i class="fas fa-calendar-alt"></i>
            Prossime scadenze (${upcomingExpiries.length})
          </h3>
          
          ${upcomingExpiries.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-check-circle"></i>
              <p>Nessuna scadenza imminente!</p>
            </div>
          ` : `
            <table class="expiry-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefono</th>
                  <th>Scadenza</th>
                  <th>Giorni</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                ${upcomingExpiries.map(member => `
                  <tr>
                    <td><strong>${member.fullName}</strong></td>
                    <td>${member.phone || '—'}</td>
                    <td>${member.expiry ? formatISO(member.expiry) : '—'}</td>
                    <td>${member.daysLeft !== null ? `${member.daysLeft} gg` : '—'}</td>
                    <td>${statusBadge(member.status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      `;

      // Bind eventi
      this._bindEvents(container);

      // Aggiorna i badge del menu
      if (window.App && typeof window.App._updateBadges === 'function') {
        window.App._updateBadges();
      }
    },

    _bindEvents(container) {
      // Navigazione KPI cards
      const kpiCards = container.querySelectorAll('[data-navigate]');
      kpiCards.forEach(card => {
        card.addEventListener('click', () => {
          const page = card.getAttribute('data-navigate');
          if (window.App && typeof window.App.renderPage === 'function') {
            window.App.renderPage(page);
          }
        });
      });

      // Refresh button
      const refreshBtn = container.querySelector('#refresh-dashboard');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
          refreshBtn.disabled = true;
          refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Caricamento...';
          
          try {
            const storage = window.Storage_Instance;
            if (storage) {
              await Promise.allSettled([
                storage.refreshMembers?.(),
                storage.refreshTemplates?.(),
                storage.refreshReminders?.()
              ]);
            }
            
            // Re-mount per aggiornare i dati
            await this.mount(container);
            
          } catch (error) {
            console.error('Errore durante il refresh:', error);
          } finally {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Ricarica';
          }
        });
      }
    }
  };

  // Override della funzione _updateBadges in App per usare i nostri calcoli
  if (window.App) {
    const originalUpdateBadges = window.App._updateBadges;
    window.App._updateBadges = function() {
      try {
        const storage = window.Storage_Instance;
        if (!storage) return;

        const members = storage.getMembersCached?.() || [];
        const reminders = storage.getRemindersCached?.() || [];

        // Calcola scadenze con la stessa logica del modulo analytics
        let expiringCount = 0;
        for (const member of members) {
          const expiry = parseDateMaybe(pickExpiry(member));
          const daysLeft = daysLeftFromToday(expiry);
          const status = computeStatus(daysLeft);
          
          if (status === 'expired' || status === 'expiring') {
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
        // Fallback alla funzione originale se presente
        if (originalUpdateBadges) {
          originalUpdateBadges.call(this);
        }
      }
    };
  }

  window.AnalyticsModule = AnalyticsModule;
})();
