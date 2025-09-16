// assets/js/modules/scadenze.js
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
  
  function formatISO(d) {
    if (!d) return '';
    const z = new Date(d);
    const yyyy = z.getFullYear();
    const mm = String(z.getMonth() + 1).padStart(2, '0');
    const dd = String(z.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }
  
  function addYears(d, n) { 
    const x = new Date(d.getTime()); 
    x.setFullYear(x.getFullYear() + (n||1)); 
    return x; 
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
  
  function pickPhone(m) { 
    return m?.whatsapp || m?.phone || m?.telefono || m?.cellulare || ''; 
  }
  
  function pickName(m) { 
    // Prendi solo il nome (prima parola)
    const fullName = m?.fullName || m?.name || m?.nome || m?.nominativo || '';
    return fullName.split(' ')[0] || fullName;
  }
  
  function pickExpiry(m) { 
    return m?.scadenza || m?.dataScadenza || m?.expiryDate || m?.expiry || m?.nextRenewal || null; 
  }
  
  function pickTessera(m) {
    return m?.numeroTessera || m?.tesseraNumber || m?.tessera || '';
  }

  function vmFromMember(m) {
    const expiry = parseDateMaybe(pickExpiry(m));
    const daysLeft = daysLeftFromToday(expiry);
    const status = computeStatus(daysLeft);
    return { 
      id: m.id, 
      name: pickName(m), 
      fullName: m.fullName || `${m.nome || ''} ${m.cognome || ''}`.trim(),
      phone: pickPhone(m), 
      numeroTessera: pickTessera(m),
      expiry, 
      daysLeft, 
      status, 
      raw: m 
    };
  }

  function statusBadge(status, daysLeft) {
    if (status === 'unknown') {
      return '<span class="badge badge-gray">Sconosciuto</span>';
    }
    if (status === 'expired') {
      return '<span class="badge badge-danger">Scaduto</span>';
    }
    if (status === 'expiring') {
      return '<span class="badge badge-warning">In scadenza</span>';
    }
    return '<span class="badge badge-success">Attivo</span>';
  }

  function ensureStylesOnce() {
    if (document.getElementById('scadenze-styles')) return;
    const css = `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      
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
      
      .btn-success {
        background: #22c55e;
        color: white;
      }
      
      .btn-success:hover {
        background: #16a34a;
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
      
      .badge-gray {
        background: #f3f4f6;
        color: #6b7280;
      }
      
      .action-buttons {
        display: flex;
        gap: 0.5rem;
      }
      
      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
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
    style.id = 'scadenze-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function askDate(member) {
    return new Promise((resolve) => {
      const currentExpiry = parseDateMaybe(pickExpiry(member.raw));
      const suggestedDate = currentExpiry ? addYears(currentExpiry, 1) : addYears(new Date(), 1);
      
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Imposta Scadenza - ${member.fullName}</h3>
          </div>
          <div class="form-group">
            <label class="form-label">Data Scadenza</label>
            <input type="date" id="renewal-date" class="form-input" value="${suggestedDate.toISOString().split('T')[0]}">
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-btn">Annulla</button>
            <button class="btn btn-primary" id="save-btn">Salva</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('active'), 10);
      
      const cleanup = (value) => {
        modal.classList.remove('active');
        setTimeout(() => {
          modal.remove();
          resolve(value);
        }, 300);
      };
      
      modal.querySelector('#cancel-btn').onclick = () => cleanup(null);
      modal.querySelector('#save-btn').onclick = () => {
        const date = modal.querySelector('#renewal-date').value;
        cleanup(date || null);
      };
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) cleanup(null);
      });
    });
  }

  async function renewMember(member, storage) {
    const newDate = await askDate(member);
    if (!newDate) return false;

    const payload = { 
      scadenza: newDate,
      dataScadenza: newDate 
    };
    
    try {
      if (storage.firebase?.db) {
        await storage.firebase.db.collection('members').doc(member.id).set(payload, { merge: true });
      } else if (typeof storage.updateMember === 'function') {
        await storage.updateMember(member.id, payload);
      } else {
        alert('Aggiornamento non disponibile.');
        return false;
      }
      
      await storage.refreshMembers?.();
      window.App?._updateBadges?.();
      return true;
    } catch (e) {
      console.error('renewMember error:', e);
      alert('Errore nel salvataggio.');
      return false;
    }
  }

  async function deleteMember(member, storage) {
    if (!confirm(`Eliminare "${member.fullName}"?`)) return false;
    
    try {
      if (storage.firebase?.db) {
        await storage.firebase.db.collection('members').doc(member.id).delete();
      } else if (typeof storage.deleteMember === 'function') {
        await storage.deleteMember(member.id);
      } else {
        alert('Eliminazione non disponibile.');
        return false;
      }
      
      await storage.refreshMembers?.();
      window.App?._updateBadges?.();
      return true;
    } catch (e) {
      console.error('deleteMember error:', e);
      alert('Errore nell\'eliminazione.');
      return false;
    }
  }

  function sendWhatsApp(phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  function render(container, vms, query = '') {
    // Filtro per query
    let list = vms;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(vm => 
        (vm.fullName || '').toLowerCase().includes(q) || 
        (vm.phone || '').toLowerCase().includes(q)
      );
    }
    
    // Separa per stato
    const expired = list.filter(vm => vm.status === 'expired');
    const expiring = list.filter(vm => vm.status === 'expiring');
    const unknown = list.filter(vm => vm.status === 'unknown');
    
    // Mostra tutti i tesserati che non hanno stato 'active'
    const toShow = [...expired, ...expiring, ...unknown];

    container.innerHTML = `
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input 
            type="text" 
            id="search-input" 
            class="search-input" 
            placeholder="Cerca per nome o telefono..." 
            value="${query}"
          >
        </div>
        <button id="reload-btn" class="btn btn-secondary">
          <i class="fas fa-sync-alt"></i> Ricarica
        </button>
      </div>

      <div class="card">
        ${toShow.length === 0 ? `
          <div class="empty-state">
            <i class="fas fa-check-circle"></i>
            <h3>Tutto in regola!</h3>
            <p>Non ci sono tesserati in scadenza o senza data di scadenza.</p>
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome e Cognome</th>
                <th>Telefono</th>
                <th>Scadenza</th>
                <th>Stato</th>
                <th>Giorni</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody id="table-body">
              ${toShow.map(vm => `
                <tr data-id="${vm.id}">
                  <td><strong>${vm.fullName || '—'}</strong></td>
                  <td>${vm.phone || '—'}</td>
                  <td>${vm.expiry ? formatISO(vm.expiry) : '—'}</td>
                  <td>${statusBadge(vm.status, vm.daysLeft)}</td>
                  <td>${vm.daysLeft != null ? `${vm.daysLeft} gg` : '—'}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn btn-sm btn-secondary" data-action="whatsapp" data-id="${vm.id}">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                      </button>
                      <button class="btn btn-sm btn-success" data-action="renew" data-id="${vm.id}">
                        <i class="fas fa-check"></i> Rinnova
                      </button>
                      <button class="btn btn-sm btn-danger" data-action="delete" data-id="${vm.id}">
                        <i class="fas fa-trash"></i> Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    // Event handlers
    const searchInput = container.querySelector('#search-input');
    const reloadBtn = container.querySelector('#reload-btn');
    const tableBody = container.querySelector('#table-body');
    
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        render(container, vms, e.target.value);
      }, 300);
    });
    
    reloadBtn?.addEventListener('click', async () => {
      reloadBtn.disabled = true;
      reloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Caricamento...';
      await ScadenzeModule.init();
      ScadenzeModule.mount(container);
    });
    
    tableBody?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const vm = vms.find(v => v.id === id);
      if (!vm) return;
      
      const storage = window.Storage_Instance;
      
      if (action === 'whatsapp') {
        // MESSAGGIO FORMATTATO CORRETTAMENTE
        let message = '';
        const nome = vm.name; // Solo il primo nome
        const numeroTessera = vm.numeroTessera || Math.floor(100000 + Math.random() * 900000); // Genera numero random se non c'è
        
        if (vm.status === 'expired') {
          // Messaggio per tessera scaduta
          message = `Ciao ${nome}! Il tuo tesseramento e copertura assicurativa (n. ${numeroTessera}) sono scaduti. Rinnovali subito! 💪\n\nTi aspettiamo in studio.\nTeam Tribù`;
        } else if (vm.status === 'expiring') {
          // Messaggio per tessera in scadenza
          const giorni = Math.abs(vm.daysLeft);
          const scadenza = formatISO(vm.expiry);
          message = `Ciao ${nome}! Il tuo tesseramento e copertura assicurativa (n. ${numeroTessera}) scadrà tra ${giorni} giorni (il ${scadenza}).\n\nRinnovala in tempo! 💪\n\nTi aspettiamo in studio.\nTeam Tribù`;
        } else {
          // Messaggio per data non impostata
          message = `Ciao ${nome}! Il tuo tesseramento e copertura assicurativa (n. ${numeroTessera}) necessitano di aggiornamento.\n\nContattaci per il rinnovo! 💪\n\nTi aspettiamo in studio.\nTeam Tribù`;
        }
        
        sendWhatsApp(vm.phone, message);
      }
      
      if (action === 'renew') {
        const success = await renewMember(vm, storage);
        if (success) {
          await ScadenzeModule.init();
          ScadenzeModule.mount(container);
        }
      }
      
      if (action === 'delete') {
        const success = await deleteMember(vm, storage);
        if (success) {
          await ScadenzeModule.init();
          ScadenzeModule.mount(container);
        }
      }
    });
  }

  const ScadenzeModule = {
    _vms: [],

    async init() {
      console.log('📅 [Scadenze] init');
      ensureStylesOnce();

      const storage = window.Storage_Instance;
      if (!storage) return;

      if (!storage.isInitialized) {
        try { await storage.init(); } catch {}
      }
      
      if (typeof storage.getMembersCached === 'function' && storage.getMembersCached().length === 0) {
        try { await storage.refreshMembers(); } catch {}
      }

      const members = storage.getMembersCached?.() || [];
      this._vms = members.map(vmFromMember);
      
      // Aggiorna titolo pagina
      if (window.updatePageTitle) {
        window.updatePageTitle('Scadenze');
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
              <p>Impossibile caricare i dati dei tesserati.</p>
            </div>
          </div>
        `;
        return;
      }

      const members = storage.getMembersCached?.() || [];
      this._vms = members.map(vmFromMember);
      render(container, this._vms);
    }
  };

  window.ScadenzeModule = ScadenzeModule;
})();