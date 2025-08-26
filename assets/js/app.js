/**
 * Main Application Controller
 * Coordinates all modules and handles page navigation
 */

window.TribuApp = class {
    constructor() {
        this.currentPage = 'dashboard';
        this.isInitialized = false;
        this.storage = null;
        this.auth = null;
        this.toast = null;
        
        // Data stores
        this.tesseratiData = [];
        this.marketingClienti = [];
        this.scheduledMessages = [];
        this.calendarEvents = [];
        this.templates = {};
        
        // UI state
        this.currentFilter = 'all';
        this.filteredData = [];
        this.selectedClients = [];
    }
    
    async init() {
        try {
            console.log('🚀 Initializing TribuReminder Application...');
            
            // Initialize core modules
            await this.initModules();
            
            // Check authentication
            if (this.auth.checkExistingSession()) {
                this.showMainApp();
                await this.postLoginInit();
            } else {
                this.showLoginScreen();
            }
            
            this.isInitialized = true;
            console.log('✅ TribuReminder Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.handleInitError(error);
        }
    }
    
    async initModules() {
        // Initialize Authentication
        if (window.Auth_Instance) {
            this.auth = window.Auth_Instance;
            this.auth.init();
        }
        
        // Initialize Toast System
        if (window.Toast_Instance) {
            this.toast = window.Toast_Instance;
            window.AppToast = this.toast; // Make globally available
        }
        
        // Initialize Storage
        if (window.Storage_Instance) {
            this.storage = window.Storage_Instance;
            await this.storage.init();
        }
        
        // Setup navigation
        this.setupNavigation();
        
        console.log('📦 Core modules initialized');
    }
    
    async postLoginInit() {
        try {
            // Load data
            await this.loadAllData();
            
            // Initialize Google Calendar if enabled
            if (window.AppConfig?.google?.enabled) {
                this.initGoogleCalendar();
            }
            
            // Show dashboard
            this.showPage('dashboard');
            
            // Setup periodic data refresh
            this.setupDataRefresh();
            
            console.log('🎯 Post-login initialization completed');
            
        } catch (error) {
            console.error('❌ Post-login initialization failed:', error);
            this.toast?.error('Errore inizializzazione dati');
        }
    }
    
    async loadAllData() {
        try {
            // Load members from Firebase/localStorage
            this.tesseratiData = await this.storage.getMembers();
            console.log(`👥 Loaded ${this.tesseratiData.length} members`);
            
            // Load marketing clients
            this.marketingClienti = await this.storage.getMarketingClients();
            console.log(`📢 Loaded ${this.marketingClienti.length} marketing clients`);
            
            // Load reminders
            this.scheduledMessages = await this.storage.getReminders();
            console.log(`⏰ Loaded ${this.scheduledMessages.length} reminders`);
            
            // Load templates
            this.templates = this.storage.getTemplates();
            console.log('📝 Templates loaded');
            
            // Update UI badges
            this.updateNotificationBadges();
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            throw error;
        }
    }
    
    setupNavigation() {
        const navigation = document.getElementById('main-navigation');
        if (!navigation) return;
        
        navigation.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (!navItem) return;
            
            const page = navItem.dataset.page;
            if (page) {
                this.showPage(page);
            }
        });
        
        console.log('🧭 Navigation setup completed');
    }
    
    showPage(pageName) {
        if (!this.auth?.isLoggedIn()) {
            this.auth?.showLoginScreen();
            return;
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-page="${pageName}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
        
        // Update page content
        const content = this.getPageContent(pageName);
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.innerHTML = content;
        }
        
        this.currentPage = pageName;
        
        // Initialize page-specific functionality
        this.initPageFunctionality(pageName);
        
        console.log(`📄 Page changed to: ${pageName}`);
    }
    
    getPageContent(pageName) {
        switch (pageName) {
            case 'dashboard':
                return this.getDashboardContent();
            case 'tesserati':
                return this.getTesseratiContent();
            case 'scadenze':
                return this.getScadenzeContent();
            case 'marketing':
                return this.getMarketingContent();
            case 'calendario':
                return this.getCalendarioContent();
            case 'automazione':
                return this.getAutomazioneContent();
            case 'whatsapp':
                return this.getWhatsAppContent();
            case 'import':
                return this.getImportContent();
            default:
                return '<div class="card"><h3>Pagina non trovata</h3></div>';
        }
    }
    
    getDashboardContent() {
        const stats = {
            total: this.tesseratiData.length,
            expired: this.tesseratiData.filter(t => t.status === 'expired').length,
            expiring: this.tesseratiData.filter(t => t.status === 'expiring').length,
            marketing: this.marketingClienti.length,
            scheduled: this.scheduledMessages.filter(m => m.status === 'scheduled').length,
            appointments: this.calendarEvents.length
        };
        
        return `
            <div class="page-header">
                <h1><i class="fas fa-tachometer-alt"></i> Dashboard</h1>
                <p>Sistema completo di marketing automation - Tribù Personal Training</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-id-card"></i>
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Tesserati CSEN</div>
                </div>
                <div class="stat-card stat-danger">
                    <i class="fas fa-times-circle"></i>
                    <div class="stat-value">${stats.expired}</div>
                    <div class="stat-label">Scaduti</div>
                </div>
                <div class="stat-card stat-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="stat-value">${stats.expiring}</div>
                    <div class="stat-label">In Scadenza</div>
                </div>
                <div class="stat-card stat-purple">
                    <i class="fas fa-bullhorn"></i>
                    <div class="stat-value">${stats.marketing}</div>
                    <div class="stat-label">Clienti Marketing</div>
                </div>
                <div class="stat-card stat-info">
                    <i class="fas fa-robot"></i>
                    <div class="stat-value">${stats.scheduled}</div>
                    <div class="stat-label">Invii Programmati</div>
                </div>
                <div class="stat-card stat-info">
                    <i class="fas fa-calendar-alt"></i>
                    <div class="stat-value">${stats.appointments}</div>
                    <div class="stat-label">Appuntamenti</div>
                </div>
            </div>

            <div class="card">
                <h3>🎯 ReminderTribù - Sistema Completo</h3>
                <p>Piattaforma integrata per gestione tesseramenti CSEN e marketing automation WhatsApp.</p>
                
                <div class="dashboard-features">
                    <div class="feature-card" onclick="window.TribuApp.showPage('tesserati')">
                        <div class="feature-icon">
                            <i class="fas fa-id-card"></i>
                        </div>
                        <div class="feature-content">
                            <h4>Tesserati CSEN</h4>
                            <p>Import automatico CSV, monitoraggio scadenze, alert automatici</p>
                            <span class="feature-stats">${stats.total} tesserati</span>
                        </div>
                    </div>
                    
                    <div class="feature-card" onclick="window.TribuApp.showPage('marketing')">
                        <div class="feature-icon">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                        <div class="feature-content">
                            <h4>Marketing WhatsApp</h4>
                            <p>Clienti personalizzati, template pasti e motivazionali, invii massivi</p>
                            <span class="feature-stats">${stats.marketing} clienti</span>
                        </div>
                    </div>
                    
                    <div class="feature-card" onclick="window.TribuApp.showPage('calendario')">
                        <div class="feature-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="feature-content">
                            <h4>Google Calendar</h4>
                            <p>Sync automatico, reminder pre/post allenamento</p>
                            <span class="feature-stats">${stats.appointments} appuntamenti</span>
                        </div>
                    </div>
                    
                    <div class="feature-card" onclick="window.TribuApp.showPage('automazione')">
                        <div class="feature-icon">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="feature-content">
                            <h4>Automazione</h4>
                            <p>Programmazione invii automatici, ricorrenze personalizzabili</p>
                            <span class="feature-stats">${stats.scheduled} programmati</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getTesseratiContent() {
        if (this.tesseratiData.length === 0) {
            return `
                <div class="page-header">
                    <h1><i class="fas fa-id-card"></i> Tesserati CSEN</h1>
                    <button class="btn btn-primary" onclick="window.TribuApp.showAddTesseratoModal()">
                        <i class="fas fa-user-plus"></i> Nuovo Tesserato
                    </button>
                </div>
                
                <div class="card">
                    <div class="empty-state">
                        <i class="fas fa-id-card"></i>
                        <h3>Nessun Tesserato Caricato</h3>
                        <p>Carica il file CSV CSEN oppure aggiungi manualmente i tesserati.</p>
                        <div class="empty-actions">
                            <button class="btn btn-primary" onclick="window.TribuApp.showPage('import')">
                                <i class="fas fa-upload"></i> Carica CSV
                            </button>
                            <button class="btn btn-secondary" onclick="window.TribuApp.showAddTesseratoModal()">
                                <i class="fas fa-user-plus"></i> Aggiungi Manualmente
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="page-header">
                <h1><i class="fas fa-id-card"></i> Tesserati CSEN</h1>
                <button class="btn btn-primary" onclick="window.TribuApp.showAddTesseratoModal()">
                    <i class="fas fa-user-plus"></i> Nuovo Tesserato
                </button>
            </div>
            
            <div class="card">
                <div class="filter-bar">
                    <button class="filter-btn active" data-filter="all">Tutti (${this.tesseratiData.length})</button>
                    <button class="filter-btn" data-filter="active">Attivi (${this.tesseratiData.filter(t => t.status === 'active').length})</button>
                    <button class="filter-btn" data-filter="expiring">In Scadenza (${this.tesseratiData.filter(t => t.status === 'expiring').length})</button>
                    <button class="filter-btn" data-filter="expired">Scaduti (${this.tesseratiData.filter(t => t.status === 'expired').length})</button>
                    <button class="filter-btn" data-filter="messagesent">Msg Inviati (${this.tesseratiData.filter(t => t.status === 'messagesent').length})</button>
                    <button class="filter-btn" data-filter="renewed">Rinnovati (${this.tesseratiData.filter(t => t.status === 'renewed').length})</button>
                    
                    <div class="search-box">
                        <input type="text" id="searchInput" class="form-control" placeholder="🔍 Cerca per nome o telefono...">
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Telefono</th>
                                <th>Scadenza</th>
                                <th>Stato</th>
                                <th>Giorni</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody id="dataTableBody">
                            <!-- Populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    getScadenzeContent() {
        const urgentMembers = this.tesseratiData.filter(t => t.status === 'expired' || t.status === 'expiring');
        
        return `
            <div class="page-header">
                <h1><i class="fas fa-exclamation-triangle"></i> Gestione Scadenze</h1>
                <p>Focus sui tesserati che necessitano di rinnovo</p>
            </div>
            
            <div class="card">
                <div class="urgency-banner">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3>Tesseramenti Urgenti</h3>
                        <p>${urgentMembers.length} tesserati necessitano attenzione immediata.</p>
                    </div>
                </div>
                
                <div class="scadenze-content">
                    ${urgentMembers.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <h3>Nessuna Scadenza Urgente</h3>
                            <p>Tutti i tesseramenti sono in ordine!</p>
                        </div>
                    ` : `
                        <div id="scadenzeTable">
                            <!-- Populated by JavaScript -->
                        </div>
                    `}
                </div>
            </div>
        `;
    }
    
    getMarketingContent() {
        return `
            <div class="page-header">
                <h1><i class="fas fa-bullhorn"></i> Marketing Clienti</h1>
                <button class="btn btn-primary" onclick="window.TribuApp.showAddMarketingClientModal()">
                    <i class="fas fa-user-plus"></i> Nuovo Cliente
                </button>
            </div>
            
            <div class="card">
                <div class="marketing-content">
                    <div class="empty-state">
                        <i class="fas fa-bullhorn"></i>
                        <h3>Funzionalità Marketing</h3>
                        <p>Sistema di marketing automation in sviluppo.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    getCalendarioContent() {
        return `
            <div class="page-header">
                <h1><i class="fas fa-calendar-alt"></i> Google Calendar</h1>
                <button class="btn btn-primary" onclick="window.TribuApp.initGoogleCalendar()">
                    <i class="fab fa-google"></i> Connetti Calendar
                </button>
            </div>
            
            <div class="card">
                <div class="calendar-content">
                    <div class="empty-state">
                        <i class="fas fa-calendar-alt"></i>
                        <h3>Google Calendar</h3>
                        <p>Integrazione Google Calendar in sviluppo.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    getAutomazioneContent() {
        return `
            <div class="page-header">
                <h1><i class="fas fa-robot"></i> Automazione</h1>
                <button class="btn btn-primary" onclick="window.TribuApp.showScheduleModal()">
                    <i class="fas fa-clock"></i> Programma Invio
                </button>
            </div>
            
            <div class="card">
                <div class="automation-content">
                    <div class="empty-state">
                        <i class="fas fa-robot"></i>
                        <h3>Sistema Automazione</h3>
                        <p>Programmazione invii automatici in sviluppo.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    getWhatsAppContent() {
        return `
            <div class="page-header">
                <h1><i class="fab fa-whatsapp"></i> WhatsApp Templates</h1>
                <button class="btn btn-primary" onclick="window.TribuApp.showTemplateEditor()">
                    <i class="fas fa-edit"></i> Modifica Template
                </button>
            </div>
            
            <div class="card">
                <div class="whatsapp-content">
                    <div class="empty-state">
                        <i class="fab fa-whatsapp"></i>
                        <h3>WhatsApp Templates</h3>
                        <p>Gestione template messaggi in sviluppo.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    getImportContent() {
        return `
            <div class="page-header">
                <h1><i class="fas fa-upload"></i> Import CSV CSEN</h1>
                <p>Carica automaticamente i dati dei tesserati</p>
            </div>
            
            <div class="card">
                <h3>📂 Caricamento File CSV</h3>
                <p>Carica il file CSV esportato direttamente dal sistema CSEN.</p>
                
                <div class="file-upload">
                    <input type="file" id="csvFileInput" accept=".csv" class="hidden">
                    <label for="csvFileInput" class="file-upload-label">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Seleziona File CSV CSEN</span>
                    </label>
                </div>
                
                <div class="upload-info">
                    <h4>📊 Informazioni Import</h4>
                    <ul>
                        <li>Il file verrà caricato su Firebase</li>
                        <li>I dati esistenti verranno sostituiti</li>
                        <li>Calcolo automatico stati scadenza</li>
                        <li>Backup automatico su localStorage</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    initPageFunctionality(pageName) {
        switch (pageName) {
            case 'tesserati':
            case 'scadenze':
                this.initDataTable();
                break;
            case 'import':
                this.initCSVUpload();
                break;
        }
    }
    
    initDataTable() {
        // Setup filters
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Setup search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchData(e.target.value);
            });
        }
        
        // Initial data load
        this.updateDataTable();
    }
    
    initCSVUpload() {
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleCSVUpload(e);
            });
        }
    }
    
    async handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            this.toast?.loading('Caricamento CSV in corso...');
            
            const csvText = await this.readFileAsText(file);
            const parsedData = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                delimiter: ';',
                dynamicTyping: true
            });
            
            if (parsedData.errors.length > 0) {
                console.warn('CSV parsing warnings:', parsedData.errors);
            }
            
            const importedCount = await this.storage.importMembersFromCSV(parsedData.data);
            
            // Reload data
            await this.loadAllData();
            
            // Refresh current page if showing tesserati
            if (this.currentPage === 'tesserati' || this.currentPage === 'import') {
                this.showPage(this.currentPage);
            }
            
            this.toast?.success(`✅ Importati ${importedCount} tesserati da CSV`);
            
        } catch (error) {
            console.error('CSV import failed:', error);
            this.toast?.error('❌ Errore durante l\'import CSV');
        }
    }
    
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update UI
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.applyFilters();
    }
    
    searchData(searchTerm) {
        this.applyFilters(searchTerm);
    }
    
    applyFilters(searchTerm = '') {
        let filtered = [...this.tesseratiData];
        
        // Apply status filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(item => item.status === this.currentFilter);
        }
        
        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item => 
                item.nome?.toLowerCase().includes(term) ||
                item.cognome?.toLowerCase().includes(term) ||
                (item.telefono && item.telefono.includes(term))
            );
        }
        
        this.filteredData = filtered;
        this.updateDataTable();
    }
    
    updateDataTable() {
        const tableBody = document.getElementById('dataTableBody');
        if (!tableBody) return;
        
        if (this.filteredData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">
                        Nessun risultato trovato
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = this.filteredData.map(tesserato => this.renderTesseratoRow(tesserato)).join('');
    }
    
    renderTesseratoRow(tesserato) {
        const statusClass = `status-${tesserato.status}`;
        const statusText = this.getStatusText(tesserato.status);
        
        return `
            <tr>
                <td><strong>${tesserato.nome} ${tesserato.cognome}</strong></td>
                <td>${tesserato.telefono || tesserato.whatsapp || 'N/A'}</td>
                <td>${tesserato.dataScadenza ? new Date(tesserato.dataScadenza).toLocaleDateString('it-IT') : 'N/A'}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>${this.formatDaysToExpiry(tesserato.daysTillExpiry)}</td>
                <td>
                    <div class="action-buttons">
                        ${this.renderTesseratoActions(tesserato)}
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderTesseratoActions(tesserato) {
        let actions = '';
        
        // WhatsApp button for expired/expiring
        if (tesserato.telefono && (tesserato.status === 'expired' || tesserato.status === 'expiring')) {
            actions += `
                <button class="btn btn-sm whatsapp-btn" onclick="window.TribuApp.sendWhatsAppMessage('${tesserato.telefono}', '${tesserato.nome}', '${tesserato.cognome}')">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
            `;
        }
        
        // Status change buttons
        if (tesserato.status === 'expired' || tesserato.status === 'expiring' || tesserato.status === 'messagesent') {
            actions += `
                <button class="btn btn-sm btn-success" onclick="window.TribuApp.changeStatus('${tesserato.id}', 'renewed')">
                    <i class="fas fa-check"></i> Rinnovato
                </button>
            `;
        }
        
        if (tesserato.status === 'expired' || tesserato.status === 'expiring') {
            actions += `
                <button class="btn btn-sm btn-primary" onclick="window.TribuApp.changeStatus('${tesserato.id}', 'messagesent')">
                    <i class="fas fa-paper-plane"></i> Inviato
                </button>
            `;
        }
        
        // Delete button
        actions += `
            <button class="btn btn-sm btn-danger" onclick="window.TribuApp.deleteTesserato('${tesserato.id}')" title="Elimina tesserato">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        return actions;
    }
    
    getStatusText(status) {
        const statusMap = {
            active: '🟢 Attivo',
            expired: '🔴 Scaduto',
            expiring: '🟡 In Scadenza',
            messagesent: '📱 Messaggio Inviato',
            renewed: '✅ Rinnovato'
        };
        
        return statusMap[status] || status;
    }
    
    formatDaysToExpiry(days) {
        if (days === null) return 'N/A';
        if (days < 0) return `${Math.abs(days)} giorni fa`;
        return `${days} giorni`;
    }
    
    async changeStatus(memberId, newStatus) {
        try {
            await this.storage.updateMemberStatus(memberId, newStatus);
            
            // Update local data
            const member = this.tesseratiData.find(m => m.id === memberId);
            if (member) {
                member.status = newStatus;
            }
            
            // Refresh UI
            this.updateDataTable();
            this.updateNotificationBadges();
            
            this.toast?.success(`✅ Stato aggiornato a: ${this.getStatusText(newStatus)}`);
            
        } catch (error) {
            console.error('Error changing member status:', error);
            this.toast?.error('❌ Errore aggiornamento stato');
        }
    }
    
    async deleteTesserato(memberId) {
        const member = this.tesseratiData.find(m => m.id === memberId);
        if (!member) return;
        
        if (!confirm(`Sei sicuro di voler eliminare ${member.nome} ${member.cognome}?`)) {
            return;
        }
        
        try {
            await this.storage.deleteMember(memberId);
            
            // Remove from local data
            const index = this.tesseratiData.findIndex(m => m.id === memberId);
            if (index > -1) {
                this.tesseratiData.splice(index, 1);
            }
            
            // Refresh UI
            this.updateDataTable();
            this.updateNotificationBadges();
            
            this.toast?.success(`🗑️ ${member.nome} ${member.cognome} eliminato`);
            
        } catch (error) {
            console.error('Error deleting member:', error);
            this.toast?.error('❌ Errore eliminazione tesserato');
        }
    }
    
    sendWhatsAppMessage(telefono, nome, cognome) {
        const message = encodeURIComponent(`Ciao ${nome}! Il tuo tesseramento presso Tribù Personal Training è scaduto. Per rinnovarlo e continuare ad allenarti con noi, contattaci al più presto!`);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${telefono}&text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        this.toast?.success('📱 WhatsApp aperto!');
    }
    
    updateNotificationBadges() {
        // Update scadenze badge
        const expiredCount = this.tesseratiData.filter(t => t.status === 'expired' || t.status === 'expiring').length;
        const scadenzeBadge = document.getElementById('scadenzeBadge');
        if (scadenzeBadge) {
            if (expiredCount > 0) {
                scadenzeBadge.textContent = expiredCount;
                scadenzeBadge.style.display = 'flex';
            } else {
                scadenzeBadge.style.display = 'none';
            }
        }
    }
    
    setupDataRefresh() {
        // Refresh data every 5 minutes
        setInterval(async () => {
            try {
                await this.loadAllData();
                console.log('📊 Data refreshed automatically');
            } catch (error) {
                console.error('❌ Auto refresh failed:', error);
            }
        }, 5 * 60 * 1000);
    }
    
    initGoogleCalendar() {
        this.toast?.info('🔧 Integrazione Google Calendar in sviluppo');
    }
    
    showMainApp() {
        const loadingScreen = document.getElementById('loading-screen');
        const authContainer = document.getElementById('auth-container');
        const mainApp = document.getElementById('main-app');
        
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (authContainer) authContainer.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
    }
    
    showLoginScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const authContainer = document.getElementById('auth-container');
        const mainApp = document.getElementById('main-app');
        
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        if (authContainer) authContainer.classList.remove('hidden');
    }
    
    handleInitError(error) {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #1a1a2e; color: white; text-align: center; font-family: Arial, sans-serif;">
                <div>
                    <h1>❌ Errore Inizializzazione</h1>
                    <p>Si è verificato un errore durante l'avvio dell'applicazione.</p>
                    <p style="margin-top: 1rem; opacity: 0.7;">Ricarica la pagina per riprovare.</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #64ffda; color: #1a1a2e; border: none; border-radius: 4px; cursor: pointer;">
                        Ricarica Pagina
                    </button>
                </div>
            </div>
        `;
    }
    
    // Placeholder methods for future implementation
    showAddTesseratoModal() {
        this.toast?.info('🔧 Funzione aggiungi tesserato in sviluppo');
    }
    
    showAddMarketingClientModal() {
        this.toast?.info('🔧 Funzione marketing in sviluppo');
    }
    
    showScheduleModal() {
        this.toast?.info('🔧 Funzione automazione in sviluppo');
    }
    
    showTemplateEditor() {
        this.toast?.info('🔧 Editor template in sviluppo');
    }
};

// Initialize global app instance
window.App_Instance = new window.TribuApp();