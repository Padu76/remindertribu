/**
 * Reminders Module
 * Handles reminder creation, management, and execution
 */

class RemindersModule {
    constructor() {
        this.reminders = [];
        this.isInitialized = false;
        this.editingReminder = null;
    }
    
    async init() {
        try {
            console.log('⏰ Initializing Reminders module...');
            this.isInitialized = true;
            console.log('✅ Reminders module initialized');
        } catch (error) {
            console.error('❌ Reminders module initialization failed:', error);
        }
    }
    
    async addReminder(reminderData) {
        try {
            if (!window.App.modules.storage) {
                throw new Error('Storage module not available');
            }
            
            // Validate reminder data
            this.validateReminderData(reminderData);
            
            const reminder = await window.App.modules.storage.addReminder(reminderData);
            
            if (window.App.modules.toast) {
                window.App.modules.toast.success('Reminder creato con successo!');
            }
            
            // Update UI
            this.refreshRemindersList();
            
            // Update dashboard stats
            if (window.AppEventBus) {
                window.AppEventBus.emit('data:updated');
            }
            
            return reminder;
            
        } catch (error) {
            console.error('Failed to add reminder:', error);
            if (window.App.modules.toast) {
                window.App.modules.toast.error(error.message || 'Errore nella creazione del reminder');
            }
            throw error;
        }
    }
    
    validateReminderData(data) {
        if (!data.name || data.name.trim().length < 3) {
            throw new Error('Il nome del reminder deve essere di almeno 3 caratteri');
        }
        
        if (!data.message || data.message.trim().length < 10) {
            throw new Error('Il messaggio deve essere di almeno 10 caratteri');
        }
        
        if (!data.date) {
            throw new Error('La data è obbligatoria');
        }
        
        if (!data.time) {
            throw new Error('L\'ora è obbligatoria');
        }
        
        // Validate date is not in the past
        const reminderDateTime = new Date(`${data.date}T${data.time}`);
        const now = new Date();
        
        if (reminderDateTime <= now && data.type === 'once') {
            throw new Error('La data e ora non possono essere nel passato per reminder singoli');
        }
        
        return true;
    }
    
    async executeReminder(reminderId) {
        try {
            const storage = window.App.modules.storage;
            if (!storage) {
                throw new Error('Storage module not available');
            }
            
            const reminder = storage.getReminders().find(r => r.id === reminderId);
            if (!reminder) {
                throw new Error('Reminder not found');
            }
            
            // Get target contacts count first for confirmation
            const targetContacts = this.getTargetContacts(reminder.target);
            
            if (targetContacts.length === 0) {
                if (window.App.modules.toast) {
                    window.App.modules.toast.warning('Nessun contatto trovato per questo reminder');
                }
                return;
            }
            
            if (!confirm(`Vuoi eseguire il reminder "${reminder.name}" ora per ${targetContacts.length} contatti?`)) {
                return;
            }
            
            if (window.App) {
                window.App.showLoading('Preparazione invio messaggi...');
            }
            
            // Create WhatsApp commands
            const commands = targetContacts.map(contact => ({
                type: 'send_message',
                phone: contact.phone,
                message: this.personalizeMessage(reminder.message, contact),
                contactName: contact.name,
                reminderId: reminder.id,
                timestamp: new Date().toISOString()
            }));
            
            // Send to WhatsApp automation
            localStorage.setItem('remindpro_whatsapp_commands', JSON.stringify(commands));
            
            // Update reminder stats
            await storage.updateReminder(reminderId, {
                lastSent: new Date().toISOString(),
                totalSent: (reminder.totalSent || 0) + commands.length,
                lastTargetCount: commands.length
            });
            
            // Update global stats
            const currentStats = storage.getUserStats() || {};
            await storage.updateStats({
                messagesSent: (currentStats.messagesSent || 0) + commands.length,
                lastActivity: new Date().toISOString()
            });
            
            if (window.App) {
                window.App.hideLoading();
            }
            
            if (window.App.modules.toast) {
                window.App.modules.toast.success(`✅ Invio avviato per ${commands.length} contatti! Controlla WhatsApp Web.`);
            }
            
            // Log the execution
            this.logReminderExecution(reminder, commands.length);
            
            // Refresh UI
            this.refreshRemindersList();
            
            // Update dashboard stats
            if (window.AppEventBus) {
                window.AppEventBus.emit('data:updated');
            }
            
        } catch (error) {
            if (window.App) {
                window.App.hideLoading();
            }
            
            console.error('Failed to execute reminder:', error);
            if (window.App.modules.toast) {
                window.App.modules.toast.error(error.message || 'Errore durante l\'esecuzione del reminder');
            }
        }
    }
    
