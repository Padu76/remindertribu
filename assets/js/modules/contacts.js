/**
 * Contacts Module - Complete Implementation
 * Handles contact management, import/export, and segmentation
 */

class ContactsModule {
    constructor() {
        this.contacts = [];
        this.isInitialized = false;
    }
    
    async init() {
        try {
            console.log('👥 Initializing Contacts module...');
            this.isInitialized = true;
            console.log('✅ Contacts module initialized');
        } catch (error) {
            console.error('❌ Contacts module initialization failed:', error);
        }
    }
    
    async addContact(contactData) {
        try {
            if (!window.App?.modules?.storage) {
                throw new Error('Storage module not available');
            }
            
            // Validate contact data
            if (!contactData.name || !contactData.phone) {
                throw new Error('Nome e telefono sono obbligatori');
            }
            
            // Validate phone number
            if (!this.isValidPhone(contactData.phone)) {
                throw new Error('Numero di telefono non valido');
            }
            
            const contact = await window.App.modules.storage.addContact(contactData);
            
            if (window.App?.modules?.toast) {
                window.App.modules.toast.success('Contatto aggiunto con successo!');
            }
            
            // Update UI
            this.refreshContactsList();
            
            return contact;
            
        } catch (error) {
            console.error('Failed to add contact:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error(error.message || 'Errore nell\'aggiunta del contatto');
            }
            throw error;
        }
    }
    
    isValidPhone(phone) {
        // Simple phone validation - can be enhanced
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanPhone) && cleanPhone.length >= 8;
    }
    
    async deleteContact(contactId) {
        try {
            if (!confirm('Sei sicuro di voler eliminare questo contatto?')) {
                return;
            }
            
            const storage = window.App?.modules?.storage;
            if (!storage) {
                throw new Error('Storage module not available');
            }
            
            await storage.deleteContact(contactId);
            
            if (window.App?.modules?.toast) {
                window.App.modules.toast.success('Contatto eliminato');
            }
            
            this.refreshContactsList();
            
        } catch (error) {
            console.error('Failed to delete contact:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore nell\'eliminazione del contatto');
            }
        }
    }
    
    sendDirectMessage(contactId) {
        try {
            const storage = window.App?.modules?.storage;
            if (!storage) {
                throw new Error('Storage module not available');
            }
            
            const contact = storage.getContacts().find(c => c.id === contactId);
            if (!contact) {
                throw new Error('Contatto non trovato');
            }
            
            const message = prompt(`Invia messaggio a ${contact.name}:`, 'Ciao! Come stai?');
            if (message) {
                const commands = [{
                    type: 'send_message',
                    phone: contact.phone,
                    message: message,
                    contactName: contact.name
                }];
                
                localStorage.setItem('remindpro_whatsapp_commands', JSON.stringify(commands));
                
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.success(`Messaggio inviato a ${contact.name}!`);
                }
            }
            
        } catch (error) {
            console.error('Failed to send direct message:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore nell\'invio del messaggio');
            }
        }
    }
    
    importContacts() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                if (window.App) {
                    window.App.showLoading && window.App.showLoading('Importazione contatti...');
                }
                
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const csv = e.target.result;
                    const lines = csv.split('\n');
                    let imported = 0;
                    let errors = 0;
                    
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',');
                        if (values.length >= 2 && values[0].trim() && values[1].trim()) {
                            try {
                                const contactData = {
                                    name: values[0].trim().replace(/"/g, ''),
                                    phone: values[1].trim().replace(/"/g, ''),
                                    email: values[2] ? values[2].trim().replace(/"/g, '') : '',
                                    tags: values[3] ? values[3].trim().replace(/"/g, '').split(';').map(t => t.trim()) : []
                                };
                                
                                await this.addContact(contactData);
                                imported++;
                            } catch (error) {
                                console.error('Error importing contact:', error);
                                errors++;
                            }
                        }
                    }
                    
                    if (window.App) {
                        window.App.hideLoading && window.App.hideLoading();
                    }
                    
                    if (window.App?.modules?.toast) {
                        if (imported > 0) {
                            window.App.modules.toast.success(`${imported} contatti importati con successo!`);
                        }
                        if (errors > 0) {
                            window.App.modules.toast.warning(`${errors} contatti non sono stati importati (dati non validi)`);
                        }
                    }
                    
                    this.refreshContactsList();
                };
                reader.readAsText(file);
                
            } catch (error) {
                if (window.App) {
                    window.App.hideLoading && window.App.hideLoading();
                }
                
                console.error('Import failed:', error);
                if (window.App?.modules?.toast) {
                    window.App.modules.toast.error('Errore durante l\'importazione');
                }
            }
        };
        input.click();
    }
    
    exportContacts() {
        try {
            const storage = window.App?.modules?.storage;
            if (!storage) {
                throw new Error('Storage module not available');
            }
            
            const contacts = storage.getContacts();
            
            const csv = [
                'Nome,Telefono,Email,Tag',
                ...contacts.map(c => `"${c.name}","${c.phone}","${c.email || ''}","${c.tags.join(';')}"`)
            ].join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contatti_remindpro_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            if (window.App?.modules?.toast) {
                window.App.modules.toast.success('Lista contatti esportata!');
            }
            
        } catch (error) {
            console.error('Export failed:', error);
            if (window.App?.modules?.toast) {
                window.App.modules.toast.error('Errore durante l\'esportazione');
            }
        }
    }
    
    searchContacts() {
        const searchTerm = document.getElementById('contactsSearch')?.value.toLowerCase() || '';
        
        const storage = window.App?.modules?.storage;
        if (!storage) return;
        
        const allContacts = storage.getContacts();
        const filteredContacts = searchTerm 
            ? allContacts.filter(c => 
                c.name.toLowerCase().includes(searchTerm) ||
                c.phone.includes(searchTerm) ||
                c.email.toLowerCase().includes(searchTerm) ||
                c.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            )
            : allContacts;
        
        this.updateContactsTable(filteredContacts);
    }
    
    refreshContactsList() {
        // Refresh the contacts table if currently visible
        if (window.App && window.App.currentPage === 'contacts') {
            this.loadContactsTable();
        }
    }
    
    loadContactsTable() {
        const storage = window.App?.modules?.storage;
        if (!storage) return;
        
        const contacts = storage.getContacts();
        this.updateContactsTable(contacts);
    }
    
    updateContactsTable(contacts) {
        const tableBody = document.getElementById('contactsTableBody');
        if (!tableBody) return;
        
        if (contacts.length === 0) {
            const searchTerm = document.getElementById('contactsSearch')?.value || '';
            const message = searchTerm 
                ? 'Nessun contatto trovato con i criteri di ricerca'
                : 'Nessun contatto presente. Aggiungi i primi contatti!';
            
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; opacity: 0.7;">
                        <div class="table-empty">
                            <div class="table-empty-icon" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">
                                <i class="fas fa-${searchTerm ? 'search' : 'users'}"></i>
                            </div>
                            <p>${message}</p>
                            ${!searchTerm ? `
                                <button class="btn btn-primary" onclick="window.App.modules.contacts.showContactModal()" style="margin-top: 1rem;">
                                    <i class="fas fa-plus"></i> Aggiungi il primo contatto
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = contacts.map(contact => {
            const statusBadge = contact.status === 'active' 
                ? '<span class="badge badge-success">Attivo</span>' 
                : '<span class="badge badge-warning">Inattivo</span>';
            
            return `
                <tr>
                    <td><strong>${contact.name}</strong></td>
                    <td>${contact.phone}</td>
                    <td>${contact.email || '-'}</td>
                    <td>
                        ${contact.tags.length > 0 
                            ? contact.tags.map(tag => `<span class="badge badge-outline badge-secondary" style="margin-right: 0.25rem;">${tag}</span>`).join('')
                            : '-'
                        }
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-icon btn-edit" onclick="window.App.modules.contacts.editContact('${contact.id}')" title="Modifica">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="window.App.modules.contacts.deleteContact('${contact.id}')" title="Elimina">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-icon btn-whatsapp" onclick="window.App.modules.contacts.sendDirectMessage('${contact.id}')" title="Messaggio diretto">
                            <i class="fas fa-comment"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    async editContact(contactId) {
        // TODO: Implement edit functionality
        if (window.App?.modules?.toast) {
            window.App.modules.toast.info('Funzionalità di modifica in sviluppo');
        }
    }
    
    showContactModal() {
        if (window.App?.modules?.modal) {
            const modalContent = `
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-user-plus"></i> Nuovo Contatto
                    </h2>
                </div>
                <div class="modal-body">
                    <form id="contactFormElement">
                        <div class="form-group">
                            <label for="contactName">Nome Completo *</label>
                            <input type="text" id="contactName" class="form-control" placeholder="Mario Rossi" required>
                            <small class="form-help">Nome e cognome del contatto</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="contactPhone">Numero Telefono *</label>
                            <input type="tel" id="contactPhone" class="form-control" placeholder="+39 347 123 4567" required>
                            <small class="form-help">Includi il prefisso internazionale (+39 per Italia)</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="contactEmail">Email (opzionale)</label>
                            <input type="email" id="contactEmail" class="form-control" placeholder="mario@example.com">
                            <small class="form-help">Email per comunicazioni aggiuntive</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="contactTags">Tag (separati da virgola)</label>
                            <input type="text" id="contactTags" class="form-control" placeholder="cliente, vip, roma">
                            <small class="form-help">Categorie per organizzare i contatti (es: cliente, prospect, vip)</small>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.App.modules.modal.hide()">
                        <i class="fas fa-times"></i> Annulla
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.App.modules.contacts.handleAddContact()">
                        <i class="fas fa-save"></i> Salva Contatto
                    </button>
                </div>
            `;
            
            window.App.modules.modal.show(modalContent);
        }
    }
    
    async handleAddContact() {
        try {
            const contactData = {
                name: document.getElementById('contactName').value,
                phone: document.getElementById('contactPhone').value,
                email: document.getElementById('contactEmail').value,
                tags: document.getElementById('contactTags').value
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t)
            };
            
            await this.addContact(contactData);
            
            if (window.App?.modules?.modal) {
                window.App.modules.modal.hide();
            }
            
        } catch (error) {
            console.error('Error adding contact:', error);
            // Error is already handled in addContact method
        }
    }
    
    getPageContent() {
        return `
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-users"></i> 
                    Gestione Contatti
                </h1>
                <p class="page-subtitle">Gestisci il tuo database clienti e prospect</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-user-plus"></i> Gestione Contatti</h3>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="window.App.modules.contacts.showContactModal()">
                            <i class="fas fa-user-plus"></i> Nuovo Contatto
                        </button>
                        <button class="btn btn-secondary" onclick="window.App.modules.contacts.importContacts()">
                            <i class="fas fa-upload"></i> Importa CSV
                        </button>
                        <button class="btn btn-secondary" onclick="window.App.modules.contacts.exportContacts()">
                            <i class="fas fa-download"></i> Esporta
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <div class="table-header">
                        <div class="table-title">I Tuoi Contatti</div>
                        <div class="table-actions">
                            <input type="text" class="form-control table-search" placeholder="Cerca contatti..." id="contactsSearch" oninput="window.App.modules.contacts.searchContacts()">
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Telefono</th>
                                    <th>Email</th>
                                    <th>Tag</th>
                                    <th>Status</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody id="contactsTableBody">
                                <tr>
                                    <td colspan="6" style="text-align: center; padding: 2rem; opacity: 0.7;">
                                        <i class="fas fa-spinner fa-spin"></i> Caricamento contatti...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-chart-pie"></i> Statistiche Contatti</h3>
                </div>
                
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users" style="color: var(--primary);"></i>
                        </div>
                        <div class="stat-value" id="totalContactsCount">4</div>
                        <div class="stat-label">Contatti Totali</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-user-check" style="color: var(--success);"></i>
                        </div>
                        <div class="stat-value" id="activeContactsCount">4</div>
                        <div class="stat-label">Contatti Attivi</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-tags" style="color: var(--accent);"></i>
                        </div>
                        <div class="stat-value" id="taggedContactsCount">4</div>
                        <div class="stat-label">Con Tag</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-envelope" style="color: var(--warning);"></i>
                        </div>
                        <div class="stat-value" id="emailContactsCount">4</div>
                        <div class="stat-label">Con Email</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-question-circle"></i> Come Usare i Contatti</h3>
                </div>
                
                <div class="alert alert-info">
                    <div class="alert-icon"><i class="fas fa-lightbulb"></i></div>
                    <div class="alert-content">
                        <div class="alert-title">Consigli per Gestire i Contatti</div>
                        <div class="alert-message">
                            <strong>📝 Importazione CSV:</strong> Formato: Nome, Telefono, Email, Tag<br>
                            <strong>🏷️ Tag Utili:</strong> cliente, prospect, vip, città, settore<br>
                            <strong>📱 Telefoni:</strong> Usa sempre il prefisso (+39 per Italia)<br>
                            <strong>💬 Messaggi Diretti:</strong> Clicca l'icona WhatsApp per inviare subito
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async initializePage() {
        // Load contacts table
        this.loadContactsTable();
        
        // Update stats
        this.updateContactStats();
    }
    
    updateContactStats() {
        const storage = window.App?.modules?.storage;
        if (!storage) return;
        
        const contacts = storage.getContacts();
        const activeContacts = contacts.filter(c => c.status === 'active');
        const taggedContacts = contacts.filter(c => c.tags.length > 0);
        const emailContacts = contacts.filter(c => c.email && c.email.trim());
        
        // Update stat displays
        const totalEl = document.getElementById('totalContactsCount');
        const activeEl = document.getElementById('activeContactsCount');
        const taggedEl = document.getElementById('taggedContactsCount');
        const emailEl = document.getElementById('emailContactsCount');
        
        if (totalEl) totalEl.textContent = contacts.length;
        if (activeEl) activeEl.textContent = activeContacts.length;
        if (taggedEl) taggedEl.textContent = taggedContacts.length;
        if (emailEl) emailEl.textContent = emailContacts.length;
    }
}

window.ContactsModule = ContactsModule;