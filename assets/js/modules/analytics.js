// assets/js/modules/analytics.js
(function () {
  'use strict';

  function calculateKPIs(members) {
    let expired = 0, expiring = 0, active = 0;
    
    members.forEach(member => {
      const expiry = member.scadenza || member.dataScadenza || member.expiryDate;
      if (expiry) {
        const date = new Date(expiry);
        const days = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
        if (days < 0) expired++;
        else if (days <= 30) expiring++;
        else active++;
      }
    });

    return {
      totalMembers: members.length,
      expired,
      expiring,
      active,
      daContattare: expired + expiring
    };
  }

  const AnalyticsModule = {
    _initialized: false,

    async init() {
      if (this._initialized) return true;
      console.log('📊 [Analytics] Initializing...');
      this._initialized = true;
      return true;
    },

    async mount(container) {
      console.log('📊 [Analytics] Mounting dashboard...');
      
      const storage = window.Storage_Instance;
      if (!storage) {
        container.innerHTML = '<div>Storage non disponibile</div>';
        return;
      }

      // Force refresh
      try {
        await storage.refreshMembers();
      } catch (e) {
        console.warn('Refresh failed:', e);
      }

      const members = storage.getMembersCached() || [];
      const templates = storage.getTemplates() || {};
      const reminders = storage.getRemindersCached() || [];
      
      const kpis = calculateKPIs(members);
      const templatesCount = Array.isArray(templates) ? templates.length : Object.keys(templates).length;

      console.log('📊 KPI calculated:', kpis);

      // Template HTML semplificato
      const html = `
        <div style="margin-bottom: 1.5rem;">
          <h2 style="margin: 0; font-size: 1.5rem; color: #111;">Dashboard</h2>
        </div>

        <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; color: #64748b;">
          DEBUG: ${kpis.totalMembers} totali | ${kpis.daContattare} da contattare (${kpis.expired} scaduti + ${kpis.expiring} in scadenza)
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          
          <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" onclick="window.App.renderPage('tesserati')">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: #3b82f6; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                <i class="fas fa-users"></i>
              </div>
              <div style="font-size: 0.875rem; color: #6b7280; font-weight: 500; text-transform: uppercase;">Tesserati totali</div>
            </div>
            <div style="font-size: 2.5rem; font-weight: 800; color: #111; margin-bottom: 0.5rem;">${kpis.totalMembers}</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Attivi ${kpis.active} • In scadenza ${kpis.expiring} • Scaduti ${kpis.expired}</div>
          </div>

          <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" onclick="window.App.renderPage('scadenze')">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: #f59e0b; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div style="font-size: 0.875rem; color: #6b7280; font-weight: 500; text-transform: uppercase;">Da contattare</div>
            </div>
            <div style="font-size: 2.5rem; font-weight: 800; color: #111; margin-bottom: 0.5rem;">${kpis.daContattare}</div>
            <div style="font-size: 0.875rem; color: #6b7280;">${kpis.daContattare === 0 ? 'Tutto in regola!' : 'Apri elenco scadenze'}</div>
          </div>

          <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" onclick="window.App.renderPage('marketing')">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: #10b981; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                <i class="fas fa-envelope"></i>
              </div>
              <div style="font-size: 0.875rem; color: #6b7280; font-weight: 500; text-transform: uppercase;">Template disponibili</div>
            </div>
            <div style="font-size: 2.5rem; font-weight: 800; color: #111; margin-bottom: 0.5rem;">${templatesCount}</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Gestisci i messaggi</div>
          </div>

          <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" onclick="window.App.renderPage('automazione')">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: #8b5cf6; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                <i class="fas fa-clock"></i>
              </div>
              <div style="font-size: 0.875rem; color: #6b7280; font-weight: 500; text-transform: uppercase;">Reminder automatici</div>
            </div>
            <div style="font-size: 2.5rem; font-weight: 800; color: #111; margin-bottom: 0.5rem;">${reminders.length}</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Configura invii</div>
          </div>

        </div>
      `;

      // Imposta HTML
      container.innerHTML = html;

      // Aggiorna badge menu
      this._updateMenuBadges(kpis, reminders.length);

      console.log('✅ Dashboard rendered successfully');
    },

    _updateMenuBadges(kpis, remindersCount) {
      try {
        const badgeScadenze = document.getElementById('badge-scadenze');
        if (badgeScadenze) {
          if (kpis.daContattare > 0) {
            badgeScadenze.textContent = String(kpis.daContattare);
            badgeScadenze.style.display = 'inline-block';
          } else {
            badgeScadenze.style.display = 'none';
          }
        }

        const badgeAutomazione = document.getElementById('badge-automazione');
        if (badgeAutomazione) {
          if (remindersCount > 0) {
            badgeAutomazione.textContent = String(remindersCount);
            badgeAutomazione.style.display = 'inline-block';
          } else {
            badgeAutomazione.style.display = 'none';
          }
        }
        
      } catch (error) {
        console.warn('Error updating badges:', error);
      }
    }
  };

  // Override App._updateBadges
  if (window.App) {
    const originalUpdateBadges = window.App._updateBadges;
    window.App._updateBadges = function() {
      try {
        const storage = window.Storage_Instance;
        if (!storage) return;

        const members = storage.getMembersCached() || [];
        const kpis = calculateKPIs(members);
        const reminders = storage.getRemindersCached() || [];

        const badgeScadenze = document.getElementById('badge-scadenze');
        if (badgeScadenze) {
          if (kpis.daContattare > 0) {
            badgeScadenze.textContent = String(kpis.daContattare);
            badgeScadenze.style.display = 'inline-block';
          } else {
            badgeScadenze.style.display = 'none';
          }
        }

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
        console.warn('Error in badges override:', error);
        if (originalUpdateBadges) {
          originalUpdateBadges.call(this);
        }
      }
    };
  }

  window.AnalyticsModule = AnalyticsModule;
  console.log('📊 Analytics module loaded - simple version');
})();
