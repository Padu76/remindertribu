// assets/js/modules/contacts.js
(function() {
  'use strict';

  function ensureStylesOnce() {
    if (document.getElementById('contacts-styles')) return;
    const css = `
      /* TribuStudio Style per Contacts */
      .toolbar {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      
      .search-box {
        flex: 1;
        max-width: 400px;
        position: relative;
      }
      
      .search-input {
        width: 100%;
        padding: 0.625rem 1rem 0.625rem 2.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        transition: all 0.3s;
      }
      
      .search-input:focus {
        outline: none;
        border-color: #f97316;
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
      }
      
      .search-icon {
        position: absolute;
        left: 0.875rem;
        top: 50%;
        transform: translateY(-50%);
        color: #64748b;
      }
      
      .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 8px;
        border: none;
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.3s;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .btn-primary {
        background: #f97316;
        color: white;
      }
      
      .btn-primary:hover {
        background: #ea580c;
      }
      
      .btn-secondary {
        background: #e2e8f0;
        color: #1e293b;
      }
      
      .btn-secondary:hover {
        background: #cbd5e1;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      
      .data-table thead {
        background: #f8fafc;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .data-table th {
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
      }
      
      .data-table tbody tr {
        border-bottom: 1px solid #e2e8f0;
        transition: background 0.2s;
      }
      
      .data-table tbody tr:hover {
        background: #f8fafc;
      }
      
      .data-table td {
        padding: 1rem;
        color: #1e293b;
      }
      
      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }
      
      .badge-success {
        background: #dcfce7;
        color: #166534;
      }
      
      .badge-warning {
        background: #fed7aa;
        color: #9a3412;
      }
      
      .badge-danger {
        background: #fee2e2;
        color: #991b1b;
      }
      
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #64748b;
      }
      
      .empty-state i {
        font-size: 4rem;
        color: #e2e8f0;
        margin-bottom: 1rem;
      }
      
      .empty-state h3 {
        font-size: 1.25rem;
        color: #1e293b;
        margin-bottom: 0.5rem;
      }
    `;
    const style = document.createElement('style');
    style.id = 'contacts-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function getFullName(member) {
    // Prova vari campi possibili per il nome completo
    if (member.fullName) return member.fullName;
    if (member.nominativo) return member.nominativo;
    
    // Combina nome e cognome se sono separati
    const nome = member.nome || member.name || '';
    const cognome = member.cognome || member.surname || member.lastName || '';
    
    if (nome && cognome) {
      return `${nome} ${cognome}`;
    }
    
    // Fallback su quello che c'è
    return nome || cognome || member.name || '';
  }

  function getPhone(member) {
    return member.whatsapp || member.telefono || member.phone || member.cellulare || '';
  }

  function getExpiry(member) {
    const val = member.scadenza || member.dataScadenza || member.expiryDate || member.expiry || member.nextRenewal;
    if (!val) return null;
    
    if (val instanceof Date) return val;
    if (val && typeof val === 'object' && typeof val.toDate === 'function') {
      try { return val.toDate(); } catch {}
    }
    
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }

  function formatDate(date) {
    if (!date) return '—';
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  function getStatus(expiryDate) {
    if (!expiryDate) return { text: 'Non impostata', class: 'badge-secondary' };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Scaduto', class: 'badge-danger' };
    } else if (diffDays <= 30) {
      return { text: 'In scadenza', class: 'badge-warning' };
    } else {
      return { text: 'Attivo', class: 'badge-success' };
    }
  }

  function render(container, members, query = '') {
    // Filtra membri
    let filtered = members;
    if (query) {
      const q = query.toLowerCase();
      filtered = members.filter(m => 
        getFullName(m).toLowerCase().includes(q) ||
        getPhone(m).toLowerCase().includes(q)
      );
    }

    container.innerHTML = `
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input 
            type="text" 
            id="search-input" 
            class="search-input" 
            placeholder="Cerca tesserato..." 
            value="${query}"
          >
        </div>
        <button id="add-btn" class="btn btn-primary">
          <i class="fas fa-plus"></i> Nuovo Tesserato
        </button>
        <button id="reload-btn" class="btn btn-secondary">
          <i class="fas fa-sync-alt"></i> Ricarica
        </button>
      </div>

      <div class="card">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <h3>Nessun tesserato trovato</h3>
            <p>Aggiungi il primo tesserato o modifica i criteri di ricerca.</p>
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome e Cognome</th>
                <th>Telefono</th>
                <th>Scadenza</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(member => {
                const status = getStatus(getExpiry(member));
                return `
                  <tr>
                    <td><strong>${getFullName(member) || '—'}</strong></td>
                    <td>${getPhone(member) || '—'}</td>
                    <td>${formatDate(getExpiry(member))}</td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>
                      <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${member.id}">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-danger" data-action="delete" data-id="${member.id}">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    // Event handlers
    const searchInput = container.querySelector('#search-input');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        render(container, members, e.target.value);
      }, 300);
    });

    container.querySelector('#add-btn')?.addEventListener('click', () => {
      alert('Funzione in sviluppo');
    });

    container.querySelector('#reload-btn')?.addEventListener('click', async () => {
      const btn = container.querySelector('#reload-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Caricamento...';
      await ContactsModule.init();
      ContactsModule.mount(container);
    });
  }

  const ContactsModule = {
    members: [],

    async init() {
      console.log('👥 [Contacts] init');
      ensureStylesOnce();
      
      const storage = window.Storage_Instance;
      if (!storage) return;

      if (!storage.isInitialized) {
        try { await storage.init(); } catch {}
      }

      try {
        await storage.refreshMembers();
      } catch {}

      this.members = storage.getMembersCached?.() || [];
      
      if (window.updatePageTitle) {
        window.updatePageTitle('Tesserati CSEN');
      }
      
      return true;
    },

    async mount(container) {
      const storage = window.Storage_Instance;
      if (!storage) {
        container.innerHTML = `
          <div class="card">
            <div class="empty-state">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Storage non disponibile</h3>
            </div>
          </div>
        `;
        return;
      }

      this.members = storage.getMembersCached?.() || [];
      render(container, this.members);
    }
  };

  window.ContactsModule = ContactsModule;
})();