    logReminderExecution(reminder, recipientCount) {
        try {
            const logs = JSON.parse(localStorage.getItem('remindpro_reminder_logs') || '[]');
            
            const logEntry = {
                id: Date.now().toString(),
                reminderId: reminder.id,
                reminderName: reminder.name,
                executedAt: new Date().toISOString(),
                recipientCount: recipientCount,
                success: true
            };
            
            logs.unshift(logEntry);
            
            // Keep only last 100 logs
            if (logs.length > 100) {
                logs.splice(100);
            }
            
            localStorage.setItem('remindpro_reminder_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to log reminder execution:', error);
        }
    }
    
    getTargetContacts(targetType) {
        const storage = window.App.modules.storage;
        if (!storage) return [];
        
        const allContacts = storage.getContacts().filter(c => c.status === 'active');
        
        switch (targetType) {
            case 'all':
                return allContacts;
            case 'segment':
                return allContacts.filter(c => c.tags && c.tags.includes('vip'));
            case 'tag':
                return allContacts.filter(c => c.tags && c.tags.includes('cliente'));
            case 'custom':
                // In future, implement custom contact selection
                return allContacts;
            default:
                return allContacts;
        }
    }
    
    personalizeMessage(template, contact) {
        const storage = window.App.modules.storage;
        const profile = storage ? storage.getUserProfile() : null;
        
        let message = template;
        
        // Replace placeholders
        message = message.replace(/{nome}/gi, contact.name || 'Cliente');
        message = message.replace(/{azienda}/gi, profile?.company || 'la tua azienda');
        message = message.replace(/{data}/gi, new Date().toLocaleDateString('it-IT'));
        message = message.replace(/{ora}/gi, new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
        
        return message;
    }
    
    async deleteReminder(reminderId) {
        try {
            const storage = window.App.modules.storage;
            if (!storage) {
                throw new Error('Storage module not available');
            }
            
            const reminder = storage.getReminders().find(r => r.id === reminderId);
            if (!reminder) {
                throw new Error('Reminder not found');
            }
            
            if (!confirm(`Sei sicuro di voler eliminare il reminder "${reminder.name}"?`)) {
                return;
            }
            
            await storage.deleteReminder(reminderId);
            
            if (window.App.modules.toast) {
                window.App.modules.toast.success('Reminder eliminato con successo');
            }
            
            this.refreshRemindersList();
            
            // Update dashboard stats
            if (window.AppEventBus) {
                window.AppEventBus.emit('data:updated');
            }
            
        } catch (error) {
            console.error('Failed to delete reminder:', error);
            if (window.App.modules.toast) {
                window.App.modules.toast.error(error.message || 'Errore nell\'eliminazione del reminder');
            }
        }
    }
    
    async editReminder(reminderId) {
        try {
            const storage = window.App.modules.storage;
            if (!storage) {
                throw new Error('Storage module not available');
            }
            
            const reminder = storage.getReminders().find(r => r.id === reminderId);
            if (!reminder) {
                throw new Error('Reminder not found');
            }
            
            this.editingReminder = reminder;
            
            // Show form
            this.showReminderForm(true);
            
            // Populate form with reminder data
            this.populateFormWithReminder(reminder);
            
        } catch (error) {
            console.error('Failed to edit reminder:', error);
            if (window.App.modules.toast) {
                window.App.modules.toast.error('Errore nel caricamento del reminder per la modifica');
            }
        }
    }
    
    populateFormWithReminder(reminder) {
        try {
            // Populate form fields
            const fields = {
                reminderName: reminder.name,
                reminderType: reminder.type,
                reminderDate: reminder.date,
                reminderTime: reminder.time,
                reminderTarget: reminder.target,
                reminderMessage: reminder.message
            };
            
            Object.entries(fields).forEach(([fieldId, value]) => {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.value = value;
                }
            });
            
            // Handle recurring type
            if (reminder.type === 'recurring') {
                const recurringType = document.getElementById('recurringType');
                if (recurringType && reminder.recurring) {
                    recurringType.value = reminder.recurring;
                }
                this.toggleReminderOptions(); // Show recurring options
            }
            
            // Update form title and button
            const formTitle = document.querySelector('#reminderForm h4');
            if (formTitle) {
                formTitle.innerHTML = '<i class="fas fa-edit"></i> Modifica Reminder';
            }
            
            const submitButton = document.querySelector('#reminderFormElement button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-save"></i> Aggiorna Reminder';
            }
            
        } catch (error) {
            console.error('Failed to populate form:', error);
        }
    }
    
