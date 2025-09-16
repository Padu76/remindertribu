// assets/js/modules/marketing.js
(function() {
  'use strict';

  // Templates predefiniti
  const DEFAULT_TEMPLATES = {
    motivational: {
      id: 'motivational',
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
        cursor: pointer;
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
      
      .form-input, .form-textarea {
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
      }
      
      .form-input:focus, .form-textarea:focus {
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
    `;
    const style = document.createElement('style');
    style.id = 'marketing-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showTemplateEditor(template = null, onSave) {
    const isNew = !template;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h3 style="margin-bottom: 1.5rem;">${isNew ? 'Nuovo Template' : 'Modifica Template'}</h3>
        
        <div class="form-group">
          <label class="form-label">Nome Template</label>
          <input type="text" class="form-input" id="template-name" value="${template?.name || ''}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select class="form-input" id="template-category">
            <option value="motivation" ${template?.category === 'motivation' ? 'selected' : ''}>Motivazione</option>
            <option value="reminder" ${template?.category === 'reminder' ? 'selected' : ''}>Promemoria</option>
            <option value="renewal" ${template?.category === 'renewal' ? 'selected' : ''}>Rinnovo</option>
            <option value="promo" ${template?.category === 'promo' ? 'selected' : ''}>Promozione</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Messaggio</label>
          <textarea class="form-textarea" id="template-body">${template?.body || ''}</textarea>
          <small style="color: #64748b; margin-top: 0.5rem; display: block;">
            Usa {nome}, {giorni}, {scadenza} come variabili
          </small>
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
      const name = modal.querySelector('#template-name').value.trim();
      const category = modal.querySelector('#template-category').value;
      const body = modal.querySelector('#template-body').value.trim();
      
      if (!name || !body) {
        alert('Compila tutti i campi');
        return;
      }
      
      const updatedTemplate = {
        id: template?.id || template?.key || name.toLowerCase().replace(/\s+/g, '_'),
        key: template?.key || template?.id || name.toLowerCase().replace(/\s+/g, '_'),
        name,
        category,
        body,
        variables: (body.match(/\{[^}]+\}/g) || [])
      };
      
      onSave(updatedTemplate);
      cleanup();
    };
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cleanup();
    });
  }

  async function saveTemplate(template) {
    const storage = window.Storage_Instance;
    if (!storage) return false;
    
    try {
      if (typeof storage.saveTemplate === 'function') {
        await storage.saveTemplate(template.id || template.key, template);
      } else if (storage.firebase?.db) {
        await storage.firebase.db.collection('templates').doc(template.id || template.key).set(template, { merge: true });
      }
      await storage.refreshTemplates?.();
      return true;
    } catch (e) {
      console.error('Error saving template:', e);
      return false;
    }
  }

  // FIX PRINCIPALE: Normalizza template per gestire key/id
  function normalizeTemplate(template) {
    if (!template) return null;
    return {
      id: template.id || template.key,
      key: template.key || template.id, 
      name: template.name || 'Template senza nome',
      category: template.category || 'general',
      body: template.body || '',
      variables: template.variables || (template.body ? (template.body.match(/\{[^}]+\}/g) || []) : [])
    };
  }

  function renderTemplates(container, templates) {
    // Normalizza tutti i template
    const normalizedTemplates = templates.map(normalizeTemplate).filter(Boolean);
    
    container.innerHTML = `
      <div class="marketing-container">
        <div class="toolbar">
          <h2 style="font-size: 1.5rem; color: #1e293b;">Template Messaggi</h2>
          <button class="btn btn-primary" id="add-template-btn">
            <i class="fas fa-plus"></i> Nuovo Template
          </button>
        </div>
        
        ${normalizedTemplates.length === 0 ? `
          <div class="card">
            <div class="empty-state">
              <i class="fas fa-envelope"></i>
              <h3>Nessun template disponibile</h3>
              <p>Crea il tuo primo template per iniziare.</p>
            </div>
          </div>
        ` : `
          <div class="template-grid">
            ${normalizedTemplates.map(template => `
              <div class="template-card" data-id="${template.id}">
                <div class="template-header">
                  <div class="template-title">${template.name}</div>
                  <span class="template-category">${template.category || 'general'}</span>
                </div>
                
                <div class="template-body">${template.body}</div>
                
                ${template.variables?.length ? `
                  <div class="template-variables">
                    ${template.variables.map(v => `<span class="variable-tag">${v}</span>`).join('')}
                  </div>
                ` : ''}
                
                <div class="template-actions">
                  <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${template.id}">
                    <i class="fas fa-edit"></i> Modifica
                  </button>
                  <button class="btn btn-sm btn-primary" data-action="send" data-id="${template.id}">
                    <i class="fas fa-paper-plane"></i> Invia
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
    
    // Event handlers - MANTIENE LA LOGICA ORIGINALE
    container.querySelector('#add-template-btn')?.addEventListener('click', () => {
      showTemplateEditor(null, async (template) => {
        if (await saveTemplate(template)) {
          MarketingModule.mount(container);
        }
      });
    });
    
    // Event delegation - IDENTICO AL CODICE ORIGINALE
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      // FIX: Cerca il template sia per id che per key
      const template = normalizedTemplates.find(t => t.id === id || t.key === id);
      
      if (action === 'edit' && template) {
        showTemplateEditor(template, async (updated) => {
          if (await saveTemplate(updated)) {
            MarketingModule.mount(container);
          }
        });
      }
      
      if (action === 'send') {
        alert('Funzione invio in sviluppo');
      }
    });
  }

  const MarketingModule = {
    templates: [],
    
    async init() {
      console.log('📣 [Marketing] init');
      ensureStylesOnce();
      
      if (window.updatePageTitle) {
        window.updatePageTitle('Marketing');
      }
      
      const storage = window.Storage_Instance;
      if (!storage) return false;
      
      if (!storage.isInitialized) {
        try { await storage.init(); } catch {}
      }
      
      // Carica templates esistenti
      try {
        await storage.refreshTemplates();
      } catch {}
      
      const existing = storage.getTemplates?.() || {};
      
      // Se non ci sono templates, aggiungi quelli di default
      if (Object.keys(existing).length === 0) {
        console.log('Adding default templates...');
        for (const key in DEFAULT_TEMPLATES) {
          await saveTemplate(DEFAULT_TEMPLATES[key]);
        }
        await storage.refreshTemplates?.();
      }
      
      return true;
    },
    
    async mount(container) {
      const storage = window.Storage_Instance;
      if (!storage) {
        container.innerHTML = '<div class="card">Storage non disponibile</div>';
        return;
      }
      
      const templatesObj = storage.getTemplates?.() || {};
      this.templates = Object.values(templatesObj);
      
      renderTemplates(container, this.templates);
    }
  };
  
  window.MarketingModule = MarketingModule;
})();
