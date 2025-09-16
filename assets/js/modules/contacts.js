// assets/js/modules/contacts.js
(function() {
  'use strict';

  function ensureStylesOnce() {
    if (document.getElementById('contacts-styles')) return;
    const css = `
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
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        font-size: 0.875rem;
        background: white;
        color: black;
      }
      
      .search-input:focus {
        outline: none;
        border-color: #ff6b35;
      }
      
      .search-icon {
        position: absolute;
        left: 0.875rem;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
      }
      
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        border: none;
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .btn-primary {
        background: #ff6b35;
        color: white;
      }
      
      .btn-primary:hover {
        background: #e55a2b;
      }
      
      .btn-secondary {
        background: white;
        color: black;
        border: 1px solid #e0e0e0;
      }
      
      .btn-secondary:hover {
        border-color: black;
      }
      
      .btn-danger {
        background: #ef4444;
        color: white;
      }
      
      .btn-danger:hover {
        background: #dc2626;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      
      .data-table thead {
        background: #f5f5f5;
      }
      
      .data-table th {
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #e0e0e0;
      }
      
      .data-table tbody tr {
        border-bottom: 1px solid #e0e0e0;
      }
      
      .data-table tbody tr:hover {
        background: #f5f5f5;
      }
      
      .data-table td {
        padding: 1rem;
        color: black;
      }
      
      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .badge-success {
        background: #dcfce7;
        color: #166534;
      }
      
      .badge-warning {
        background: #fef3c7;
        color: #92400e;
      }
      
      .badge-danger {
        background: #fee2e2;
        color: #991b1b;
      }
      
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #666;
      }
      
      .empty-state i {
        font-size: 4rem;
        color: #e0e0e0;
        margin-bottom: 1rem;
      }
      
      .empty-state h3 {
        font-size: 1.25rem;
        color: black;
        margin-bottom: 0.5rem;
      }
      
      .btn-sm {
        padding: 0.375rem 0.625rem;
        font-size: 0.8rem;
      }
      
      .action-buttons {
        display: flex;
        gap: 0.5rem;
      }
      
      /* Modal Styles */
      .modal-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        align-items: center;
        justify-content: center;
      }
      
      .modal-overlay.active {
        display: flex;
      }
      
      .modal {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .modal-header {
        margin-bottom: 1.5rem;
      }
      
      .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: black;
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: black;
      }
      
      .form-input {
        width: 100%;
        padding: 0.625rem 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        font-size: 0.875rem;
        background: white;
        color: black;
      }
      
      .form-input:focus {
        outline: none;
        border-color: #ff6b35;
      }
      
      .modal-footer {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
      }
    `;
    const style = document.createElement('style');
    style.id = 'contacts-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function getFullName(member) {
    if (member.fullName) return member.fullName;
    if (member.nominativo) return member.nominativo;
    
    const nome = member.nome || member.name || '';
    const cognome = member.cognome || member.surname || member.lastName || '';
    
    if (nome && cognome) {
      return `${nome} ${cognome}`;
    }
    
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

  function showEditModal(member, onSave) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Modifica Tesserato</h3>
        </div>
        
        <div class="form-group">
          <label class="form-label">Nome</label>
          <input type="text" class="form-input" id="edit-nome" value="${member.nome || ''}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Cognome</label>
          <input type="text" class="form-input" id="edit-cognome" value="${member.cognome || ''}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Telefono/WhatsApp</label>
          <input type="tel" class="form-input" id="edit-telefono" value="${getPhone(member)}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Numero Tessera</label>
          <input type="text" class="form-input" id="edit-tessera" value="${member.numeroTessera || ''}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Data Scadenza</label>
          <input type="date" class="form-input" id="edit-scadenza" value="${member.dataScadenza || ''}">
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-btn">Annulla</button>
          <button class="btn btn-primary" id="save-btn">Salva</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    const cleanup = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('#cancel-btn').onclick = cleanup;
    
    modal.querySelector('#save-btn').onclick = () => {
      const updatedData = {
        nome: modal.querySelector('#edit-nome').value.trim(),
        cognome: modal.querySelector('#edit-cognome').value.trim(),
        whatsapp: modal.querySelector('#edit-telefono').value.trim(),
        numeroTessera: modal.querySelector('#edit-tessera').value.trim(),
        dataScadenza: modal.querySelector('#edit-scadenza').value
      };
      
      onSave(updatedData);
      cleanup();
    };
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cleanup();
    });
  }

  async function updateMember(memberId, updates) {
    const storage = window.Storage_Instance;
    if (!storage) return false;
    
    try {
      if (storage.firebase?.db) {
        await storage.firebase.db.collection('members').doc(memberId).set(updates, { merge: true });
      } else if (typeof storage.updateMember === 'function') {
        await storage.updateMember(memberId, updates);
      }
      
      await storage.refreshMembers?.();
      return true;
    } catch (e) {
      console.error('Error updating member:', e);
      alert('Errore durante l\'aggiornamento');
      return false;
    }
  }

  async function deleteMember(memberId) {
    if (!confirm('Sei sicuro di voler eliminare questo tesserato?')) return false;
    
    const storage = window.Storage_Instance;
    if (!storage) return false;
    
    try {
      if (storage.firebase?.db) {
        await storage.firebase.db.collection('members').doc(memberId).delete();
      } else if (typeof storage.deleteMember === 'function') {
        await storage.deleteMember(memberId);
      }
      
      await storage.refreshMembers?.();
      return true;
    } catch (e) {
      console.error('Error deleting member:', e);
      alert('Errore durante l\'eliminazione');
      return false;
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
            <tbody id="table-body">
              ${filtered.map(member => {
                const status = getStatus(getExpiry(member));
                return `
                  <tr data-id="${member.id}">
                    <td><strong>${getFullName(member) || '—'}</strong></td>
                    <td>${getPhone(member) || '—'}</td>
                    <td>${formatDate(getExpiry(member))}</td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${member.id}">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${member.id}">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
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
      const newMember = {
        nome: '',
        cognome: '',
        whatsapp: '',
        numeroTessera: '',
        dataScadenza: ''
      };
      
      showEditModal(newMember, async (data) => {
        const storage = window.Storage_Instance;
        if (storage?.firebase?.db) {
          await storage.firebase.db.collection('members').add(data);
          await storage.refreshMembers?.();
          ContactsModule.mount(container);
        }
      });
    });

    container.querySelector('#reload-btn')?.addEventListener('click', async () => {
      const btn = container.querySelector('#reload-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Caricamento...';
      await ContactsModule.init();
      ContactsModule.mount(container);
    });
    
    // Table actions
    container.querySelector('#table-body')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const member = members.find(m => m.id === id);
      
      if (action === 'edit' && member) {
        showEditModal(member, async (updatedData) => {
          const success = await updateMember(id, updatedData);
          if (success) {
            await ContactsModule.init();
            ContactsModule.mount(container);
          }
        });
      }
      
      if (action === 'delete') {
        const success = await deleteMember(id);
        if (success) {
          await ContactsModule.init();
          ContactsModule.mount(container);
        }
      }
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