    refreshRemindersList() {
        // Refresh the reminders table if currently visible
        if (window.App && window.App.currentPage === 'reminders') {
            this.loadRemindersTable();
        }
    }
    
    loadRemindersTable() {
        const storage = window.App.modules.storage;
        if (!storage) return;
        
        const tableBody = document.getElementById('remindersTableBody');
        if (!tableBody) return;
        
        const reminders = storage.getReminders();
        
        if (reminders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; opacity: 0.7;">
                        <div class="table-empty">
                            <div class="table-empty-icon">
                                <i class="fas fa-clock" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            </div>
                            <h4 style="margin-bottom: 0.5rem;">Nessun reminder creato</h4>
                            <p style="margin-bottom: 1.5rem;">Crea il primo reminder per iniziare l'automazione!</p>
                            <button class="btn btn-primary" onclick="window.App.modules.reminders.showReminderForm()">
                                <i class="fas fa-plus"></i> Crea il Primo Reminder
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = reminders.map(reminder => {
            const nextRun = this.calculateNextRun(reminder);
            const targetCount = this.getTargetCount(reminder.target);
            const statusBadge = reminder.status === 'active' 
                ? '<span class="badge badge-success">Attivo</span>' 
                : '<span class="badge badge-warning">In Pausa</span>';
            
            const lastSent = reminder.lastSent 
                ? new Date(reminder.lastSent).toLocaleDateString('it-IT')
                : 'Mai';
            
            return `
                <tr class="reminder-row" data-reminder-id="${reminder.id}">
                    <td>
                        <div class="reminder-info">
                            <strong class="reminder-name">${reminder.name}</strong>
                            <div class="reminder-preview">${this.truncateText(reminder.message, 50)}</div>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${reminder.type === 'recurring' ? 'badge-primary' : reminder.type === 'conditional' ? 'badge-secondary' : 'badge-outline'}">
                            ${this.getTypeLabel(reminder.type)}
                        </span>
                        ${reminder.recurring ? `<div class="recurring-info">${this.getRecurringLabel(reminder.recurring)}</div>` : ''}
                    </td>
                    <td class="next-run-cell">${nextRun}</td>
                    <td>
                        <div class="target-info">
                            <i class="fas fa-users"></i> ${targetCount}
                            <div class="target-type">${this.getTargetLabel(reminder.target)}</div>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td class="last-sent-cell">${lastSent}</td>
                    <td class="actions-cell">
                        <div class="action-buttons">
                            <button class="btn-icon btn-whatsapp" onclick="window.App.modules.reminders.executeReminder('${reminder.id}')" title="Esegui ora">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="btn-icon btn-edit" onclick="window.App.modules.reminders.editReminder('${reminder.id}')" title="Modifica">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="window.App.modules.reminders.deleteReminder('${reminder.id}')" title="Elimina">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    calculateNextRun(reminder) {
        const now = new Date();
        const reminderTime = new Date(`${reminder.date}T${reminder.time}`);
        
        if (reminder.type === 'once') {
            if (reminderTime > now) {
                return `<span class="next-run-time">${reminderTime.toLocaleDateString('it-IT')} ${reminderTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>`;
            }
            return '<span class="text-warning">Scaduto</span>';
        } else if (reminder.type === 'recurring') {
            const next = new Date(reminderTime);
            let iterations = 0;
            const maxIterations = 365;
            
            while (next <= now && iterations < maxIterations) {
                switch (reminder.recurring) {
                    case 'daily':
                        next.setDate(next.getDate() + 1);
                        break;
                    case 'weekly':
                        next.setDate(next.getDate() + 7);
                        break;
                    case 'monthly':
                        next.setMonth(next.getMonth() + 1);
                        break;
                }
                iterations++;
            }
            
            if (iterations < maxIterations) {
                const diffTime = next.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let timeClass = 'next-run-time';
                if (diffDays <= 1) timeClass = 'text-success';
                else if (diffDays <= 3) timeClass = 'text-warning';
                
                return `<span class="${timeClass}">${next.toLocaleDateString('it-IT')} ${next.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>`;
            }
            return '<span class="text-danger">Errore</span>';
        }
        return '<span class="text-muted">Non programmato</span>';
    }
    
    getTargetCount(target) {
        const storage = window.App.modules.storage;
        if (!storage) return 0;
        
        const activeContacts = storage.getContacts().filter(c => c.status === 'active');
        switch (target) {
            case 'all':
                return activeContacts.length;
            case 'segment':
                return activeContacts.filter(c => c.tags && c.tags.includes('vip')).length;
            case 'tag':
                return activeContacts.filter(c => c.tags && c.tags.includes('cliente')).length;
            case 'custom':
                return activeContacts.length; // Placeholder for custom logic
            default:
                return activeContacts.length;
        }
    }
    
    getTypeLabel(type) {
        const labels = {
            once: 'Una volta',
            recurring: 'Ricorrente',
            conditional: 'Condizionale'
        };
        return labels[type] || type;
    }
    
    getRecurringLabel(recurring) {
        const labels = {
            daily: 'Giornaliero',
            weekly: 'Settimanale',
            monthly: 'Mensile',
            custom: 'Personalizzato'
        };
        return labels[recurring] || recurring;
    }
    
    getTargetLabel(target) {
        const labels = {
            all: 'Tutti i contatti',
            segment: 'Segmento VIP',
            tag: 'Tag specifico',
            custom: 'Lista personalizzata'
        };
        return labels[target] || target;
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    getPageContent() {
        return `
            <div class="reminders-container">
                <div class="page-header">
                    <h1 class="page-title">
                        <i class="fas fa-clock"></i> 
                        Gestione Reminder
                    </h1>
                    <p class="page-subtitle">Crea e gestisci i tuoi reminder automatici per WhatsApp</p>
                </div>

                <div class="reminders-stats">
                    <div class="stats-row">
                        <div class="stat-box">
                            <div class="stat-icon success">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number" id="activeRemindersCount">0</div>
                                <div class="stat-label">Reminder Attivi</div>
                            </div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-icon primary">
                                <i class="fas fa-paper-plane"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number" id="totalMessagesSent">0</div>
                                <div class="stat-label">Messaggi Inviati</div>
                            </div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-icon warning">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number" id="nextReminderCount">0</div>
                                <div class="stat-label">Prossime 24h</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-plus-circle"></i> Nuovo Reminder</h3>
                        <div class="card-actions">
                            <button class="btn btn-primary" onclick="window.App.modules.reminders.showReminderForm()">
                                <i class="fas fa-plus"></i> Crea Reminder
                            </button>
                        </div>
                    </div>

                    <div id="reminderForm" class="reminder-form" style="display: none;">
                        <h4><i class="fas fa-plus-circle"></i> Nuovo Reminder</h4>
                        <form id="reminderFormElement" onsubmit="window.App.modules.reminders.handleCreateReminder(event)">
                            <div class="form-section">
                                <h5><i class="fas fa-info-circle"></i> Informazioni Base</h5>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="reminderName">Nome Reminder</label>
                                        <input type="text" id="reminderName" class="form-control" placeholder="es. Reminder Ordine Settimanale" required>
                                        <small class="form-help">Dai un nome descrittivo al tuo reminder</small>
                                    </div>
                                    <div class="form-group">
                                        <label for="reminderType">Tipo</label>
                                        <select id="reminderType" class="form-control" onchange="window.App.modules.reminders.toggleReminderOptions()">
                                            <option value="once">Una volta</option>
                                            <option value="recurring">Ricorrente</option>
                                            <option value="conditional">Condizionale</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h5><i class="fas fa-calendar-alt"></i> Programmazione</h5>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="reminderDate">Data</label>
                                        <input type="date" id="reminderDate" class="form-control" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="reminderTime">Ora</label>
                                        <input type="time" id="reminderTime" class="form-control" value="10:00" required>
                                    </div>
                                </div>

                                <div id="recurringOptions" class="form-group" style="display: none;">
                                    <label for="recurringType">Frequenza</label>
                                    <select id="recurringType" class="form-control">
                                        <option value="daily">Ogni giorno</option>
                                        <option value="weekly">Ogni settimana</option>
                                        <option value="monthly">Ogni mese</option>
                                        <option value="custom">Personalizzato</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-section">
                                <h5><i class="fas fa-users"></i> Destinatari</h5>
                                <div class="form-group">
                                    <label for="reminderTarget">Chi riceverà il messaggio?</label>
                                    <select id="reminderTarget" class="form-control">
                                        <option value="all">Tutti i contatti attivi</option>
                                        <option value="segment">Segmento VIP</option>
                                        <option value="tag">Contatti con tag specifico</option>
                                        <option value="custom">Lista personalizzata</option>
                                    </select>
                                    <small class="form-help">Scegli chi deve ricevere questo reminder</small>
                                </div>
                            </div>

                            <div class="form-section">
                                <h5><i class="fas fa-comment-alt"></i> Messaggio</h5>
                                <div class="form-group">
                                    <label for="reminderMessage">Testo del messaggio</label>
                                    <textarea id="reminderMessage" class="form-control" rows="4" placeholder="🥗 Ciao {nome}! È giovedì, ricordati di ordinare i pasti per la settimana!" required></textarea>
                                    <small class="form-help">
                                        <strong>Variabili disponibili:</strong>
                                        <code>{nome}</code> - Nome del contatto |
                                        <code>{data}</code> - Data attuale |
                                        <code>{azienda}</code> - Nome della tua azienda |
                                        <code>{ora}</code> - Ora attuale
                                    </small>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Salva Reminder
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="window.App.modules.reminders.hideReminderForm()">
                                    <i class="fas fa-times"></i> Annulla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-list"></i> I Tuoi Reminder</h3>
                        <div class="card-actions">
                            <button class="btn btn-secondary btn-sm" onclick="window.App.modules.reminders.refreshRemindersList()">
                                <i class="fas fa-sync-alt"></i> Aggiorna
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <div class="table-responsive">
                            <table class="table reminders-table">
                                <thead>
                                    <tr>
                                        <th>Reminder</th>
                                        <th>Tipo</th>
                                        <th>Prossimo Invio</th>
                                        <th>Destinatari</th>
                                        <th>Status</th>
                                        <th>Ultimo Invio</th>
                                        <th>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody id="remindersTableBody">
                                    <tr>
                                        <td colspan="7" style="text-align: center; padding: 2rem; opacity: 0.7;">
                                            <i class="fas fa-spinner fa-spin"></i> Caricamento reminder...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async initializePage() {
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateInput = document.getElementById('reminderDate');
        if (dateInput) {
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }
        
        // Load reminders table
        this.loadRemindersTable();
        
        // Update stats
        this.updateReminderStats();
        
        // Add page-specific styles
        this.addReminderStyles();
    }
    
    updateReminderStats() {
        const storage = window.App.modules.storage;
        if (!storage) return;
        
        const reminders = storage.getReminders();
        const userStats = storage.getUserStats() || {};
        
        // Active reminders count
        const activeCount = reminders.filter(r => r.status === 'active').length;
        const activeElement = document.getElementById('activeRemindersCount');
        if (activeElement) {
            activeElement.textContent = activeCount;
        }
        
        // Total messages sent
        const totalSent = userStats.messagesSent || 0;
        const sentElement = document.getElementById('totalMessagesSent');
        if (sentElement) {
            sentElement.textContent = totalSent.toLocaleString('it-IT');
        }
        
        // Next 24h reminders
        const next24h = this.getNext24hReminders();
        const nextElement = document.getElementById('nextReminderCount');
        if (nextElement) {
            nextElement.textContent = next24h;
        }
    }
    
    getNext24hReminders() {
        const storage = window.App.modules.storage;
        if (!storage) return 0;
        
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        return storage.getReminders().filter(reminder => {
            if (reminder.status !== 'active') return false;
            
            const reminderTime = new Date(`${reminder.date}T${reminder.time}`);
            
            if (reminder.type === 'once') {
                return reminderTime >= now && reminderTime <= tomorrow;
            } else if (reminder.type === 'recurring') {
                // Calculate next occurrence
                const next = new Date(reminderTime);
                while (next <= now) {
                    switch (reminder.recurring) {
                        case 'daily':
                            next.setDate(next.getDate() + 1);
                            break;
                        case 'weekly':
                            next.setDate(next.getDate() + 7);
                            break;
                        case 'monthly':
                            next.setMonth(next.getMonth() + 1);
                            break;
                    }
                }
                return next <= tomorrow;
            }
            
            return false;
        }).length;
    }
    
    showReminderForm(isEdit = false) {
        const form = document.getElementById('reminderForm');
        if (form) {
            form.style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            if (!isEdit) {
                // Reset form for new reminder
                this.resetReminderForm();
            }
        }
    }
    
    hideReminderForm() {
        const form = document.getElementById('reminderForm');
        if (form) {
            form.style.display = 'none';
            this.resetReminderForm();
        }
    }
    
    resetReminderForm() {
        const formElement = document.getElementById('reminderFormElement');
        if (formElement) {
            formElement.reset();
            
            // Reset date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateInput = document.getElementById('reminderDate');
            if (dateInput) {
                dateInput.value = tomorrow.toISOString().split('T')[0];
            }
            
            // Reset time to 10:00
            const timeInput = document.getElementById('reminderTime');
            if (timeInput) {
                timeInput.value = '10:00';
            }
            
            // Hide recurring options
            const recurringOptions = document.getElementById('recurringOptions');
            if (recurringOptions) {
                recurringOptions.style.display = 'none';
            }
            
            // Reset form title and button
            const formTitle = document.querySelector('#reminderForm h4');
            if (formTitle) {
                formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Nuovo Reminder';
            }
            
            const submitButton = document.querySelector('#reminderFormElement button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-save"></i> Salva Reminder';
            }
        }
        
        this.editingReminder = null;
    }
    
    toggleReminderOptions() {
        const type = document.getElementById('reminderType')?.value;
        const recurringOptions = document.getElementById('recurringOptions');
        
        if (recurringOptions) {
            if (type === 'recurring') {
                recurringOptions.style.display = 'block';
            } else {
                recurringOptions.style.display = 'none';
            }
        }
    }
    
    async handleCreateReminder(event) {
        event.preventDefault();
        
        try {
            const reminderData = {
                name: document.getElementById('reminderName').value.trim(),
                type: document.getElementById('reminderType').value,
                date: document.getElementById('reminderDate').value,
                time: document.getElementById('reminderTime').value,
                target: document.getElementById('reminderTarget').value,
                message: document.getElementById('reminderMessage').value.trim()
            };
            
            if (reminderData.type === 'recurring') {
                reminderData.recurring = document.getElementById('recurringType').value;
            }
            
            if (this.editingReminder) {
                // Update existing reminder
                await window.App.modules.storage.updateReminder(this.editingReminder.id, reminderData);
                
                if (window.App.modules.toast) {
                    window.App.modules.toast.success('Reminder aggiornato con successo!');
                }
            } else {
                // Create new reminder
                await this.addReminder(reminderData);
            }
            
            this.hideReminderForm();
            
        } catch (error) {
            console.error('Error creating/updating reminder:', error);
            // Error is already handled in addReminder or updateReminder
        }
    }
    
    addReminderStyles() {
        if (document.getElementById('reminders-page-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'reminders-page-styles';
        styles.textContent = `
            .reminders-container {
                max-width: 1400px;
                margin: 0 auto;
            }

            .reminders-stats {
                margin-bottom: var(--spacing-xl);
            }

            .stats-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: var(--spacing-lg);
            }

            .stat-box {
                background: var(--glass-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-lg);
                padding: var(--spacing-lg);
                display: flex;
                align-items: center;
                gap: var(--spacing-lg);
                transition: all var(--transition);
            }

            .stat-box:hover {
                background: var(--glass-bg-strong);
                transform: translateY(-2px);
            }

            .stat-icon {
                width: 48px;
                height: 48px;
                border-radius: var(--radius-lg);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
                color: white;
            }

            .stat-icon.success {
                background: var(--gradient-primary);
            }

            .stat-icon.primary {
                background: var(--gradient-secondary);
            }

            .stat-icon.warning {
                background: var(--gradient-accent);
            }

            .stat-number {
                font-size: 1.5rem;
                font-weight: 700;
                color: white;
                margin-bottom: var(--spacing-xs);
            }

            .stat-label {
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.8);
            }

            .reminder-form {
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: var(--spacing-xl);
                margin-top: var(--spacing-lg);
            }

            .reminder-form h4 {
                color: white;
                margin-bottom: var(--spacing-xl);
                font-size: 1.25rem;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }

            .form-section {
                margin-bottom: var(--spacing-xl);
                padding: var(--spacing-lg);
                background: rgba(255, 255, 255, 0.05);
                border-radius: var(--radius-lg);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .form-section h5 {
                color: white;
                margin-bottom: var(--spacing-lg);
                font-size: 1rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: var(--spacing-sm);
            }

            .form-help {
                font-size: 0.85rem;
                color: rgba(255, 255, 255, 0.7);
                margin-top: var(--spacing-xs);
                line-height: 1.4;
            }

            .form-help code {
                background: rgba(255, 255, 255, 0.1);
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.8rem;
                color: var(--primary);
            }

            .form-actions {
                display: flex;
                gap: var(--spacing-lg);
                padding-top: var(--spacing-lg);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                justify-content: flex-end;
            }

            .reminders-table {
                font-size: 0.9rem;
            }

            .reminder-row {
                transition: all var(--transition);
            }

            .reminder-row:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            .reminder-info {
                min-width: 200px;
            }

            .reminder-name {
                font-weight: 600;
                color: white;
                margin-bottom: var(--spacing-xs);
                display: block;
            }

            .reminder-preview {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.3;
            }

            .recurring-info {
                font-size: 0.75rem;
                color: rgba(255, 255, 255, 0.6);
                margin-top: var(--spacing-xs);
            }

            .next-run-cell,
            .last-sent-cell {
                font-size: 0.85rem;
            }

            .next-run-time {
                color: white;
            }

            .target-info {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                flex-direction: column;
                align-items: flex-start;
            }

            .target-type {
                font-size: 0.75rem;
                color: rgba(255, 255, 255, 0.6);
            }

            .actions-cell {
                min-width: 120px;
            }

            .action-buttons {
                display: flex;
                gap: var(--spacing-xs);
                justify-content: center;
            }

            .btn-icon {
                width: 32px;
                height: 32px;
                border-radius: var(--radius);
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                cursor: pointer;
                transition: all var(--transition);
                font-size: 0.8rem;
            }

            .btn-whatsapp {
                background: rgba(16, 185, 129, 0.2);
                color: var(--primary);
            }

            .btn-edit {
                background: rgba(99, 102, 241, 0.2);
                color: var(--secondary);
            }

            .btn-delete {
                background: rgba(239, 68, 68, 0.2);
                color: var(--danger);
            }

            .btn-icon:hover {
                transform: scale(1.1);
                box-shadow: var(--shadow);
            }

            .badge {
                display: inline-block;
                padding: var(--spacing-xs) var(--spacing-sm);
                font-size: 0.75rem;
                font-weight: 600;
                border-radius: var(--radius);
                text-transform: uppercase;
                letter-spacing: 0.025em;
            }

            .badge-primary {
                background: rgba(16, 185, 129, 0.2);
                color: var(--primary);
            }

            .badge-secondary {
                background: rgba(99, 102, 241, 0.2);
                color: var(--secondary);
            }

            .badge-success {
                background: rgba(16, 185, 129, 0.2);
                color: var(--success);
            }

            .badge-warning {
                background: rgba(245, 158, 11, 0.2);
                color: var(--warning);
            }

            .badge-outline {
                background: transparent;
                border: 1px solid currentColor;
            }

            .text-success { color: var(--success); }
            .text-warning { color: var(--warning); }
            .text-danger { color: var(--danger); }
            .text-muted { color: rgba(255, 255, 255, 0.6); }

            .table-empty {
                text-align: center;
                color: rgba(255, 255, 255, 0.8);
            }

            .table-empty h4 {
                color: white;
                margin-bottom: var(--spacing-sm);
            }

            .table-empty p {
                margin-bottom: var(--spacing-lg);
                opacity: 0.8;
            }

            @media (max-width: 768px) {
                .form-actions {
                    flex-direction: column;
                }

                .action-buttons {
                    flex-direction: column;
                }

                .table-responsive {
                    overflow-x: auto;
                }

                .reminders-table th,
                .reminders-table td {
                    padding: var(--spacing-sm);
                    font-size: 0.8rem;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

window.RemindersModule = RemindersModule;