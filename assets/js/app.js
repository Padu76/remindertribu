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
        
        // Google Calendar state
        this.isGoogleApiLoaded = false;
        this.isGoogleSignedIn = false;
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
                await this.initGoogleCalendar();
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
            
            // Initialize filteredData for tables
            this.filteredData = [...this.tesseratiData];
            
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
                <div class="marketing-stats">
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <div>
                            <div class="stat-number">${this.marketingClienti.length}</div>
                            <div class="stat-label">Clienti Marketing</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-paper-plane"></i>
                        <div>
                            <div class="stat-number">${this.scheduledMessages.filter(m => m.type === 'marketing').length}</div>
                            <div class="stat-label">Messaggi Programmati</div>
                        </div>
                    </div>
                </div>
                
                <div class="marketing-content">
                    <div id="marketingClientsList">
                        <!-- Populated by JavaScript -->
                    </div>
                </div>
            </div>
        `;
    }
    
    getCalendarioContent() {
        return `
            <div class="page-header">
                <h1><i class="fas fa-calendar-alt"></i> Google Calendar</h1>
                <div class="calendar-controls">
                    ${!this.isGoogleSignedIn ? `
                        <button class="btn btn-primary" onclick="window.TribuApp.signInGoogle()">
                            <i class="fab fa-google"></i> Connetti Calendar
                        </button>
                    ` : `
                        <button class="btn btn-success" disabled>
                            <i class="fas fa-check-circle"></i> Connesso
                        </button>
                        <button class="btn btn-secondary" onclick="window.TribuApp.loadCalendarEvents()">
                            <i class="fas fa-sync"></i> Aggiorna Eventi
                        </button>
                        <button class="btn btn-warning" onclick="window.TribuApp.signOutGoogle()">
                            <i class="fas fa-sign-out-alt"></i> Disconnetti
                        </button>
                    `}
                </div>
            </div>
            
            <div class="card">
                <div class="calendar-content">
                    <div id="calendarStatus" class="calendar-status">
                        ${this.isGoogleSignedIn ? 
                            '<i class="fas fa-check-circle text-success"></i> Google Calendar connesso' : 
                            '<i class="fas fa-exclamation-circle text-warning"></i> Connetti Google Calendar per visualizzare gli appuntamenti'
                        }
                    </div>
                    
                    <div id="calendarEvents" class="calendar-events">
                        <!-- Populated by JavaScript -->
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
                <div class="automation-stats">
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <div class="stat-number">${this.scheduledMessages.filter(m => m.status === 'scheduled').length}</div>
                            <div class="stat-label">Programmati</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-check"></i>
                        <div>
                            <div class="stat-number">${this.scheduledMessages.filter(m => m.status === 'sent').length}</div>
                            <div class="stat-label">Inviati</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-pause"></i>
                        <div>
                            <div class="stat-number">${this.scheduledMessages.filter(m => m.status === 'paused').length}</div>
                            <div class="stat-label">In Pausa</div>
                        </div>
                    </div>
                </div>
                
                <div class="automation-content">
                    <div id="scheduledMessagesList">
                        <!-- Populated by JavaScript -->
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
                <div class="template-categories">
                    <div class="template-category">
                        <h4><i class="fas fa-exclamation-triangle"></i> Scadenze</h4>
                        <div class="template-preview">
                            <p>Template per notifiche scadenza tesseramento</p>
                            <button class="btn btn-sm btn-outline" onclick="window.TribuApp.editTemplate('scadenza')">
                                <i class="fas fa-edit"></i> Modifica
                            </button>
                        </div>
                    </div>
                    
                    <div class="template-category">
                        <h4><i class="fas fa-utensils"></i> Pasti</h4>
                        <div class="template-preview">
                            <p>Template per consigli alimentari e ricette</p>
                            <button class="btn btn-sm btn-outline" onclick="window.TribuApp.editTemplate('pasti')">
                                <i class="fas fa-edit"></i> Modifica
                            </button>
                        </div>
                    </div>
                    
                    <div class="template-category">
                        <h4><i class="fas fa-heart"></i> Motivazionali</h4>
                        <div class="template-preview">
                            <p>Template per messaggi motivazionali</p>
                            <button class="btn btn-sm btn-outline" onclick="window.TribuApp.editTemplate('motivazionali')">
                                <i class="fas fa-edit"></i> Modifica
                            </button>
                        </div>
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
            case 'marketing':
                this.initMarketingPage();
                break;
            case 'calendario':
                this.initCalendarPage();
                break;
            case 'automazione':
                this.initAutomationPage();
                break;
            case 'whatsapp':
                this.initWhatsAppPage();
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
        
        // Initial data load - Apply current filter to populate table
        this.applyFilters();
    }
    
    initCSVUpload() {
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleCSVUpload(e);
            });
        }
    }
    
    initMarketingPage() {
        this.renderMarketingClients();
    }
    
    initCalendarPage() {
        if (this.isGoogleSignedIn) {
            this.renderCalendarEvents();
        }
    }
    
    initAutomationPage() {
        this.renderScheduledMessages();
    }
    
    initWhatsAppPage() {
        // Templates are already rendered in getWhatsAppContent
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
            this.applyFilters(); // This will update filteredData and call updateDataTable
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
    
    // Google Calendar Integration
    async initGoogleCalendar() {
        try {
            const googleConfig = window.AppConfig?.google;
            if (!googleConfig?.enabled || !googleConfig?.apiKey || !googleConfig?.clientId) {
                console.warn('⚠️ Google Calendar not properly configured');
                return;
            }
            
            // Load Google APIs
            await this.loadGoogleAPI();
            
            // Initialize gapi
            await new Promise((resolve) => {
                gapi.load('client:auth2', resolve);
            });
            
            // Initialize client
            await gapi.client.init({
                apiKey: googleConfig.apiKey,
                clientId: googleConfig.clientId,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                scope: 'https://www.googleapis.com/auth/calendar.readonly'
            });
            
            this.isGoogleApiLoaded = true;
            
            // Check if user is signed in
            const authInstance = gapi.auth2.getAuthInstance();
            this.isGoogleSignedIn = authInstance.isSignedIn.get();
            
            if (this.isGoogleSignedIn) {
                await this.loadCalendarEvents();
            }
            
            this.toast?.success('🔗 Google Calendar inizializzato');
            console.log('✅ Google Calendar API initialized');
            
        } catch (error) {
            console.error('❌ Google Calendar initialization failed:', error);
            this.toast?.error('❌ Errore inizializzazione Google Calendar');
        }
    }
    
    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    async signInGoogle() {
        if (!this.isGoogleApiLoaded) {
            this.toast?.warning('⚠️ Google API non ancora caricata');
            return;
        }
        
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signIn();
            
            this.isGoogleSignedIn = true;
            await this.loadCalendarEvents();
            
            // Refresh calendar page if showing
            if (this.currentPage === 'calendario') {
                this.showPage('calendario');
            }
            
            this.toast?.success('✅ Connesso a Google Calendar');
            
        } catch (error) {
            console.error('❌ Google sign-in failed:', error);
            this.toast?.error('❌ Errore connessione Google Calendar');
        }
    }
    
    async signOutGoogle() {
        if (!this.isGoogleApiLoaded) return;
        
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            
            this.isGoogleSignedIn = false;
            this.calendarEvents = [];
            
            // Refresh calendar page if showing
            if (this.currentPage === 'calendario') {
                this.showPage('calendario');
            }
            
            this.toast?.success('🔓 Disconnesso da Google Calendar');
            
        } catch (error) {
            console.error('❌ Google sign-out failed:', error);
            this.toast?.error('❌ Errore disconnessione Google Calendar');
        }
    }
    
    async loadCalendarEvents() {
        if (!this.isGoogleApiLoaded || !this.isGoogleSignedIn) {
            console.log('⚠️ Google API not ready or user not signed in');
            return;
        }
        
        try {
            const now = new Date();
            const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
            const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days future
            
            const response = await gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 50
            });
            
            const events = response.result.items || [];
            
            this.calendarEvents = events.map(event => ({
                id: event.id,
                title: event.summary || 'Evento senza titolo',
                description: event.description || '',
                start: new Date(event.start.dateTime || event.start.date),
                end: new Date(event.end.dateTime || event.end.date),
                location: event.location || '',
                attendees: event.attendees || []
            }));
            
            // Refresh calendar page if showing
            if (this.currentPage === 'calendario') {
                this.renderCalendarEvents();
            }
            
            this.toast?.success(`📅 Caricati ${events.length} eventi calendario`);
            console.log(`📅 Loaded ${events.length} calendar events`);
            
        } catch (error) {
            console.error('❌ Error loading calendar events:', error);
            this.toast?.error('❌ Errore caricamento eventi calendario');
        }
    }
    
    renderCalendarEvents() {
        const eventsContainer = document.getElementById('calendarEvents');
        if (!eventsContainer) return;
        
        if (this.calendarEvents.length === 0) {
            eventsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar"></i>
                    <h3>Nessun Evento</h3>
                    <p>Non ci sono eventi nel calendario.</p>
                </div>
            `;
            return;
        }
        
        eventsContainer.innerHTML = `
            <div class="events-list">
                ${this.calendarEvents.map(event => `
                    <div class="event-card">
                        <div class="event-date">
                            ${event.start.toLocaleDateString('it-IT')}
                        </div>
                        <div class="event-time">
                            ${event.start.toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}
                        </div>
                        <div class="event-details">
                            <h4>${event.title}</h4>
                            ${event.description ? `<p>${event.description}</p>` : ''}
                            ${event.location ? `<div class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>` : ''}
                        </div>
                        <div class="event-actions">
                            <button class="btn btn-sm btn-outline" onclick="window.TribuApp.createRemindersForEvent('${event.id}')">
                                <i class="fas fa-bell"></i> Crea Reminder
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    async createRemindersForEvent(eventId) {
        const event = this.calendarEvents.find(e => e.id === eventId);
        if (!event) return;
        
        this.toast?.info(`📅 Creazione reminder per: ${event.title}`);
        // Implementation for creating reminders based on calendar event
    }
    
    renderMarketingClients() {
        const clientsList = document.getElementById('marketingClientsList');
        if (!clientsList) return;
        
        if (this.marketingClienti.length === 0) {
            clientsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Nessun Cliente Marketing</h3>
                    <p>Aggiungi clienti per iniziare le campagne marketing.</p>
                    <button class="btn btn-primary" onclick="window.TribuApp.showAddMarketingClientModal()">
                        <i class="fas fa-user-plus"></i> Aggiungi Cliente
                    </button>
                </div>
            `;
            return;
        }
        
        clientsList.innerHTML = `
            <div class="clients-grid">
                ${this.marketingClienti.map(client => `
                    <div class="client-card">
                        <div class="client-info">
                            <h4>${client.nome} ${client.cognome}</h4>
                            <p><i class="fab fa-whatsapp"></i> ${client.telefono}</p>
                            <span class="client-category">${client.categoria || 'Standard'}</span>
                        </div>
                        <div class="client-actions">
                            <button class="btn btn-sm btn-primary" onclick="window.TribuApp.sendMarketingMessage('${client.id}')">
                                <i class="fas fa-paper-plane"></i> Invia
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="window.TribuApp.editMarketingClient('${client.id}')">
                                <i class="fas fa-edit"></i> Modifica
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderScheduledMessages() {
        const messagesList = document.getElementById('scheduledMessagesList');
        if (!messagesList) return;
        
        if (this.scheduledMessages.length === 0) {
            messagesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-robot"></i>
                    <h3>Nessun Messaggio Programmato</h3>
                    <p>Crea automazioni per inviare messaggi programmati.</p>
                    <button class="btn btn-primary" onclick="window.TribuApp.showScheduleModal()">
                        <i class="fas fa-clock"></i> Programma Invio
                    </button>
                </div>
            `;
            return;
        }
        
        messagesList.innerHTML = `
            <div class="messages-list">
                ${this.scheduledMessages.map(msg => `
                    <div class="message-card ${msg.status}">
                        <div class="message-header">
                            <h4>${msg.title || 'Messaggio Programmato'}</h4>
                            <span class="message-status status-${msg.status}">${this.getMessageStatusText(msg.status)}</span>
                        </div>
                        <div class="message-details">
                            <p><i class="fas fa-clock"></i> ${new Date(msg.scheduledAt).toLocaleString('it-IT')}</p>
                            <p><i class="fas fa-users"></i> ${msg.recipients?.length || 0} destinatari</p>
                        </div>
                        <div class="message-actions">
                            ${msg.status === 'scheduled' ? `
                                <button class="btn btn-sm btn-warning" onclick="window.TribuApp.pauseScheduledMessage('${msg.id}')">
                                    <i class="fas fa-pause"></i> Pausa
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="window.TribuApp.cancelScheduledMessage('${msg.id}')">
                                    <i class="fas fa-times"></i> Annulla
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline" onclick="window.TribuApp.viewScheduledMessage('${msg.id}')">
                                <i class="fas fa-eye"></i> Dettagli
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getMessageStatusText(status) {
        const statusMap = {
            scheduled: '⏰ Programmato',
            sent: '✅ Inviato',
            paused: '⏸️ In Pausa',
            cancelled: '❌ Annullato',
            failed: '🚫 Fallito'
        };
        return statusMap[status] || status;
    }
    
    // Modal implementations
    showAddTesseratoModal() {
        const modalHtml = `
            <div class="modal-overlay" id="addTesseratoModal" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> Nuovo Tesserato</h3>
                        <button class="modal-close" onclick="document.getElementById('addTesseratoModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="addTesseratoForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Nome *</label>
                                    <input type="text" name="nome" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Cognome *</label>
                                    <input type="text" name="cognome" class="form-control" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Telefono</label>
                                    <input type="tel" name="telefono" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Data Scadenza</label>
                                    <input type="date" name="dataScadenza" class="form-control">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" name="email" class="form-control">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('addTesseratoModal').remove()">Annulla</button>
                        <button type="button" class="btn btn-primary" onclick="window.TribuApp.saveTesserato()">Salva Tesserato</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    async saveTesserato() {
        const form = document.getElementById('addTesseratoForm');
        const formData = new FormData(form);
        
        const tesseratoData = {
            nome: formData.get('nome'),
            cognome: formData.get('cognome'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            dataScadenza: formData.get('dataScadenza')
        };
        
        try {
            await this.storage.addMember(tesseratoData);
            await this.loadAllData();
            
            // Refresh current page
            if (this.currentPage === 'tesserati') {
                this.showPage('tesserati');
            }
            
            document.getElementById('scheduleModal').remove();
            this.toast?.success('✅ Messaggio programmato con successo');
            
        } catch (error) {
            console.error('Error scheduling message:', error);
            this.toast?.error('❌ Errore programmazione messaggio');
        }
    }
    
    showTemplateEditor() {
        const modalHtml = `
            <div class="modal-overlay" id="templateEditorModal" onclick="this.remove()">
                <div class="modal-content large" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Editor Template WhatsApp</h3>
                        <button class="modal-close" onclick="document.getElementById('templateEditorModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="template-tabs">
                            <button class="tab-btn active" data-template="scadenza">Scadenze</button>
                            <button class="tab-btn" data-template="pasti">Pasti</button>
                            <button class="tab-btn" data-template="motivazionali">Motivazionali</button>
                        </div>
                        
                        <div class="template-editor">
                            <div class="template-variables">
                                <h4>Variabili Disponibili</h4>
                                <div class="variables-list">
                                    <span class="variable" onclick="window.TribuApp.insertVariable('{nome}')">{nome}</span>
                                    <span class="variable" onclick="window.TribuApp.insertVariable('{cognome}')">{cognome}</span>
                                    <span class="variable" onclick="window.TribuApp.insertVariable('{giorni}')">{giorni}</span>
                                    <span class="variable" onclick="window.TribuApp.insertVariable('{data_scadenza}')">{data_scadenza}</span>
                                </div>
                            </div>
                            
                            <div class="template-content">
                                <label>Template Messaggio</label>
                                <textarea id="templateTextarea" class="form-control template-textarea" rows="8"></textarea>
                                <div class="template-preview">
                                    <h5>Anteprima</h5>
                                    <div id="templatePreview" class="preview-content"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('templateEditorModal').remove()">Annulla</button>
                        <button type="button" class="btn btn-primary" onclick="window.TribuApp.saveTemplate()">Salva Template</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Setup tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadTemplate(e.target.dataset.template);
            });
        });
        
        // Setup textarea monitoring for preview
        const textarea = document.getElementById('templateTextarea');
        textarea.addEventListener('input', () => {
            this.updateTemplatePreview();
        });
        
        // Load initial template
        this.loadTemplate('scadenza');
    }
    
    loadTemplate(templateType) {
        const textarea = document.getElementById('templateTextarea');
        const defaultTemplates = {
            scadenza: `Ciao {nome}! 
Il tuo tesseramento presso Tribù Personal Training scadrà tra {giorni} giorni ({data_scadenza}). 
Per rinnovarlo e continuare il tuo percorso di allenamento, contattaci al più presto!`,
            pasti: `Ciao {nome}! 
Ecco alcuni consigli per una sana alimentazione:
- Inizia la giornata con una colazione proteica
- Non saltare mai i pasti
- Bevi almeno 2 litri d'acqua al giorno
Continua così, sei sulla strada giusta!`,
            motivazionali: `Ciao {nome}! 
Ricorda: ogni piccolo passo conta nel tuo percorso di crescita.
La costanza è la chiave del successo!
Il team di Tribù Personal Training crede in te. 💪`
        };
        
        const currentTemplate = this.templates[templateType] || defaultTemplates[templateType];
        textarea.value = currentTemplate;
        this.updateTemplatePreview();
    }
    
    insertVariable(variable) {
        const textarea = document.getElementById('templateTextarea');
        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(textarea.selectionEnd);
        
        textarea.value = textBefore + variable + textAfter;
        textarea.focus();
        textarea.setSelectionRange(cursorPos + variable.length, cursorPos + variable.length);
        
        this.updateTemplatePreview();
    }
    
    updateTemplatePreview() {
        const textarea = document.getElementById('templateTextarea');
        const preview = document.getElementById('templatePreview');
        
        // Replace variables with example values
        let previewText = textarea.value
            .replace(/\{nome\}/g, 'Mario')
            .replace(/\{cognome\}/g, 'Rossi')
            .replace(/\{giorni\}/g, '15')
            .replace(/\{data_scadenza\}/g, '31/12/2024');
        
        preview.innerHTML = previewText.replace(/\n/g, '<br>');
    }
    
    saveTemplate() {
        const activeTab = document.querySelector('.tab-btn.active');
        const templateType = activeTab.dataset.template;
        const templateText = document.getElementById('templateTextarea').value;
        
        this.templates[templateType] = templateText;
        this.storage.saveTemplate(templateType, templateText);
        
        document.getElementById('templateEditorModal').remove();
        this.toast?.success('✅ Template salvato con successo');
    }
    
    editTemplate(templateType) {
        this.showTemplateEditor();
        // Wait for modal to be created, then switch to correct tab
        setTimeout(() => {
            const targetTab = document.querySelector(`[data-template="${templateType}"]`);
            if (targetTab) {
                targetTab.click();
            }
        }, 100);
    }
    
    // Additional helper methods
    async sendMarketingMessage(clientId) {
        const client = this.marketingClienti.find(c => c.id === clientId);
        if (!client) return;
        
        this.toast?.info(`📱 Apertura WhatsApp per ${client.nome} ${client.cognome}`);
        
        const message = encodeURIComponent(`Ciao ${client.nome}! Messaggio di marketing personalizzato da Tribù Personal Training.`);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${client.telefono}&text=${message}`;
        window.open(whatsappUrl, '_blank');
    }
    
    async editMarketingClient(clientId) {
        this.toast?.info('🔧 Funzione modifica cliente in sviluppo');
    }
    
    async pauseScheduledMessage(messageId) {
        try {
            await this.storage.updateScheduledMessageStatus(messageId, 'paused');
            
            const message = this.scheduledMessages.find(m => m.id === messageId);
            if (message) {
                message.status = 'paused';
            }
            
            this.renderScheduledMessages();
            this.toast?.success('⏸️ Messaggio messo in pausa');
            
        } catch (error) {
            console.error('Error pausing message:', error);
            this.toast?.error('❌ Errore pausa messaggio');
        }
    }
    
    async cancelScheduledMessage(messageId) {
        if (!confirm('Sei sicuro di voler annullare questo messaggio programmato?')) {
            return;
        }
        
        try {
            await this.storage.deleteScheduledMessage(messageId);
            
            const index = this.scheduledMessages.findIndex(m => m.id === messageId);
            if (index > -1) {
                this.scheduledMessages.splice(index, 1);
            }
            
            this.renderScheduledMessages();
            this.toast?.success('❌ Messaggio annullato');
            
        } catch (error) {
            console.error('Error cancelling message:', error);
            this.toast?.error('❌ Errore annullamento messaggio');
        }
    }
    
    async viewScheduledMessage(messageId) {
        const message = this.scheduledMessages.find(m => m.id === messageId);
        if (!message) return;
        
        const modalHtml = `
            <div class="modal-overlay" id="viewMessageModal" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3><i class="fas fa-eye"></i> Dettagli Messaggio</h3>
                        <button class="modal-close" onclick="document.getElementById('viewMessageModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="message-details">
                            <h4>${message.title || 'Messaggio Programmato'}</h4>
                            <p><strong>Stato:</strong> ${this.getMessageStatusText(message.status)}</p>
                            <p><strong>Programmato per:</strong> ${new Date(message.scheduledAt).toLocaleString('it-IT')}</p>
                            <p><strong>Ricorrenza:</strong> ${message.recurrence || 'Nessuna'}</p>
                            <p><strong>Destinatari:</strong> ${message.recipients?.join(', ') || 'Nessuno'}</p>
                            <p><strong>Template:</strong> ${message.template}</p>
                            ${message.customMessage ? `<div class="custom-message"><strong>Messaggio:</strong><br>${message.customMessage}</div>` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('viewMessageModal').remove()">Chiudi</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
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
};

// Initialize global app instance
window.App_Instance = new window.TribuApp();d('addTesseratoModal').remove();
            this.toast?.success('✅ Tesserato aggiunto con successo');
            
        } catch (error) {
            console.error('Error adding member:', error);
            this.toast?.error('❌ Errore aggiunta tesserato');
        }
    }
    
    showAddMarketingClientModal() {
        const modalHtml = `
            <div class="modal-overlay" id="addMarketingClientModal" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3><i class="fas fa-bullhorn"></i> Nuovo Cliente Marketing</h3>
                        <button class="modal-close" onclick="document.getElementById('addMarketingClientModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="addMarketingClientForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Nome *</label>
                                    <input type="text" name="nome" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Cognome *</label>
                                    <input type="text" name="cognome" class="form-control" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Telefono *</label>
                                    <input type="tel" name="telefono" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Categoria</label>
                                    <select name="categoria" class="form-control">
                                        <option value="standard">Standard</option>
                                        <option value="premium">Premium</option>
                                        <option value="vip">VIP</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Interessi</label>
                                <div class="checkbox-group">
                                    <label><input type="checkbox" name="interessi" value="pasti"> Consigli Alimentari</label>
                                    <label><input type="checkbox" name="interessi" value="motivazionali"> Messaggi Motivazionali</label>
                                    <label><input type="checkbox" name="interessi" value="offerte"> Offerte Speciali</label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('addMarketingClientModal').remove()">Annulla</button>
                        <button type="button" class="btn btn-primary" onclick="window.TribuApp.saveMarketingClient()">Salva Cliente</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    async saveMarketingClient() {
        const form = document.getElementById('addMarketingClientForm');
        const formData = new FormData(form);
        
        // Get selected interests
        const interessiCheckboxes = form.querySelectorAll('input[name="interessi"]:checked');
        const interessi = Array.from(interessiCheckboxes).map(cb => cb.value);
        
        const clientData = {
            nome: formData.get('nome'),
            cognome: formData.get('cognome'),
            telefono: formData.get('telefono'),
            categoria: formData.get('categoria'),
            interessi: interessi,
            dateAdded: new Date().toISOString()
        };
        
        try {
            await this.storage.addMarketingClient(clientData);
            await this.loadAllData();
            
            // Refresh current page
            if (this.currentPage === 'marketing') {
                this.showPage('marketing');
            }
            
            document.getElementById('addMarketingClientModal').remove();
            this.toast?.success('✅ Cliente marketing aggiunto con successo');
            
        } catch (error) {
            console.error('Error adding marketing client:', error);
            this.toast?.error('❌ Errore aggiunta cliente marketing');
        }
    }
    
    showScheduleModal() {
        const modalHtml = `
            <div class="modal-overlay" id="scheduleModal" onclick="this.remove()">
                <div class="modal-content large" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3><i class="fas fa-clock"></i> Programma Invio</h3>
                        <button class="modal-close" onclick="document.getElementById('scheduleModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="scheduleForm">
                            <div class="form-group">
                                <label>Titolo Campagna</label>
                                <input type="text" name="title" class="form-control" placeholder="Es: Reminder Scadenze Settimanali">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Data e Ora Invio</label>
                                    <input type="datetime-local" name="scheduledAt" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Ricorrenza</label>
                                    <select name="recurrence" class="form-control">
                                        <option value="none">Nessuna</option>
                                        <option value="daily">Giornaliera</option>
                                        <option value="weekly">Settimanale</option>
                                        <option value="monthly">Mensile</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Destinatari</label>
                                <div class="checkbox-group">
                                    <label><input type="checkbox" name="recipients" value="expired"> Tesserati Scaduti</label>
                                    <label><input type="checkbox" name="recipients" value="expiring"> In Scadenza</label>
                                    <label><input type="checkbox" name="recipients" value="marketing"> Clienti Marketing</label>
                                    <label><input type="checkbox" name="recipients" value="all"> Tutti i Tesserati</label>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Template Messaggio</label>
                                <select name="template" class="form-control">
                                    <option value="scadenza">Reminder Scadenza</option>
                                    <option value="pasti">Consigli Alimentari</option>
                                    <option value="motivazionale">Messaggio Motivazionale</option>
                                    <option value="custom">Messaggio Personalizzato</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="customMessageGroup" style="display: none;">
                                <label>Messaggio Personalizzato</label>
                                <textarea name="customMessage" class="form-control" rows="4" placeholder="Scrivi il tuo messaggio personalizzato..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('scheduleModal').remove()">Annulla</button>
                        <button type="button" class="btn btn-primary" onclick="window.TribuApp.saveScheduledMessage()">Programma Invio</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Setup template change handler
        const templateSelect = document.querySelector('#scheduleModal select[name="template"]');
        const customMessageGroup = document.getElementById('customMessageGroup');
        
        templateSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customMessageGroup.style.display = 'block';
            } else {
                customMessageGroup.style.display = 'none';
            }
        });
    }
    
    async saveScheduledMessage() {
        const form = document.getElementById('scheduleForm');
        const formData = new FormData(form);
        
        // Get selected recipients
        const recipientCheckboxes = form.querySelectorAll('input[name="recipients"]:checked');
        const recipients = Array.from(recipientCheckboxes).map(cb => cb.value);
        
        const messageData = {
            title: formData.get('title'),
            scheduledAt: formData.get('scheduledAt'),
            recurrence: formData.get('recurrence'),
            recipients: recipients,
            template: formData.get('template'),
            customMessage: formData.get('customMessage'),
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };
        
        try {
            await this.storage.addScheduledMessage(messageData);
            await this.loadAllData();
            
            // Refresh current page
            if (this.currentPage === 'automazione') {
                this.showPage('automazione');
            }
            
            document.getElementByI