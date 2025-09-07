/**
 * Contacts / Tesserati Module (UI + UX migliorata)
 * - Carica SINCRONO i contatti da Storage (cache)
 * - Ricerca, filtro stato, azioni rapide
 */

(function () {
  'use strict';

  class ContactsModule {
    constructor() {
      this.isInitialized = false;
      this.filtered = [];
      this.searchTerm = '';
      this.statusFilter = 'all';
      this.sortKey = 'name';
      this.sortDir = 'asc';
    }

    async init() {
      try {
        console.log('👥 [Contacts] init…');
        this.isInitialized = true;
        console.log('✅ [Contacts] initialized');
      } catch (err) {
        console.error('❌ [Contacts] init failed:', err);
      }
    }

    // ---------------- UI ----------------

    getPageContent() {
      return `
        <div class="page-container">
          <div class="page-header">
            <h1 class="page-title"><i class="fas fa-users"></i> Tesserati</h1>
            <p class="page-subtitle">Gestisci l'elenco completo dei tesserati</p>
          </div>

          <div class="toolbar">
            <div class="toolbar-left">
              <div class="input-group">
                <i class="fas fa-search input-icon"></i>
                <input id="contactsSearch" class="form-control" placeholder="Cerca per nome, telefono o email…" autocomplete="off">
              </div>
            </div>
            <div class="toolbar-right">
              <select id="contactsStatus" class="form-control">
                <option value="all">Tutti gli stati</option>
                <option value="active">Attivi</option>
                <option value="expiring">In scadenza (≤30gg)</option>
                <option value="expired">Scaduti</option>
              </select>
              <select id="contactsSort" class="form-control">
                <option value="name|asc">Nome (A→Z)</option>
                <option value="name|desc">Nome (Z→A)</option>
                <option value="expiry|asc">Scadenza (più vicine)</option>
                <option value="expiry|desc">Scadenza (più lontane)</option>
              </select>
              <button id="contactsRefresh" class="btn btn-outline">
                <i class="fas fa-rotate-right"></i> Aggiorna
              </button>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefono</th>
                  <th>Scadenza</th>
                  <th>Stato</th>
                  <th style="width:120px;">Azioni</th>
                </tr>
              </thead>
              <tbody id="contactsTableBody">
                <tr>
                  <td colspan="5" style="text-align:center; padding:2rem; opacity:.7;">
                    <i class="fas fa-spinner fa-spin"></i> Caricamento tesserati…
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <style>
          .toolbar{display:flex;gap:1rem;justify-content:space-between;align-items:center;margin-bottom:1rem}
          .input-group{position:relative}
          .input-icon{position:absolute;left:.75rem;top:50%;transform:translateY(-50%);opacity:.6}
          .input-group .form-control{padding-left:2.25rem;min-width:280px}
          .badge{display:inline-block;padding:.25rem .5rem;border-radius:.5rem;font-size:.75rem;font-weight:600}
          .badge-active{background:#10b98120;color:#10b981;border:1px solid #10b98140}
          .badge-expiring{background:#f59e0b20;color:#f59e0b;border:1px solid #f59e0b40}
          .badge-expired{background:#ef444420;color:#ef4444;border:1px solid #ef444440}
          .btn-icon{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:.5rem;border:1px solid var(--glass-border);background:var(--glass-bg);cursor:pointer}
          .btn-icon:hover{background:var(--glass-bg-strong)}
          .phone-mono{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; letter-spacing:.2px}
          @media (max-width: 768px){
            .toolbar{flex-direction:column;align-items:stretch}
          }
        </style>
      `;
    }

    async initializePage() {
      // carico subito da cache (sincrono)
      this._bindUI();
      this._loadAndRender(); // usa storage.getContacts() sincrono
    }

    _bindUI() {
      const search = document.getElementById('contactsSearch');
      const status = document.getElementById('contactsStatus');
      const sort = document.getElementById('contactsSort');
      const refresh = document.getElementById('contactsRefresh');

      if (search) {
        search.addEventListener('input', () => {
          this.searchTerm = search.value.trim().toLowerCase();
          this._renderTable();
        });
      }

      if (status) {
        status.addEventListener('change', () => {
          this.statusFilter = status.value;
          this._renderTable();
        });
      }

      if (sort) {
        sort.addEventListener('change', () => {
          const [k, d] = sort.value.split('|');
          this.sortKey = k;
          this.sortDir = d;
          this._renderTable();
        });
      }

      if (refresh) {
        refresh.addEventListener('click', async () => {
          refresh.disabled = true;
          refresh.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aggiorno…';
          try {
            if (window.App?.modules?.storage?.refreshMembers) {
              await window.App.modules.storage.refreshMembers();
            }
          } finally {
            refresh.disabled = false;
            refresh.innerHTML = '<i class="fas fa-rotate-right"></i> Aggiorna';
            this._loadAndRender(); // re-render da cache
          }
        });
      }
    }

    _loadAndRender() {
      try {
        const storage = window.App?.modules?.storage || window.Storage_Instance;
        if (!storage) {
          this._empty('Storage non disponibile');
          return;
        }
        const contacts = storage.getContacts(); // SINCRONO
        this.filtered = Array.isArray(contacts) ? contacts : [];
        this._renderTable();
      } catch (err) {
        console.error('❌ [Contacts] load error:', err);
        this._empty('Errore nel caricamento contatti');
      }
    }

    _renderTable() {
      const tbody = document.getElementById('contactsTableBody');
      if (!tbody) return;

      // filtro
      let rows = this.filtered.filter(c => {
        if (this.statusFilter !== 'all' && c.status !== this.statusFilter) return false;
        if (!this.searchTerm) return true;
        const needle = this.searchTerm;
        return (
          (c.name || '').toLowerCase().includes(needle) ||
          (c.email || '').toLowerCase().includes(needle) ||
          (c.phone || '').toLowerCase().includes(needle)
        );
      });

      // sort
      rows.sort((a, b) => {
        if (this.sortKey === 'name') {
          const av = (a.name || '').toLowerCase();
          const bv = (b.name || '').toLowerCase();
          if (av < bv) return this.sortDir === 'asc' ? -1 : 1;
          if (av > bv) return this.sortDir === 'asc' ? 1 : -1;
          return 0;
        }
        if (this.sortKey === 'expiry') {
          const ax = a.dataScadenza ? new Date(a.dataScadenza).getTime() : Infinity;
          const bx = b.dataScadenza ? new Date(b.dataScadenza).getTime() : Infinity;
          return this.sortDir === 'asc' ? (ax - bx) : (bx - ax);
        }
        return 0;
      });

      if (rows.length === 0) {
        this._empty('Nessun contatto trovato');
        return;
      }

      tbody.innerHTML = rows.map(c => {
        const ds = c.dataScadenza ? new Date(c.dataScadenza) : null;
        const dsStr = ds ? ds.toLocaleDateString('it-IT') : '-';
        const badgeClass =
          c.status === 'expired' ? 'badge-expired' :
          c.status === 'expiring' ? 'badge-expiring' : 'badge-active';
        const badgeLabel =
          c.status === 'expired' ? 'Scaduto' :
          c.status === 'expiring' ? 'In scadenza' : 'Attivo';

        const phoneSafe = c.phone || '';
        return `
          <tr>
            <td><strong>${this._esc(c.name)}</strong><br><small>${this._esc(c.email || '')}</small></td>
            <td class="phone-mono">${this._esc(phoneSafe)}</td>
            <td>${dsStr}${typeof c.daysTillExpiry === 'number' ? ` <small>(${c.daysTillExpiry} gg)</small>` : ''}</td>
            <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
            <td>
              <div style="display:flex;gap:.5rem;">
                <button class="btn-icon" title="WhatsApp" data-act="wa" data-phone="${this._attr(phoneSafe)}" data-name="${this._attr(c.name)}">
                  <i class="fab fa-whatsapp"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // bind azioni
      tbody.querySelectorAll('button[data-act="wa"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const phone = btn.getAttribute('data-phone') || '';
          const name = btn.getAttribute('data-name') || 'Cliente';
          const msg = `Ciao ${name.split(' ')[0]}! 👋`;
          if (window.TribuApp?.sendWhatsAppMessage) {
            window.TribuApp.sendWhatsAppMessage(phone, msg);
          } else {
            // fallback assoluto
            const url = `https://wa.me/${phone.replace(/[^\d]/g,'')}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
          }
        });
      });
    }

    _empty(text) {
      const tbody = document.getElementById('contactsTableBody');
      if (!tbody) return;
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:2.5rem; opacity:.7;">
            <div class="table-empty">
              <div class="table-empty-icon"><i class="fas fa-user-slash" style="font-size:28px;opacity:.5;"></i></div>
              <h4 style="margin:.5rem 0;">${this._esc(text)}</h4>
            </div>
          </td>
        </tr>
      `;
    }

    _esc(s) {
      return (s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }
    _attr(s) {
      return (s || '').replace(/"/g, '&quot;');
    }
  }

  // Esporta in App
  window.Contacts_Module = new ContactsModule();
  // Compat: alcuni router cercano window.App.modules.contacts
  window.App = window.App || { modules: {} };
  window.App.modules = window.App.modules || {};
  window.App.modules.contacts = window.Contacts_Module;
})();
