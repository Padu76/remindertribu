/**
 * WhatsApp Module - Real API Integration
 * Connects to RemindPro WhatsApp API on Render
 */

class WhatsAppModule {
    constructor() {
        this.apiBaseUrl = 'https://remindpro-enterprise-template.onrender.com/api';
        this.connectionStatus = 'disconnected';
        this.qrCode = null;
        this.messageQueue = [];
        this.isInitialized = false;
        this.automationRules = [];
        this.pollInterval = null;
    }
    
    async init() {
        try {
            console.log('📱 Initializing WhatsApp module with real API...');
            this.loadSavedSettings();
            this.loadMessageQueue();
            this.loadAutomationRules();
            
            // Check initial API connection
            await this.checkApiHealth();
            
            this.isInitialized = true;
            console.log('✅ WhatsApp module initialized with real API');
        } catch (error) {
            console.error('❌ WhatsApp module initialization failed:', error);
        }
    }
    
    async checkApiHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            
            if (data.status === 'ok') {
                console.log('✅ WhatsApp API is healthy');
                this.connectionStatus = data.whatsapp.ready ? 'connected' : 'disconnected';
                return true;
            }
        } catch (error) {
            console.error('❌ API health check failed:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.warning('API WhatsApp non raggiungibile, usando modalità offline');
            }
        }
        return false;
    }
    
    loadSavedSettings() {
        const status = JSON.parse(localStorage.getItem('remindpro_whatsapp_status') || '{}');
        // Don't rely on localStorage for real API, always check server status
    }
    
    loadMessageQueue() {
        this.messageQueue = JSON.parse(localStorage.getItem('remindpro_whatsapp_queue') || '[]');
    }
    
    loadAutomationRules() {
        this.automationRules = JSON.parse(localStorage.getItem('remindpro_automation_rules') || '[]');
    }
    
    async connectWhatsApp() {
        try {
            if (window.App) {
                window.App.showLoading && window.App.showLoading('Connessione a WhatsApp...');
            }
            
            // Get QR code from real API
            const response = await fetch(`${this.apiBaseUrl}/whatsapp/qr`);
            const data = await response.json();
            
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            if (data.success && data.qrCode) {
                this.qrCode = data.qrCode;
                this.showQRCodeModal(data.qrCode, true); // true = real QR
                this.startStatusPolling(); // Poll for connection status
            } else if (data.connected) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.success('WhatsApp già connesso!');
                }
                this.connectionStatus = 'connected';
                this.refreshConnectionStatus();
            } else {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.warning(data.message || 'QR Code non disponibile');
                }
                
                if (data.needsRestart) {
                    this.showRestartOption();
                }
            }
            
        } catch (error) {
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            console.error('WhatsApp connection failed:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore nella connessione WhatsApp: ' + error.message);
            }
        }
    }
    
    showRestartOption() {
        if (confirm('Il servizio WhatsApp deve essere riavviato. Procedere?')) {
            this.restartWhatsAppService();
        }
    }
    
    async restartWhatsAppService() {
        try {
            if (window.App) {
                window.App.showLoading && window.App.showLoading('Riavvio servizio WhatsApp...');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/whatsapp/restart`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            if (data.success) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.success('Servizio riavviato. Riprova la connessione in 30 secondi.');
                }
                
                // Auto-retry connection after 30 seconds
                setTimeout(() => {
                    this.connectWhatsApp();
                }, 30000);
            } else {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.error('Errore nel riavvio del servizio');
                }
            }
            
        } catch (error) {
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            console.error('Restart service failed:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore nel riavvio del servizio');
            }
        }
    }
    
    startStatusPolling() {
        // Poll connection status every 5 seconds while waiting for connection
        this.pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/whatsapp/status`);
                const data = await response.json();
                
                if (data.connected) {
                    console.log('✅ WhatsApp connected!');
                    this.connectionStatus = 'connected';
                    
                    if (window.App?.modules?.modal) {
                        window.App.modules.modal.hide();
                    }
                    
                    if (window.App?.modules?.toast) {
                        window.App.modules.toast.success('WhatsApp connesso con successo!');
                    }
                    
                    this.stopStatusPolling();
                    this.refreshConnectionStatus();
                }
            } catch (error) {
                console.error('Status polling error:', error);
            }
        }, 5000);
        
        // Stop polling after 5 minutes
        setTimeout(() => {
            this.stopStatusPolling();
        }, 300000);
    }
    
    stopStatusPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    showQRCodeModal(qrCode, isReal = false) {
        if (!window.App?.modules?.modal) return;
        
        const modalContent = `
            <div class="modal-header">
                <h2 class="modal-title">
                    <i class="fab fa-whatsapp"></i> Connetti WhatsApp ${isReal ? 'REALE' : 'Demo'}
                </h2>
            </div>
            <div class="modal-body" style="text-align: center;">
                <div class="qr-code-container" style="background: white; padding: 2rem; border-radius: 15px; display: inline-block; margin: 1rem 0;">
                    ${isReal ? 
                        `<img src="${qrCode}" alt="QR Code WhatsApp" style="width: 200px; height: 200px; border: 2px solid #25d366;">` :
                        `<div class="qr-code-placeholder" style="width: 200px; height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 2px dashed #ccc; font-size: 3rem; color: #999;">
                            <i class="fas fa-qrcode"></i>
                        </div>`
                    }
                </div>
                <div class="connection-steps">
                    <h4 style="color: var(--dark); margin-bottom: 1rem;">Come Connettere:</h4>
                    <ol style="text-align: left; color: var(--dark); line-height: 1.6;">
                        <li>Apri WhatsApp sul tuo telefono</li>
                        <li>Vai su Menu (⋮) > WhatsApp Web</li>
                        <li>Inquadra questo QR code con la fotocamera</li>
                        <li>Attendi la connessione automatica</li>
                    </ol>
                </div>
                ${isReal ? `
                    <div class="connection-status" style="margin-top: 1.5rem;">
                        <div class="status-indicator">
                            <i class="fas fa-circle" style="color: orange; animation: pulse 2s infinite;"></i>
                            <span style="margin-left: 0.5rem; color: var(--dark);">In attesa di scansione...</span>
                        </div>
                        <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
                            La connessione verrà rilevata automaticamente
                        </p>
                    </div>
                ` : `
                    <div class="connection-status" style="margin-top: 1.5rem;">
                        <button class="btn btn-success" onclick="window.App.modules.whatsapp.simulateConnection()">
                            <i class="fas fa-check"></i> Simula Connessione (Demo)
                        </button>
                    </div>
                `}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="window.App.modules.whatsapp.stopStatusPolling(); window.App.modules.modal.hide()">
                    <i class="fas fa-times"></i> Annulla
                </button>
                ${isReal ? `
                    <button type="button" class="btn btn-warning" onclick="window.App.modules.whatsapp.restartWhatsAppService()">
                        <i class="fas fa-redo"></i> Riavvia Servizio
                    </button>
                ` : ''}
            </div>
        `;
        
        window.App.modules.modal.show(modalContent);
    }
    
    simulateConnection() {
        // Keep for demo fallback
        this.connectionStatus = 'connected';
        
        const status = {
            connected: true,
            timestamp: Date.now(),
            deviceName: 'Demo Device',
            mode: 'simulation'
        };
        localStorage.setItem('remindpro_whatsapp_status', JSON.stringify(status));
        
        if (window.App?.modules?.modal) {
            window.App.modules.modal.hide();
        }
        
        if (window.App?.modules?.toast) {
            window.App.modules.toast.success('WhatsApp connesso (modalità demo)!');
        }
        
        this.refreshConnectionStatus();
    }
    
    async disconnectWhatsApp() {
        if (!confirm('Sei sicuro di voler disconnettere WhatsApp?')) {
            return;
        }
        
        try {
            // Try to disconnect from real API
            const response = await fetch(`${this.apiBaseUrl}/whatsapp/disconnect`, {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log('✅ Disconnected from real API');
            }
        } catch (error) {
            console.error('API disconnect failed:', error);
        }
        
        this.connectionStatus = 'disconnected';
        this.stopStatusPolling();
        
        localStorage.removeItem('remindpro_whatsapp_status');
        
        if (window.App?.modules?.toast) {
            window.App.modules.toast.info('WhatsApp disconnesso');
        }
        
        this.refreshConnectionStatus();
    }
    
    refreshConnectionStatus() {
        const statusEl = document.getElementById('whatsappStatus');
        const actionEl = document.getElementById('whatsappAction');
        
        if (statusEl) {
            if (this.connectionStatus === 'connected') {
                statusEl.innerHTML = '<span class="badge badge-success"><i class="fab fa-whatsapp"></i> Connesso</span>';
            } else {
                statusEl.innerHTML = '<span class="badge badge-danger"><i class="fas fa-times"></i> Disconnesso</span>';
            }
        }
        
        if (actionEl) {
            if (this.connectionStatus === 'connected') {
                actionEl.innerHTML = `
                    <button class="btn btn-danger" onclick="window.App.modules.whatsapp.disconnectWhatsApp()">
                        <i class="fas fa-unlink"></i> Disconnetti
                    </button>
                `;
            } else {
                actionEl.innerHTML = `
                    <button class="btn btn-success" onclick="window.App.modules.whatsapp.connectWhatsApp()">
                        <i class="fab fa-whatsapp"></i> Connetti WhatsApp REALE
                    </button>
                `;
            }
        }
        
        this.updateAutomationSection();
    }
    
    updateAutomationSection() {
        const automationEl = document.getElementById('automationSection');
        if (!automationEl) return;
        
        if (this.connectionStatus === 'connected') {
            automationEl.style.display = 'block';
        } else {
            automationEl.style.display = 'none';
        }
    }
    
    async sendBulkMessage() {
        if (this.connectionStatus !== 'connected') {
            if (window.App?.modules?.toast) {
                window.App.modules.toast.warning('Connetti prima WhatsApp per inviare messaggi');
            }
            return;
        }
        
        if (window.App?.modules?.modal) {
            const modalContent = `
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-bullhorn"></i> Invio Messaggio di Massa REALE
                    </h2>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <strong>Modalità REALE:</strong> I messaggi verranno inviati tramite WhatsApp vero!
                    </div>
                    <form id="bulkMessageForm">
                        <div class="form-group">
                            <label for="messageText">Messaggio *</label>
                            <textarea id="messageText" class="form-control" rows="4" placeholder="Ciao {nome}, volevo condividere con te..." required></textarea>
                            <small class="form-help">Usa {nome} per personalizzare il messaggio</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="targetContacts">Destinatari</label>
                            <select id="targetContacts" class="form-control">
                                <option value="all">Tutti i contatti (4)</option>
                                <option value="tagged">Solo contatti con tag specifico</option>
                                <option value="active">Solo contatti attivi</option>
                            </select>
                        </div>
                        
                        <div class="form-group" id="tagFilterGroup" style="display: none;">
                            <label for="filterTag">Tag Specifico</label>
                            <input type="text" id="filterTag" class="form-control" placeholder="cliente, vip, roma...">
                        </div>
                        
                        <div class="form-group">
                            <label for="sendDelay">Ritardo tra Messaggi</label>
                            <select id="sendDelay" class="form-control">
                                <option value="5">5 secondi (consigliato)</option>
                                <option value="10">10 secondi</option>
                                <option value="30">30 secondi</option>
                                <option value="60">1 minuto</option>
                            </select>
                            <small class="form-help">Ritardo per evitare il blocco di WhatsApp</small>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.App.modules.modal.hide()">
                        <i class="fas fa-times"></i> Annulla
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.App.modules.whatsapp.processBulkMessage()">
                        <i class="fas fa-paper-plane"></i> Invia Messaggi REALI
                    </button>
                </div>
            `;
            
            window.App.modules.modal.show(modalContent);
            
            // Add event listener for target contacts change
            setTimeout(() => {
                const targetSelect = document.getElementById('targetContacts');
                const tagGroup = document.getElementById('tagFilterGroup');
                if (targetSelect && tagGroup) {
                    targetSelect.addEventListener('change', function() {
                        tagGroup.style.display = this.value === 'tagged' ? 'block' : 'none';
                    });
                }
            }, 100);
        }
    }
    
    async processBulkMessage() {
        try {
            const messageText = document.getElementById('messageText').value;
            const targetContacts = document.getElementById('targetContacts').value;
            const filterTag = document.getElementById('filterTag').value;
            const sendDelay = parseInt(document.getElementById('sendDelay').value);
            
            if (!messageText.trim()) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.error('Inserisci il messaggio da inviare');
                }
                return;
            }
            
            const storage = window.App?.modules?.storage;
            if (!storage) {
                throw new Error('Storage module not available');
            }
            
            let contacts = storage.getContacts();
            
            // Filter contacts based on selection
            switch (targetContacts) {
                case 'tagged':
                    if (!filterTag.trim()) {
                        if (window.App?.modules?.toast) {
                            window.App.modules.toast.error('Specifica il tag per filtrare i contatti');
                        }
                        return;
                    }
                    contacts = contacts.filter(c => 
                        c.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()))
                    );
                    break;
                case 'active':
                    contacts = contacts.filter(c => c.status === 'active');
                    break;
                case 'all':
                default:
                    break;
            }
            
            if (contacts.length === 0) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.warning('Nessun contatto corrisponde ai criteri selezionati');
                }
                return;
            }
            
            if (!confirm(`⚠️ ATTENZIONE: Stai per inviare messaggi WhatsApp REALI a ${contacts.length} contatti. Procedere?`)) {
                return;
            }
            
            if (window.App?.modules?.modal) {
                window.App.modules.modal.hide();
            }
            
            if (window.App) {
                window.App.showLoading && window.App.showLoading(`Invio messaggi REALI (0/${contacts.length})...`);
            }
            
            // Send to real API
            const response = await fetch(`${this.apiBaseUrl}/whatsapp/send-bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contacts: contacts,
                    message: messageText,
                    delay: sendDelay
                })
            });
            
            const result = await response.json();
            
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            if (result.success) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.success(
                        `✅ ${result.summary.success} messaggi inviati con successo! ${result.summary.failed > 0 ? `${result.summary.failed} falliti.` : ''}`
                    );
                }
                
                // Save results to local queue for tracking
                this.messageQueue.push(...result.results.filter(r => r.success));
                localStorage.setItem('remindpro_whatsapp_queue', JSON.stringify(this.messageQueue));
                this.updateMessageQueue();
            } else {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.error('Errore nell\'invio: ' + result.message);
                }
            }
            
        } catch (error) {
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            console.error('Bulk message failed:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore nella connessione API: ' + error.message);
            }
        }
    }
    
    async sendDirectMessage(contactId) {
        try {
            const storage = window.App?.modules?.storage;
            if (!storage) {
                throw new Error('Storage module not available');
            }
            
            const contact = storage.getContacts().find(c => c.id === contactId);
            if (!contact) {
                throw new Error('Contatto non trovato');
            }
            
            const message = prompt(`Invia messaggio REALE a ${contact.name}:`, 'Ciao! Come stai?');
            if (!message) return;
            
            if (this.connectionStatus !== 'connected') {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.warning('Connetti WhatsApp per inviare messaggi reali');
                }
                return;
            }
            
            if (window.App) {
                window.App.showLoading && window.App.showLoading('Invio messaggio...');
            }
            
            // Send to real API
            const response = await fetch(`${this.apiBaseUrl}/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: contact.phone,
                    message: message,
                    contactName: contact.name
                })
            });
            
            const result = await response.json();
            
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            if (result.success) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.success(`✅ Messaggio REALE inviato a ${contact.name}!`);
                }
            } else {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.error('Errore invio: ' + result.message);
                }
            }
            
        } catch (error) {
            if (window.App) {
                window.App.hideLoading && window.App.hideLoading();
            }
            
            console.error('Failed to send direct message:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore nella connessione API');
            }
        }
    }
    
    // Keep existing automation methods (unchanged)
    createAutomationRule() {
        if (window.App?.modules?.modal) {
            const modalContent = `
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-robot"></i> Nuova Automazione
                    </h2>
                </div>
                <div class="modal-body">
                    <form id="automationForm">
                        <div class="form-group">
                            <label for="ruleName">Nome Regola *</label>
                            <input type="text" id="ruleName" class="form-control" placeholder="Benvenuto nuovi clienti" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="triggerType">Trigger</label>
                            <select id="triggerType" class="form-control">
                                <option value="new_contact">Nuovo contatto aggiunto</option>
                                <option value="tag_added">Tag specifico aggiunto</option>
                                <option value="time_based">Basato su tempo</option>
                                <option value="keyword">Parola chiave ricevuta</option>
                            </select>
                        </div>
                        
                        <div class="form-group" id="triggerValue" style="display: none;">
                            <label for="triggerValueInput">Valore Trigger</label>
                            <input type="text" id="triggerValueInput" class="form-control" placeholder="cliente, benvenuto...">
                        </div>
                        
                        <div class="form-group">
                            <label for="automationMessage">Messaggio Automatico *</label>
                            <textarea id="automationMessage" class="form-control" rows="3" placeholder="Ciao {nome}, benvenuto in RemindPro!" required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="automationDelay">Ritardo Invio</label>
                            <select id="automationDelay" class="form-control">
                                <option value="0">Immediato</option>
                                <option value="300">5 minuti</option>
                                <option value="3600">1 ora</option>
                                <option value="86400">1 giorno</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.App.modules.modal.hide()">
                        <i class="fas fa-times"></i> Annulla
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.App.modules.whatsapp.saveAutomationRule()">
                        <i class="fas fa-save"></i> Salva Regola
                    </button>
                </div>
            `;
            
            window.App.modules.modal.show(modalContent);
            
            setTimeout(() => {
                const triggerSelect = document.getElementById('triggerType');
                const triggerValueDiv = document.getElementById('triggerValue');
                if (triggerSelect && triggerValueDiv) {
                    triggerSelect.addEventListener('change', function() {
                        const needsValue = ['tag_added', 'keyword'].includes(this.value);
                        triggerValueDiv.style.display = needsValue ? 'block' : 'none';
                    });
                }
            }, 100);
        }
    }
    
    saveAutomationRule() {
        try {
            const ruleName = document.getElementById('ruleName').value;
            const triggerType = document.getElementById('triggerType').value;
            const triggerValue = document.getElementById('triggerValueInput').value;
            const message = document.getElementById('automationMessage').value;
            const delay = parseInt(document.getElementById('automationDelay').value);
            
            if (!ruleName.trim() || !message.trim()) {
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.error('Nome regola e messaggio sono obbligatori');
                }
                return;
            }
            
            const rule = {
                id: 'rule_' + Date.now(),
                name: ruleName,
                trigger: {
                    type: triggerType,
                    value: triggerValue
                },
                message: message,
                delay: delay,
                active: true,
                created: new Date().toISOString()
            };
            
            this.automationRules.push(rule);
            localStorage.setItem('remindpro_automation_rules', JSON.stringify(this.automationRules));
            
            if (window.App?.modules?.modal) {
                window.App.modules.modal.hide();
            }
            
            if (window.App?.modules?.toast) {
                window.App.modules.toast.success('Regola di automazione salvata!');
            }
            
            this.updateAutomationList();
            
        } catch (error) {
            console.error('Error saving automation rule:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore nel salvataggio della regola');
            }
        }
    }
    
    updateAutomationList() {
        const listEl = document.getElementById('automationRulesList');
        if (!listEl) return;
        
        if (this.automationRules.length === 0) {
            listEl.innerHTML = `
                <div class="automation-empty">
                    <div class="automation-empty-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <p>Nessuna regola di automazione configurata</p>
                    <button class="btn btn-primary" onclick="window.App.modules.whatsapp.createAutomationRule()">
                        <i class="fas fa-plus"></i> Crea la prima regola
                    </button>
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = this.automationRules.map(rule => `
            <div class="automation-rule-card">
                <div class="automation-rule-header">
                    <div class="automation-rule-title">
                        <strong>${rule.name}</strong>
                        <span class="badge badge-${rule.active ? 'success' : 'warning'}">
                            ${rule.active ? 'Attiva' : 'Disattivata'}
                        </span>
                    </div>
                    <div class="automation-rule-actions">
                        <button class="btn-icon btn-toggle" onclick="window.App.modules.whatsapp.toggleAutomationRule('${rule.id}')" title="${rule.active ? 'Disattiva' : 'Attiva'}">
                            <i class="fas fa-${rule.active ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="window.App.modules.whatsapp.deleteAutomationRule('${rule.id}')" title="Elimina">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="automation-rule-details">
                    <p><strong>Trigger:</strong> ${this.getTriggerDescription(rule.trigger)}</p>
                    <p><strong>Messaggio:</strong> ${rule.message.substring(0, 100)}${rule.message.length > 100 ? '...' : ''}</p>
                    <p><strong>Ritardo:</strong> ${this.getDelayDescription(rule.delay)}</p>
                </div>
            </div>
        `).join('');
    }
    
    getTriggerDescription(trigger) {
        const descriptions = {
            'new_contact': 'Nuovo contatto aggiunto',
            'tag_added': `Tag "${trigger.value}" aggiunto`,
            'time_based': 'Basato su tempo',
            'keyword': `Parola chiave "${trigger.value}" ricevuta`
        };
        return descriptions[trigger.type] || trigger.type;
    }
    
    getDelayDescription(delay) {
        if (delay === 0) return 'Immediato';
        if (delay < 3600) return `${delay / 60} minuti`;
        if (delay < 86400) return `${delay / 3600} ore`;
        return `${delay / 86400} giorni`;
    }
    
    toggleAutomationRule(ruleId) {
        const rule = this.automationRules.find(r => r.id === ruleId);
        if (rule) {
            rule.active = !rule.active;
            localStorage.setItem('remindpro_automation_rules', JSON.stringify(this.automationRules));
            this.updateAutomationList();
            
            if (window.App?.modules?.toast) {
                window.App.modules.toast.info(`Regola ${rule.active ? 'attivata' : 'disattivata'}`);
            }
        }
    }
    
    deleteAutomationRule(ruleId) {
        if (!confirm('Sei sicuro di voler eliminare questa regola?')) {
            return;
        }
        
        this.automationRules = this.automationRules.filter(r => r.id !== ruleId);
        localStorage.setItem('remindpro_automation_rules', JSON.stringify(this.automationRules));
        this.updateAutomationList();
        
        if (window.App?.modules?.toast) {
            window.App.modules.toast.success('Regola eliminata');
        }
    }
    
    updateMessageQueue() {
        const queueEl = document.getElementById('messageQueueList');
        if (!queueEl) return;
        
        const recentMessages = this.messageQueue.slice(-10);
        
        if (recentMessages.length === 0) {
            queueEl.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 2rem;">Nessun messaggio inviato recentemente</p>';
            return;
        }
        
        queueEl.innerHTML = recentMessages.map(msg => `
            <div class="message-queue-item">
                <div class="message-info">
                    <strong>${msg.contactName || msg.contact || 'Contatto'}</strong>
                    <span class="message-phone">${msg.phone || msg.to}</span>
                </div>
                <div class="message-preview">
                    ${msg.message ? msg.message.substring(0, 50) + (msg.message.length > 50 ? '...' : '') : 'Messaggio inviato'}
                </div>
                <div class="message-status">
                    <span class="badge badge-success">
                        ${msg.mode === 'real' ? 'Inviato REALE' : 'Simulato'}
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    clearMessageQueue() {
        if (!confirm('Sei sicuro di voler cancellare lo storico messaggi?')) {
            return;
        }
        
        this.messageQueue = [];
        localStorage.removeItem('remindpro_whatsapp_queue');
        this.updateMessageQueue();
        
        if (window.App?.modules?.toast) {
            window.App.modules.toast.success('Storico messaggi cancellato');
        }
    }
    
    getPageContent() {
        const isConnected = this.connectionStatus === 'connected';
        
        return `
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fab fa-whatsapp"></i> 
                    WhatsApp Business REALE
                </h1>
                <p class="page-subtitle">Integrazione WhatsApp API reale con invio messaggi veri</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <div>
                        <h3><i class="fab fa-whatsapp"></i> Stato Connessione API</h3>
                        <div id="whatsappStatus">
                            ${isConnected 
                                ? '<span class="badge badge-success"><i class="fab fa-whatsapp"></i> Connesso</span>'
                                : '<span class="badge badge-danger"><i class="fas fa-times"></i> Disconnesso</span>'
                            }
                        </div>
                    </div>
                    <div id="whatsappAction">
                        ${isConnected 
                            ? '<button class="btn btn-danger" onclick="window.App.modules.whatsapp.disconnectWhatsApp()"><i class="fas fa-unlink"></i> Disconnetti</button>'
                            : '<button class="btn btn-success" onclick="window.App.modules.whatsapp.connectWhatsApp()"><i class="fab fa-whatsapp"></i> Connetti WhatsApp REALE</button>'
                        }
                    </div>
                </div>
                
                <div class="alert alert-info">
                    <div class="alert-icon"><i class="fas fa-rocket"></i></div>
                    <div class="alert-content">
                        <div class="alert-title">API WhatsApp REALE Attivata!</div>
                        <div class="alert-message">
                            Questa è la versione completa con API backend su Render. 
                            I messaggi vengono inviati tramite WhatsApp Web reale.
                            <br><strong>URL API:</strong> https://remindpro-enterprise-template.onrender.com
                        </div>
                    </div>
                </div>
                
                ${!isConnected ? `
                    <div class="alert alert-warning">
                        <div class="alert-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="alert-content">
                            <div class="alert-title">WhatsApp Non Connesso</div>
                            <div class="alert-message">
                                Per utilizzare le funzionalità di invio messaggi REALI, 
                                devi prima connettere il tuo account WhatsApp scansionando il QR Code.
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="alert alert-success">
                        <div class="alert-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="alert-content">
                            <div class="alert-title">WhatsApp Connesso e Operativo</div>
                            <div class="alert-message">
                                Il tuo account WhatsApp è connesso all'API e pronto per inviare messaggi reali.
                                <strong>⚠️ Attenzione:</strong> I messaggi vengono inviati realmente!
                            </div>
                        </div>
                    </div>
                `}
            </div>

            <div class="card" id="automationSection" style="display: ${isConnected ? 'block' : 'none'};">
                <div class="card-header">
                    <h3><i class="fas fa-paper-plane"></i> Invio Messaggi REALI</h3>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="window.App.modules.whatsapp.sendBulkMessage()">
                            <i class="fas fa-bullhorn"></i> Messaggio di Massa REALE
                        </button>
                    </div>
                </div>
                
                <div class="messaging-options">
                    <div class="option-card">
                        <div class="option-icon">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                        <div class="option-content">
                            <h4>Messaggi di Massa REALI</h4>
                            <p>Invia messaggi WhatsApp veri a più contatti contemporaneamente</p>
                            <button class="btn btn-outline-primary" onclick="window.App.modules.whatsapp.sendBulkMessage()">
                                <i class="fas fa-arrow-right"></i> Inizia Invio
                            </button>
                        </div>
                    </div>
                    
                    <div class="option-card">
                        <div class="option-icon">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="option-content">
                            <h4>Messaggio Singolo REALE</h4>
                            <p>Vai alla pagina contatti per inviare messaggi diretti WhatsApp reali</p>
                            <button class="btn btn-outline-primary" onclick="window.App.loadPage('contacts')">
                                <i class="fas fa-arrow-right"></i> Vai ai Contatti
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" id="automationRulesSection" style="display: ${isConnected ? 'block' : 'none'};">
                <div class="card-header">
                    <h3><i class="fas fa-robot"></i> Automazioni</h3>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="window.App.modules.whatsapp.createAutomationRule()">
                            <i class="fas fa-plus"></i> Nuova Automazione
                        </button>
                    </div>
                </div>
                
                <div id="automationRulesList">
                    <!-- Automation rules will be loaded here -->
                </div>
            </div>

            <div class="card" id="messageQueueSection" style="display: ${isConnected ? 'block' : 'none'};">
                <div class="card-header">
                    <h3><i class="fas fa-clock"></i> Storico Messaggi</h3>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="window.App.modules.whatsapp.clearMessageQueue()">
                            <i class="fas fa-trash"></i> Cancella Storico
                        </button>
                    </div>
                </div>
                
                <div id="messageQueueList">
                    <!-- Message queue will be loaded here -->
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-info-circle"></i> Informazioni API WhatsApp</h3>
                </div>
                
                <div class="guide-content">
                    <div class="alert alert-info">
                        <div class="alert-icon"><i class="fas fa-server"></i></div>
                        <div class="alert-content">
                            <div class="alert-title">Dettagli Tecnici</div>
                            <div class="alert-message">
                                <strong>🖥️ Backend:</strong> Node.js + Express + whatsapp-web.js<br>
                                <strong>🌐 Hosting:</strong> Render.com (Free tier)<br>
                                <strong>📱 Metodo:</strong> WhatsApp Web API (Puppeteer + Chromium)<br>
                                <strong>🔒 Sicurezza:</strong> CORS, Rate limiting, Helmet<br>
                                <strong>⚡ Endpoints:</strong> health, qr, status, send, send-bulk, restart
                            </div>
                        </div>
                    </div>
                    
                    <div class="alert alert-warning">
                        <div class="alert-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="alert-content">
                            <div class="alert-title">Limitazioni e Consigli</div>
                            <div class="alert-message">
                                <strong>⏰ Timeout:</strong> Mantieni WhatsApp Web sempre aperto<br>
                                <strong>🚫 Rate Limits:</strong> Max 100 richieste/15min per IP<br>
                                <strong>⚡ Ritardi:</strong> Usa ritardi tra messaggi (5-60 sec)<br>
                                <strong>🔄 Riconnessioni:</strong> Il QR code scade dopo alcuni minuti<br>
                                <strong>💾 Persistenza:</strong> La sessione si salva automaticamente
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async initializePage() {
        this.loadSavedSettings();
        this.refreshConnectionStatus();
        this.updateAutomationList();
        this.updateMessageQueue();
        
        // Check real API status on page load
        setTimeout(() => {
            this.checkApiHealth();
        }, 1000);
    }
}

window.WhatsAppModule = WhatsAppModule;