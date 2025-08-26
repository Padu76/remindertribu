/**
 * Storage Module - Firebase/LocalStorage Hybrid
 * Primary: Firebase Firestore for members, reminders
 * Fallback: LocalStorage for offline functionality
 */

window.TribuStorage = class {
    constructor() {
        this.firebase = null;
        this.isInitialized = false;
        this.useFirebase = false;
    }
    
    async init() {
        try {
            console.log('💾 Initializing TribuStorage module...');
            
            // Try to initialize Firebase first
            if (window.Firebase_Instance) {
                const firebaseReady = await window.Firebase_Instance.init();
                if (firebaseReady) {
                    this.firebase = window.Firebase_Instance;
                    this.useFirebase = true;
                    console.log('✅ Firebase storage enabled');
                } else {
                    console.warn('⚠️ Firebase failed, falling back to localStorage');
                    this.useFirebase = false;
                }
            } else {
                console.warn('⚠️ Firebase not available, using localStorage only');
                this.useFirebase = false;
            }
            
            this.isInitialized = true;
            console.log('✅ TribuStorage module initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ TribuStorage initialization failed:', error);
            this.useFirebase = false;
            return false;
        }
    }
    
    // CSEN Members Management
    async getMembers() {
        try {
            if (this.useFirebase && this.firebase?.isReady()) {
                // Get from Firebase
                return await this.firebase.getMembers();
            } else {
                // Fallback to localStorage
                return this.getMembersFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ Error getting members:', error);
            // Fallback to localStorage on error
            return this.getMembersFromLocalStorage();
        }
    }
    
    getMembersFromLocalStorage() {
        try {
            const stored = localStorage.getItem('tribu_tesserati');
            const members = stored ? JSON.parse(stored) : [];
            
            // Process dates and calculate status
            return members.map(member => ({
                ...member,
                dataScadenza: member.dataScadenza ? new Date(member.dataScadenza) : null,
                status: this.calculateMemberStatus(member.dataScadenza),
                daysTillExpiry: this.calculateDaysToExpiry(member.dataScadenza)
            }));
        } catch (error) {
            console.error('❌ Error loading members from localStorage:', error);
            return [];
        }
    }
    
    async updateMemberStatus(memberId, newStatus) {
        try {
            if (this.useFirebase && this.firebase?.isReady()) {
                // Update in Firebase
                await this.firebase.updateMemberStatus(memberId, newStatus);
            }
            
            // Also update localStorage for consistency
            const members = this.getMembersFromLocalStorage();
            const memberIndex = members.findIndex(m => m.id === memberId || m.firebaseId === memberId);
            
            if (memberIndex !== -1) {
                members[memberIndex].status = newStatus;
                members[memberIndex].updatedAt = new Date().toISOString();
                localStorage.setItem('tribu_tesserati', JSON.stringify(members));
            }
            
            console.log(`✅ Member ${memberId} status updated to: ${newStatus}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error updating member status:', error);
            throw error;
        }
    }
    
    async addMember(memberData) {
        try {
            let newMember;
            
            if (this.useFirebase && this.firebase?.isReady()) {
                // Add to Firebase
                newMember = await this.firebase.addMember(memberData);
            } else {
                // Add to localStorage
                newMember = {
                    id: this.generateId(),
                    ...memberData,
                    createdAt: new Date().toISOString(),
                    status: 'active'
                };
                
                const members = this.getMembersFromLocalStorage();
                members.push(newMember);
                localStorage.setItem('tribu_tesserati', JSON.stringify(members));
            }
            
            console.log('✅ New member added:', newMember.nome, newMember.cognome);
            return newMember;
            
        } catch (error) {
            console.error('❌ Error adding member:', error);
            throw error;
        }
    }
    
    async deleteMember(memberId) {
        try {
            // Remove from localStorage
            const members = this.getMembersFromLocalStorage();
            const filteredMembers = members.filter(m => m.id !== memberId && m.firebaseId !== memberId);
            localStorage.setItem('tribu_tesserati', JSON.stringify(filteredMembers));
            
            // TODO: Add Firebase deletion when needed
            // if (this.useFirebase && this.firebase?.isReady()) {
            //     await this.firebase.deleteMember(memberId);
            // }
            
            console.log('🗑️ Member deleted');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting member:', error);
            throw error;
        }
    }
    
    // CSV Import Management
    async importMembersFromCSV(csvData) {
        try {
            console.log(`📊 Starting import of ${csvData.length} members...`);
            
            let importedCount = 0;
            
            if (this.useFirebase && this.firebase?.isReady()) {
                // Import to Firebase
                importedCount = await this.firebase.importMembersFromCSV(csvData);
            }
            
            // Also save to localStorage for offline access
            const processedMembers = csvData.map(row => ({
                id: this.generateId(),
                associazione: row.ASSOCIAZIONE || "tribu personal training asd",
                cognome: row.COGNOME?.toUpperCase() || "",
                nome: row.NOME?.toUpperCase() || "",
                telefono: row.TELEFONO || "",
                whatsapp: row.TELEFONO || "",
                email: row['E-MAIL'] || "",
                numeroTessera: row['NUMERO TESSERA'] || "",
                dataScadenza: this.parseCSVDate(row['DATA DI RILASCIO']),
                status: 'active',
                importedAt: new Date().toISOString()
            }));
            
            localStorage.setItem('tribu_tesserati', JSON.stringify(processedMembers));
            
            console.log(`✅ CSV import completed: ${importedCount} members`);
            return importedCount;
            
        } catch (error) {
            console.error('❌ CSV import failed:', error);
            throw error;
        }
    }
    
    // Marketing Clients Management
    async getMarketingClients() {
        try {
            if (this.useFirebase && this.firebase?.isReady()) {
                return await this.firebase.getMarketingClients();
            } else {
                const stored = localStorage.getItem('tribu_marketing');
                return stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            console.error('❌ Error getting marketing clients:', error);
            return [];
        }
    }
    
    async addMarketingClient(clientData) {
        try {
            const client = {
                id: this.generateId(),
                ...clientData,
                createdAt: new Date().toISOString()
            };
            
            const clients = await this.getMarketingClients();
            clients.push(client);
            localStorage.setItem('tribu_marketing', JSON.stringify(clients));
            
            console.log('✅ Marketing client added:', client.nome);
            return client;
            
        } catch (error) {
            console.error('❌ Error adding marketing client:', error);
            throw error;
        }
    }
    
    async deleteMarketingClient(clientId) {
        try {
            const clients = await this.getMarketingClients();
            const filtered = clients.filter(c => c.id !== clientId);
            localStorage.setItem('tribu_marketing', JSON.stringify(filtered));
            
            console.log('🗑️ Marketing client deleted');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting marketing client:', error);
            throw error;
        }
    }
    
    // Reminders Management
    async getReminders() {
        try {
            if (this.useFirebase && this.firebase?.isReady()) {
                return await this.firebase.getReminders();
            } else {
                const stored = localStorage.getItem('tribu_reminders');
                return stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            console.error('❌ Error getting reminders:', error);
            return [];
        }
    }
    
    async addReminder(reminderData) {
        try {
            let newReminder;
            
            if (this.useFirebase && this.firebase?.isReady()) {
                newReminder = await this.firebase.addReminder(reminderData);
            } else {
                newReminder = {
                    id: this.generateId(),
                    ...reminderData,
                    createdAt: new Date().toISOString(),
                    status: 'scheduled'
                };
                
                const reminders = await this.getReminders();
                reminders.push(newReminder);
                localStorage.setItem('tribu_reminders', JSON.stringify(reminders));
            }
            
            console.log('✅ Reminder added:', newReminder.name);
            return newReminder;
            
        } catch (error) {
            console.error('❌ Error adding reminder:', error);
            throw error;
        }
    }
    
    // Templates Management
    getTemplates() {
        try {
            const stored = localStorage.getItem('tribu_templates');
            return stored ? JSON.parse(stored) : window.AppConfig?.whatsapp?.templates || {};
        } catch (error) {
            console.error('❌ Error getting templates:', error);
            return window.AppConfig?.whatsapp?.templates || {};
        }
    }
    
    saveTemplate(templateKey, templateContent) {
        try {
            const templates = this.getTemplates();
            templates[templateKey] = templateContent;
            localStorage.setItem('tribu_templates', JSON.stringify(templates));
            
            console.log('✅ Template saved:', templateKey);
            return true;
            
        } catch (error) {
            console.error('❌ Error saving template:', error);
            return false;
        }
    }
    
    // Calendar Events (Google Calendar integration)
    saveCalendarEvents(events) {
        try {
            localStorage.setItem('tribu_calendar_events', JSON.stringify(events));
            console.log(`📅 Saved ${events.length} calendar events`);
        } catch (error) {
            console.error('❌ Error saving calendar events:', error);
        }
    }
    
    getCalendarEvents() {
        try {
            const stored = localStorage.getItem('tribu_calendar_events');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('❌ Error getting calendar events:', error);
            return [];
        }
    }
    
    // Statistics and Analytics
    updateStats(statsData) {
        try {
            const currentStats = this.getStats();
            const updatedStats = {
                ...currentStats,
                ...statsData,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('tribu_stats', JSON.stringify(updatedStats));
            return updatedStats;
        } catch (error) {
            console.error('❌ Error updating stats:', error);
            return null;
        }
    }
    
    getStats() {
        try {
            const stored = localStorage.getItem('tribu_stats');
            return stored ? JSON.parse(stored) : {
                totalMembers: 0,
                expiredMembers: 0,
                messagesSent: 0,
                remindersCreated: 0,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error getting stats:', error);
            return {};
        }
    }
    
    // Helper Methods
    calculateMemberStatus(dataScadenza) {
        if (!dataScadenza) return 'active';
        
        const today = new Date();
        const expiryDate = new Date(dataScadenza);
        const daysDiff = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 0) return 'expired';
        if (daysDiff <= 30) return 'expiring';
        return 'active';
    }
    
    calculateDaysToExpiry(dataScadenza) {
        if (!dataScadenza) return null;
        
        const today = new Date();
        const expiryDate = new Date(dataScadenza);
        return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    }
    
    parseCSVDate(dateString) {
        if (!dateString) return null;
        
        // Handle DD/MM/YYYY format from CSV
        const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
            const year = match[3];
            const nextYear = parseInt(year) + 1; // Add 1 year for expiry
            return new Date(`${nextYear}-${match[2]}-${match[1]}T00:00:00.000Z`);
        }
        
        return null;
    }
    
    generateId() {
        return 'tribu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Data Export/Import
    async exportAllData() {
        try {
            const data = {
                members: await this.getMembers(),
                marketingClients: await this.getMarketingClients(),
                reminders: await this.getReminders(),
                templates: this.getTemplates(),
                stats: this.getStats(),
                calendarEvents: this.getCalendarEvents(),
                exportDate: new Date().toISOString(),
                version: window.AppConfig?.app?.version || '2.0.0'
            };
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            throw error;
        }
    }
    
    // Status Methods
    getConnectionStatus() {
        return {
            firebase: this.useFirebase && this.firebase?.isReady(),
            localStorage: typeof Storage !== 'undefined'
        };
    }
    
    isReady() {
        return this.isInitialized;
    }
};

// Initialize Storage instance
window.Storage_Instance = new window.TribuStorage();