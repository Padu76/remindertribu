// assets/js/modules/marketing.js
(function() {
  'use strict';

  const DEFAULT_TEMPLATES = {
    motivational: {
      id: 'motivational',
      key: 'motivational',
      name: 'Frase Motivazionale',
      category: 'motivation',
      body: `Ciao {nome}! 💪

Ricorda: "Il successo non è definitivo, il fallimento non è fatale: è il coraggio di continuare che conta."

Ogni giorno è una nuova opportunità per migliorare. Non mollare mai!

Il tuo team Tribù 🔥`,
      variables: ['{nome}']
    },
    meal_reminder: {
      id: 'meal_reminder',
      key: 'meal_reminder', 
      name: 'Promemoria Ordine Pasti',
      category: 'reminder',
      body: `Ciao {nome}! 🍽️

Ti ricordiamo che è il momento di ordinare i tuoi pasti per la prossima settimana!

📅 Scadenza ordini: Giovedì ore 18:00
🚚 Consegna: Lunedì mattina

Menù disponibile sul nostro sito.

Per ordinare rispondi a questo messaggio o chiamaci!

Team Tribù Nutrition 🥗`,
      variables: ['{nome}']
    },
    renewal_reminder: {
      id: 'renewal_reminder',
      key: 'renewal_reminder',
      name: 'Promemoria Rinnovo',
      category: 'renewal',
      body: `Ciao {nome}! 

La tua tessera scadrà tra {giorni} giorni (il {scadenza}).

Rinnovala in tempo per non perdere i tuoi progressi! 💪

Ti aspettiamo in palestra.
Team Tribù`,
      variables: ['{nome}', '{giorni}', '{scadenza}']
    }
  };

  // Utility per compilare template con dati reali
  function compileTemplate(templateBody, member) {
    if (!templateBody || !member) return templateBody || '';
    
    const nome = (member.fullName || member.nome || '').split(' ')[0] || 'Cliente';
    const numeroTessera = member.numeroTessera || Math.floor(100000 + Math.random() * 900000);
    
    // Parse date scadenza
    let scadenza = '';
    let giorni = '';
    
    const expiryDate = parseDate(member.scadenza || member.dataScadenza || member.expiryDate);
    if (expiryDate) {
      scadenza = formatDate(expiryDate);
      const today = new Date();
      const diffTime = expiryDate - today;
      giorni = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return templateBody
      .replace(/\{nome\}/g, nome)
      .replace(/\{giorni\}/g, giorni)
      .replace(/\{scadenza\}/g, scadenza)
      .replace(/\{numeroTessera\}/g, numeroTessera);
  }

  function parseDate(dateValue) {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    
    // Handle Firestore timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      try { return dateValue.toDate(); } catch {}
    }
    
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }

  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Integrazione WhatsApp
  function sendWhatsAppMessage(phone, message) {
    console.log('📱 Sending WhatsApp message:', { phone, message: message.substring(0, 50) + '...' });
    
    // Usa il modulo WhatsApp se disponibile
    if (window.TribuApp?.sendWhatsAppMessage) {
      window.TribuApp.sendWhatsAppMessage(phone, message);
      return;
    }
    
    // Fallback: apertura diretta WhatsApp Web
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  function ensureStylesOnce() {
    if (document.getElementById('marketing-styles')) return;
    const css = `
      .marketing-container {
        display: grid;
        gap: 1.5rem;
      }
      
      .marketing-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
      }
      
      .template-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
        border: 1px solid #e2e8f0;
      }
      
      .template-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
      
      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1rem;
      }
      
      .template-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
      }
      
      .template-category {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        background: #e2e8f0;
        color: #64748b;
      }
      
      .template-body {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        white-space: pre-wrap;
        font-size: 0.875rem;
        color: #475569;
        max-height: 200px;
        overflow-y: auto;
        line-height: 1.4;
      }
      
      .template-variables {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      
      .variable-tag {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        background: #fef3c7;
        color: #92400e;
        border-radius: 6px;
        font-size: 0.75rem;
        font-family: monospace;
      }
      
      .template-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
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
        text-decoration: none;
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
      
      .btn-success {
        background: #22c55e;
        color: white;
      }
      
      .btn-success:hover {
        background: #16a34a;
      }
      
      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
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
        max-width: 700px;
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
        color: #1e293b;
        margin: 0;
      }
      
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      .form-group.full-width {
        grid-column: 1 / -1;
      }
      
      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #1e293b;
      }
      
      .form-input, .form-textarea, .form-select {
        width: 100%;
        padding: 0.625rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        font-family: inherit;
        box-sizing: border-box;
      }
      
      .form-textarea {
        min-height: 200px;
        resize: vertical;
        font-family: inherit;
      }
      
      .form-input:focus, .form-textarea:focus, .form-select:focus {
        outline: none;
        border-color: #f97316;
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
      }
      
      .modal-footer {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
      }
      
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #64748b;
      }
      
      .empty-state i {
        font-size: 3rem;
        color: #cbd5e1;
        margin-bottom: 1rem;
      }
      
      .send-options {
        background: #f8fafc;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
      }
      
      .recipients-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 0.5rem;
        margin-top: 0.5rem;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .recipient-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: white;
        border-radius: 6px;
        font-size: 0.875rem;
      }
      
      .recipient-checkbox {
        margin: 0;
      }
      
      .preview-message {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
        white-space: pre-wrap;
        font-size: 0.875rem;
        max-height: 150px;
        overflow-y: auto;
      }
    `;
    
    const style = document.createElement('style');
    style.id = 'marketing-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function normalizeTemplate(template) {
    if (!template) return null;
    return {
      id: template.id || template.key,
      key: template.key || template.id, 
      name: template.name || 'Template senza nome',
      category: template.category || 'general',
      body: template.body || '',
      variables: template.variables || (template.body ? (template.body.match(/\{[^}]+\}/g) || []) : []),
      updatedAt: template.updatedAt
    };
  }

  function showTemplateEditor(template = null, onSave) {
    const isNew = !template;
    const normalizedTemplate = template ? normalizeTemplate(template) : null;
    
    console.log('✏️ Opening template editor:', { isNew, template: normalizedTemplate });
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${isNew ? 'Nuovo Template' : 'Modifica Template'}</h3>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nome Template</label>
            <input type="text" class="form-input" id="template-name" value="${normalizedTemplate?.name || ''}" placeholder="Es. Promemoria Rinnovo">
          </div>
          
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select class="form-select" id="template-category">
              <option value="motivation" ${normalizedTemplate?.category === 'motivation' ? 'selected' : ''}>Motivazione</option>
              <option value="reminder" ${normalizedTemplate?.category === 'reminder' ? 'selected' : ''}>Promemoria</option>
              <option value="renewal" ${normalizedTemplate?.category === 'renewal' ? 'selected' : ''}>Rinnovo</option>
              <option value="promo" ${normalizedTemplate?.category === 'promo' ? 'selected' : ''}>Promozione</option>
              <option value="general" ${normalizedTemplate?.category === 'general' ? 'selected' : ''}>Generale</option>
            </select>
          </div>
        </div>
        
        <div class="form-group full-width">
          <label class="form-label">Messaggio</label>
          <textarea class="form-textarea" id="template-body" placeholder="Scrivi qui il tuo messaggio...">${normalizedTemplate?.body || ''}</textarea>
          <small style="color: #64748b; margin-top: 0.5rem; display: block;">
            💡 Variabili disponibili: {nome}, {giorni}, {scadenza}, {numeroTessera}
          </small>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancel-btn">Annulla</button>
          <button type="button" class="btn btn-primary" id="save-btn">
            <i class="fas fa-save"></i> Salva Template
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('active'));
    
    const cleanup = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('#cancel-btn').onclick = cleanup;
    
    modal.querySelector('#save-btn').onclick = async () => {
      const name = modal.querySelector('#template-name').value.trim();
      const category = modal.querySelector('#template-category').value;
      const body = modal.querySelector('#template-body').value.trim();
      
      if (!name) {
        alert('Il nome del template è obbligatorio');
        return;
      }
      
      if (!body) {
        alert('Il messaggio del template è obbligatorio');
        return;
      }
      
      const templateId = normalizedTemplate?.id || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const updatedTemplate = {
        id: templateId,
        key: templateId,
        name,
        category,
        body,
        variables: (body.match(/\{[^}]+\}/g) || []),
        updatedAt: new Date().toISOString()
      };
      
      try {
        await onSave(updatedTemplate);
        cleanup();
      } catch (error) {
        console.error('Errore salvataggio template:', error);
        alert('Errore durante il salvataggio del template');
      }
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) cleanup();
    };
  }

  function showSendModal(template, onSend) {
    const storage = window.Storage_Instance;
    if (!storage) {
      alert('Storage non disponibile');
      return;
    }

    const members = storage.getMembersCached() || [];
    const validMembers = members.filter(m => {
      const phone = m.whatsapp || m.telefono || m.phone;
      return phone && phone.trim();
    });

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Invia Template: ${template.name}</h3>
        </div>
        
        <div class="send-options">
          <label class="form-label">Destinatari (${validMembers.length} con numero WhatsApp)</label>
          
          <div style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="checkbox" id="select-all" checked>
              <span>Seleziona tutti</span>
            </label>
            
            <label style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="radio" name="filter" value="all" checked>
              <span>Tutti i tesserati</span>
            </label>
            
            <label style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="radio" name="filter" value="expiring">
              <span>Solo in scadenza (≤30 giorni)</span>
            </label>
            
            <label style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="radio" name="filter" value="expired">
              <span>Solo scaduti</span>
            </label>
          </div>
          
          <div class="recipients-grid" id="recipients-list"></div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Anteprima messaggio (primo destinatario)</label>
          <div class="preview-message" id="message-preview"></div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancel-send">Annulla</button>
          <button type="button" class="btn btn-success" id="confirm-send">
            <i class="fab fa-whatsapp"></i> Invia WhatsApp
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('active'));
    
    const cleanup = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    let filteredMembers = validMembers;
    
    function updateMembersList() {
      const filter = modal.querySelector('input[name="filter"]:checked').value;
      
      if (filter === 'expiring') {
        filteredMembers = validMembers.filter(m => {
          const expiry = parseDate(m.scadenza || m.dataScadenza || m.expiryDate);
          if (!expiry) return false;
          const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
          return daysLeft >= 0 && daysLeft <= 30;
        });
      } else if (filter === 'expired') {
        filteredMembers = validMembers.filter(m => {
          const expiry = parseDate(m.scadenza || m.dataScadenza || m.expiryDate);
          if (!expiry) return false;
          const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
          return daysLeft < 0;
        });
      } else {
        filteredMembers = validMembers;
      }
      
      const recipientsList = modal.querySelector('#recipients-list');
      recipientsList.innerHTML = filteredMembers.map(member => `
        <label class="recipient-item">
          <input type="checkbox" class="recipient-checkbox" data-member-id="${member.id}" checked>
          <span>${member.fullName || member.nome || 'Senza nome'}</span>
          <small style="color: #64748b;">${member.whatsapp || member.telefono || member.phone}</small>
        </label>
      `).join('');
      
      updatePreview();
    }
    
    function updatePreview() {
      const firstMember = filteredMembers[0];
      if (firstMember) {
        const compiledMessage = compileTemplate(template.body, firstMember);
        modal.querySelector('#message-preview').textContent = compiledMessage;
      }
    }
    
    // Event handlers
    modal.querySelector('#select-all').onchange = function() {
      const checkboxes = modal.querySelectorAll('.recipient-checkbox');
      checkboxes.forEach(cb => cb.checked = this.checked);
    };
    
    modal.querySelectorAll('input[name="filter"]').forEach(radio => {
      radio.onchange = updateMembersList;
    });
    
    modal.querySelector('#cancel-send').onclick = cleanup;
    
    modal.querySelector('#confirm-send').onclick = async () => {
      const selectedCheckboxes = Array.from(modal.querySelectorAll('.recipient-checkbox:checked'));
      const selectedMembers = selectedCheckboxes.map(cb => {
        const memberId = cb.dataset.memberId;
        return filteredMembers.find(m => m.id === memberId);
      }).filter(Boolean);
      
      if (selectedMembers.length === 0) {
        alert('Seleziona almeno un destinatario');
        return;
      }
      
      if (!confirm(`Inviare il messaggio a ${selectedMembers.length} destinatari?`)) {
        return;
      }
      
      cleanup();
      await onSend(selectedMembers);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) cleanup();
    };
    
    // Initialize
    updateMembersList();
  }

  async function saveTemplate(template) {
    const storage = window.Storage_Instance;
    if (!storage) {
      throw new Error('Storage non disponibile');
    }
    
    try {
      if (typeof storage.saveTemplate === 'function') {
        await storage.saveTemplate(template.id || template.key, template);
      } else if (storage.firebase?.db) {
        await storage.firebase.db.collection('templates').doc(template.id || template.key).set(template, { merge: true });
      } else {
        throw new Error('Metodo di salvataggio non disponibile');
      }
      
      await storage.refreshTemplates?.();
      return true;
    } catch (error) {
      console.error('Errore salvataggio template:', error);
      throw error;
    }
  }

  async function deleteTemplate(templateId) {
    const storage = window.Storage_Instance;
    if (!storage) {
      throw new Error('Storage non disponibile');
    }
    
    try {
      if (storage.firebase?.db) {
        await storage.firebase.db.collection('templates').doc(templateId).delete();
      }
      
      await storage.refreshTemplates?.();
      return true;
    } catch (error) {
      console.error('Errore eliminazione template:', error);
      throw error;
    }
  }

  function renderTemplates(container, templates) {
    const normalizedTemplates = templates.map(normalizeTemplate).filter(Boolean);
    
    container.innerHTML = `
      <div class="marketing-container">
        <div class="marketing-toolbar">
          <h2 style="font-size: 1.5rem; color: #1e293b; margin: 0;">Template Messaggi</h2>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary" data-action="refresh">
              <i class="fas fa-sync-alt"></i> Ricarica
            </button>
            <button type="button" class="btn btn-primary" data-action="new">
              <i class="fas fa-plus"></i> Nuovo Template
            </button>
          </div>
        </div>
        
        ${normalizedTemplates.length === 0 ? `
          <div class="card">
            <div class="empty-state">
              <i class="fas fa-envelope"></i>
              <h3 style="color: #1e293b; margin: 0.5rem 0;">Nessun template disponibile</h3>
              <p style="margin: 0;">Crea il tuo primo template per iniziare a inviare messaggi personalizzati.</p>
            </div>
          </div>
        ` : `
          <div class="template-grid">
            ${normalizedTemplates.map(template => `
              <div class="template-card">
                <div class="template-header">
                  <div class="template-title">${template.name}</div>
                  <span class="template-category">${template.category}</span>
                </div>
                
                <div class="template-body">${template.body}</div>
                
                ${template.variables?.length ? `
                  <div class="template-variables">
                    ${template.variables.map(v => `<span class="variable-tag">${v}</span>`).join('')}
                  </div>
                ` : ''}
                
                <div class="template-actions">
                  <button type="button" class="btn btn-sm btn-secondary" data-action="edit" data-id="${template.id}">
                    <i class="fas fa-edit"></i> Modifica
                  </button>
                  <button type="button" class="btn btn-sm btn-success" data-action="send" data-id="${template.id}">
                    <i class="fab fa-whatsapp"></i> Invia
                  </button>
                  <button type="button" class="btn btn-sm" style="background: #ef4444; color: white;" data-action="delete" data-id="${template.id}">
                    <i class="fas fa-trash"></i> Elimina
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
    
    // Event delegation per tutti i pulsanti
    container.addEventListener('click', async (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;
      
      const action = button.dataset.action;
      const templateId = button.dataset.id;
      
      console.log('Button clicked:', action, templateId);
      
      try {
        if (action === 'new') {
          await MarketingModule.newTemplate();
        } else if (action === 'refresh') {
          await MarketingModule.refreshTemplates();
        } else if (action === 'edit' && templateId) {
          await MarketingModule.editTemplate(templateId);
        } else if (action === 'send' && templateId) {
          await MarketingModule.sendTemplate(templateId);
        } else if (action === 'delete' && templateId) {
          await MarketingModule.deleteTemplate(templateId);
        }
      } catch (error) {
        console.error('Action failed:', action, error);
        alert('Errore: ' + error.message);
      }
    });
  }

  const MarketingModule = {
    templates: [],
    initialized: false,
    
    async init() {
      if (this.initialized) return true;
      
      console.log('📣 [Marketing] Initializing...');
      ensureStylesOnce();
      
      const storage = window.Storage_Instance;
      if (!storage) {
        console.warn('⚠️ Storage not available');
        return false;
      }
      
      if (!storage.isInitialized) {
        try { 
          await storage.init(); 
        } catch (error) {
          console.warn('⚠️ Storage init failed:', error);
        }
      }
      
      try {
        await storage.refreshTemplates();
      } catch (error) {
        console.warn('⚠️ Failed to refresh templates:', error);
      }
      
      const existing = storage.getTemplates?.() || {};
      
      if (Object.keys(existing).length === 0) {
        console.log('📝 Adding default templates...');
        try {
          for (const key in DEFAULT_TEMPLATES) {
            await saveTemplate(DEFAULT_TEMPLATES[key]);
          }
          await storage.refreshTemplates?.();
        } catch (error) {
          console.error('❌ Failed to add default templates:', error);
        }
      }
      
      this.initialized = true;
      console.log('✅ [Marketing] Initialized successfully');
      return true;
    },
    
    async mount(container) {
      console.log('🎯 [Marketing] Mounting...');
      
      const storage = window.Storage_Instance;
      if (!storage) {
        container.innerHTML = `
          <div class="card">
            <div class="empty-state">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Storage non disponibile</h3>
              <p>Impossibile caricare i template.</p>
            </div>
          </div>
        `;
        return;
      }
      
      const templatesObj = storage.getTemplates?.() || {};
      this.templates = Object.values(templatesObj);
      
      renderTemplates(container, this.templates);
    },
    
    // Funzioni pubbliche per gestione template
    async newTemplate() {
      console.log('Creating new template');
      
      showTemplateEditor(null, async (template) => {
        try {
          await saveTemplate(template);
          await this.refreshTemplates();
        } catch (error) {
          alert('Errore durante il salvataggio: ' + error.message);
        }
      });
    },
    
    async editTemplate(templateId) {
      console.log('Editing template:', templateId);
      
      const template = this.templates.find(t => t.id === templateId || t.key === templateId);
      if (!template) {
        alert('Template non trovato');
        return;
      }
      
      showTemplateEditor(template, async (updatedTemplate) => {
        try {
          await saveTemplate(updatedTemplate);
          await this.refreshTemplates();
        } catch (error) {
          alert('Errore durante l\'aggiornamento: ' + error.message);
        }
      });
    },
    
    async sendTemplate(templateId) {
      console.log('Sending template:', templateId);
      
      const template = this.templates.find(t => t.id === templateId || t.key === templateId);
      if (!template) {
        alert('Template non trovato');
        return;
      }
      
      showSendModal(template, async (selectedMembers) => {
        let sent = 0;
        let failed = 0;
        
        for (const member of selectedMembers) {
          try {
            const phone = member.whatsapp || member.telefono || member.phone;
            const compiledMessage = compileTemplate(template.body, member);
            
            sendWhatsAppMessage(phone, compiledMessage);
            sent++;
            
            // Aggiorna lastReminderSent se è un template di rinnovo
            if (template.category === 'renewal' && window.Storage_Instance) {
              try {
                await window.Storage_Instance.updateMember(member.id, {
                  lastReminderSent: new Date().toISOString()
                });
              } catch (e) {
                console.warn('Failed to update lastReminderSent:', e);
              }
            }
            
            // Piccola pausa tra invii
            if (selectedMembers.length > 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
          } catch (error) {
            console.error('Errore invio a:', member.fullName, error);
            failed++;
          }
        }
        
        alert(`Invio completato!\n\n✅ Inviati: ${sent}\n❌ Falliti: ${failed}`);
        
        // Aggiorna i dati se necessario
        if (sent > 0) {
          await this.refreshTemplates();
        }
      });
    },
    
    async deleteTemplate(templateId) {
      console.log('Deleting template:', templateId);
      
      if (!confirm('Sei sicuro di voler eliminare questo template?')) {
        return;
      }
      
      try {
        await deleteTemplate(templateId);
        await this.refreshTemplates();
      } catch (error) {
        alert('Errore durante l\'eliminazione: ' + error.message);
      }
    },
    
    async refreshTemplates() {
      console.log('Refreshing templates');
      
      const storage = window.Storage_Instance;
      if (storage) {
        try {
          await storage.refreshTemplates();
          const templatesObj = storage.getTemplates?.() || {};
          this.templates = Object.values(templatesObj);
          
          // Re-render se siamo nella pagina marketing
          const container = document.getElementById('page-content');
          if (container && window.App?.state?.currentPage === 'marketing') {
            renderTemplates(container, this.templates);
          }
        } catch (error) {
          console.error('Errore refresh templates:', error);
        }
      }
    }
  };
  
  // Esposizione globale del modulo
  window.MarketingModule = MarketingModule;
  
  console.log('📣 Marketing module loaded and ready');
})();
