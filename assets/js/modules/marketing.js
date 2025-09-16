// assets/js/modules/marketing.js
(function() {
  'use strict';

  // Templates predefiniti
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

  function ensureStylesOnce() {
    if (document.getElementById('marketing-styles')) return;
    const css = `
      .marketing-container {
        display: grid;
        gap: 1.5rem;
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
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .form-group {
        margin-bottom: 1.5rem;
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
      
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
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
      
      .debug-info {
        background: #f1f5f9;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.75rem;
        color: #64748b;
      }
    `;
    const style = document.createElement('style');
    style.id = 'marketing-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function normalizeTemplate(template) {
    // Normalizza i template per gestire sia id che key
    const normalized = {
      id: template.id || template.key,
      key: template.key || template.id,
      name: template.name || 'Template senza nome',
      category: template.category || 'general',
      body: template.body || '',
      variables: template.variables || (template.body ? (template.body.match(/\{[^}]+\}/g) || []) : []),
      updatedAt: template.updatedAt
    };
    
    return normalized;
  }

  function showTemplateEditor(template = null, onSave) {
    const isNew = !template;
    const normalizedTemplate = template ? normalizeTemplate(template) : null;
    
    console.log('📝 Opening template editor:', { isNew, template: normalizedTemplate });
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h3 style="margin-bottom: 1.5rem; color: #1e293b;">${isNew ? 'Nuovo Template' : 'Modifica Template'}</h3>
        
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
        
        <div class="form-group">
          <label class="form-label">Messaggio</label>
          <textarea class="form-textarea" id="template-body" placeholder="Scrivi qui il tuo messaggio...">${normalizedTemplate?.body || ''}</textarea>
          <small style="color: #64748b; margin-top: 0.5rem; display: block;">
            💡 Puoi usare variabili come: {nome}, {giorni}, {scadenza}, {numeroTessera}
          </small>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancel-btn">Annulla</button>
          <button type="button" class="btn btn-primary" id="save-btn">
            <i class="fas fa-save"></i> Salva
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostra modal con animazione
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
    
    const cleanup = () => {
      modal.classList.remove('active');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    };
    
    // Event handlers
    const cancelBtn = modal.querySelector('#cancel-btn');
    const saveBtn = modal.querySelector('#save-btn');
    const nameInput = modal.querySelector('#template-name');
    const categorySelect = modal.querySelector('#template-category');
    const bodyTextarea = modal.querySelector('#template-body');
    
    cancelBtn.addEventListener('click', cleanup);
    
    saveBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const category = categorySelect.value;
      const body = bodyTextarea.value.trim();
      
      if (!name) {
        alert('Il nome del template è obbligatorio');
        nameInput.focus();
        return;
      }
      
      if (!body) {
        alert('Il messaggio del template è obbligatorio');
        bodyTextarea.focus();
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
      
      console.log('💾 Saving template:', updatedTemplate);
      
      // Disabilita pulsante durante il salvataggio
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvataggio...';
      
      try {
        await onSave(updatedTemplate);
        cleanup();
      } catch (error) {
        console.error('❌ Error saving template:', error);
        alert('Errore durante il salvataggio del template');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Salva';
      }
    });
    
    // Chiudi modal cliccando fuori
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
      }
    });
    
    // Focus automatico sul nome se nuovo template
    if (isNew) {
      setTimeout(() => nameInput.focus(), 100);
    }
  }

  async function saveTemplate(template) {
    const storage = window.Storage_Instance;
    if (!storage) {
      console.error('❌ Storage not available');
      throw new Error('Storage non disponibile');
    }
    
    console.log('💾 Attempting to save template:', template);
    
    try {
      // Prova prima il metodo storage
      if (typeof storage.saveTemplate === 'function') {
        await storage.saveTemplate(template.id || template.key, template);
        console.log('✅ Template saved via storage.saveTemplate');
      } 
      // Fallback diretto a Firebase
      else if (storage.firebase?.db) {
        await storage.firebase.db.collection('templates').doc(template.id || template.key).set(template, { merge: true });
        console.log('✅ Template saved via Firebase direct');
      } 
      // Fallback finale
      else {
        throw new Error('Nessun metodo di salvataggio disponibile');
      }
      
      // Refresh templates
      if (typeof storage.refreshTemplates === 'function') {
        await storage.refreshTemplates();
        console.log('✅ Templates refreshed');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error saving template:', error);
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
      
      if (typeof storage.refreshTemplates === 'function') {
        await storage.refreshTemplates();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      throw error;
    }
  }

  function renderTemplates(container, templates) {
    const normalizedTemplates = templates.map(normalizeTemplate);
    
    console.log('🎨 Rendering templates:', normalizedTemplates);
    
    container.innerHTML = `
      <div class="marketing-container">
        <div class="toolbar">
          <h2 style="font-size: 1.5rem; color: #1e293b; margin: 0;">Template Messaggi</h2>
          <button type="button" class="btn btn-primary" id="add-template-btn">
            <i class="fas fa-plus"></i> Nuovo Template
          </button>
        </div>
        
        <div class="debug-info">
          📊 Templates caricati: ${normalizedTemplates.length} | Storage: ${window.Storage_Instance ? '✅' : '❌'}
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
              <div class="template-card" data-template-id="${template.id}">
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
                  <button type="button" class="btn btn-sm btn-secondary edit-template-btn" data-template-id="${template.id}">
                    <i class="fas fa-edit"></i> Modifica
                  </button>
                  <button type="button" class="btn btn-sm btn-primary send-template-btn" data-template-id="${template.id}">
                    <i class="fas fa-paper-plane"></i> Invia
                  </button>
                  <button type="button" class="btn btn-sm" style="background: #ef4444; color: white;" data-template-id="${template.id}" onclick="deleteTemplateHandler('${template.id}')">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
    
    // Event handlers con binding più robusto
    bindTemplateEvents(container, normalizedTemplates);
  }

  function bindTemplateEvents(container, templates) {
    console.log('🔗 Binding template events for', templates.length, 'templates');
    
    // Pulsante nuovo template
    const addBtn = container.querySelector('#add-template-btn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('➕ Creating new template');
        
        showTemplateEditor(null, async (newTemplate) => {
          try {
            await saveTemplate(newTemplate);
            console.log('✅ New template saved, remounting...');
            await MarketingModule.mount(container);
          } catch (error) {
            console.error('❌ Failed to save new template:', error);
            alert('Errore durante il salvataggio: ' + error.message);
          }
        });
      });
    }
    
    // Pulsanti modifica - Event delegation
    container.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.edit-template-btn');
      const sendBtn = e.target.closest('.send-template-btn');
      
      if (editBtn) {
        e.preventDefault();
        const templateId = editBtn.dataset.templateId;
        console.log('✏️ Editing template:', templateId);
        
        const template = templates.find(t => t.id === templateId || t.key === templateId);
        if (!template) {
          console.error('❌ Template not found:', templateId);
          alert('Template non trovato');
          return;
        }
        
        showTemplateEditor(template, async (updatedTemplate) => {
          try {
            await saveTemplate(updatedTemplate);
            console.log('✅ Template updated, remounting...');
            await MarketingModule.mount(container);
          } catch (error) {
            console.error('❌ Failed to update template:', error);
            alert('Errore durante l\'aggiornamento: ' + error.message);
          }
        });
      }
      
      if (sendBtn) {
        e.preventDefault();
        const templateId = sendBtn.dataset.templateId;
        console.log('📤 Send template:', templateId);
        alert('Funzione invio in sviluppo - Template: ' + templateId);
      }
    });
    
    console.log('✅ Events bound successfully');
  }

  // Handler globale per eliminazione (necessario per onclick inline)
  window.deleteTemplateHandler = async function(templateId) {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) {
      return;
    }
    
    try {
      await deleteTemplate(templateId);
      console.log('✅ Template deleted, remounting...');
      const container = document.getElementById('page-content');
      if (container) {
        await MarketingModule.mount(container);
      }
    } catch (error) {
      console.error('❌ Failed to delete template:', error);
      alert('Errore durante l\'eliminazione: ' + error.message);
    }
  };

  const MarketingModule = {
    templates: [],
    initialized: false,
    
    async init() {
      if (this.initialized) return true;
      
      console.log('📣 [Marketing] Initializing...');
      ensureStylesOnce();
      
      if (window.updatePageTitle) {
        window.updatePageTitle('Marketing');
      }
      
      const storage = window.Storage_Instance;
      if (!storage) {
        console.warn('⚠️ Storage not available');
        return false;
      }
      
      // Inizializza storage se necessario
      if (!storage.isInitialized) {
        try { 
          await storage.init(); 
        } catch (error) {
          console.warn('⚠️ Storage init failed:', error);
        }
      }
      
      // Carica templates esistenti
      try {
        await storage.refreshTemplates();
        console.log('✅ Templates refreshed');
      } catch (error) {
        console.warn('⚠️ Failed to refresh templates:', error);
      }
      
      const existing = storage.getTemplates?.() || {};
      console.log('📄 Existing templates:', Object.keys(existing).length);
      
      // Se non ci sono templates, aggiungi quelli di default
      if (Object.keys(existing).length === 0) {
        console.log('📝 Adding default templates...');
        try {
          for (const key in DEFAULT_TEMPLATES) {
            await saveTemplate(DEFAULT_TEMPLATES[key]);
          }
          await storage.refreshTemplates?.();
          console.log('✅ Default templates added');
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
      
      console.log('📊 Templates loaded for rendering:', this.templates.length);
      
      renderTemplates(container, this.templates);
      
      console.log('✅ [Marketing] Mounted successfully');
    }
  };
  
  window.MarketingModule = MarketingModule;
  console.log('📣 Marketing module loaded');
})();
