/**
 * Storage Module - Conflict Free Version
 * Handles all data persistence, user profiles, contacts, reminders, and stats
 */

// Use unique namespace to avoid conflicts
window.RemindProStorage = class {
    constructor() {
        this.isInitialized = false;
        this.demoDataGenerated = false;
    }
    
    async init() {
        try {
            console.log('💾 Initializing RemindProStorage module...');
            
            // Generate demo data if in demo mode and not already generated
            if (window.AppConfig?.demo?.enabled && window.AppConfig.demo.sampleData.generateContacts) {
                this.generateDemoDataIfNeeded();
            }
            
            this.isInitialized = true;
            console.log('✅ RemindProStorage module initialized');
        } catch (error) {
            console.error('❌ RemindProStorage module initialization failed:', error);
        }
    }
    
    // User Management
    setCurrentUser(userData) {
        try {
            const storageKey = window.AppConfig?.storage?.keys?.user || 'remindpro_user';
            localStorage.setItem(storageKey, JSON.stringify(userData));
            console.log('👤 User data saved');
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }
    
    getCurrentUser() {
        try {
            const storageKey = window.AppConfig?.storage?.keys?.user || 'remindpro_user';
            const userData = localStorage.getItem(storageKey);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Failed to load user data:', error);
            return null;
        }
    }
    
    clearCurrentUser() {
        const keys = window.AppConfig?.storage?.keys || {};
        localStorage.removeItem(keys.user || 'remindpro_user');
        localStorage.removeItem(keys.profile || 'remindpro_profile');
    }
    
    // Profile Management
    async setUserProfile(profileData) {
        try {
            const profile = {
                ...profileData,
                updatedAt: new Date().toISOString()
            };
            const storageKey = window.AppConfig?.storage?.keys?.profile || 'remindpro_profile';
            localStorage.setItem(storageKey, JSON.stringify(profile));
            console.log('📋 Profile saved');
            return profile;
        } catch (error) {
            console.error('Failed to save profile:', error);
            throw error;
        }
    }
    
    getUserProfile() {
        try {
            const storageKey = window.AppConfig?.storage?.keys?.profile || 'remindpro_profile';
            const profile = localStorage.getItem(storageKey);
            return profile ? JSON.parse(profile) : null;
        } catch (error) {
            console.error('Failed to load profile:', error);
            return null;
        }
    }
    
    // Contacts Management
    async addContact(contactData) {
        try {
            const contacts = this.getContacts();
            
            // Generate ID
            const contact = {
                id: this.generateId(),
                name: contactData.name,
                phone: this.normalizePhone(contactData.phone),
                email: contactData.email || '',
                tags: Array.isArray(contactData.tags) ? contactData.tags : [],
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            contacts.push(contact);
            const storageKey = window.AppConfig?.storage?.keys?.contacts || 'remindpro_contacts';
            localStorage.setItem(storageKey, JSON.stringify(contacts));
            
            console.log('👥 Contact added:', contact.name);
            return contact;
        } catch (error) {
            console.error('Failed to add contact:', error);
            throw error;
        }
    }
    
    getContacts() {
        try {
            const storageKey = window.AppConfig?.storage?.keys?.contacts || 'remindpro_contacts';
            const contacts = localStorage.getItem(storageKey);
            return contacts ? JSON.parse(contacts) : [];
        } catch (error) {
            console.error('Failed to load contacts:', error);
            return [];
        }
    }
    
    async updateContact(contactId, updateData) {
        try {
            const contacts = this.getContacts();
            const contactIndex = contacts.findIndex(c => c.id === contactId);
            
            if (contactIndex === -1) {
                throw new Error('Contact not found');
            }
            
            contacts[contactIndex] = {
                ...contacts[contactIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            const storageKey = window.AppConfig?.storage?.keys?.contacts || 'remindpro_contacts';
            localStorage.setItem(storageKey, JSON.stringify(contacts));
            return contacts[contactIndex];
        } catch (error) {
            console.error('Failed to update contact:', error);
            throw error;
        }
    }
    
    async deleteContact(contactId) {
        try {
            const contacts = this.getContacts();
            const filteredContacts = contacts.filter(c => c.id !== contactId);
            const storageKey = window.AppConfig?.storage?.keys?.contacts || 'remindpro_contacts';
            localStorage.setItem(storageKey, JSON.stringify(filteredContacts));
            console.log('🗑️ Contact deleted');
        } catch (error) {
            console.error('Failed to delete contact:', error);
            throw error;
        }
    }
    
    normalizePhone(phone) {
        // Remove all non-numeric characters except +
        let normalized = phone.replace(/[^\d+]/g, '');
        
        // Ensure it starts with + if it doesn't have country code
        if (!normalized.startsWith('+')) {
            normalized = '+39' + normalized; // Default to Italy
        }
        
        return normalized;
    }
    
    // Reminders Management
    async addReminder(reminderData) {
        try {
            const reminders = this.getReminders();
            
            const reminder = {
                id: this.generateId(),
                name: reminderData.name,
                type: reminderData.type || 'once',
                date: reminderData.date,
                time: reminderData.time,
                message: reminderData.message,
                target: reminderData.target || 'all',
                recurring: reminderData.recurring || null,
                status: 'active',
                totalSent: 0,
                lastSent: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            reminders.push(reminder);
            const storageKey = window.AppConfig?.storage?.keys?.reminders || 'remindpro_reminders';
            localStorage.setItem(storageKey, JSON.stringify(reminders));
            
            console.log('⏰ Reminder added:', reminder.name);
            return reminder;
        } catch (error) {
            console.error('Failed to add reminder:', error);
            throw error;
        }
    }
    
    getReminders() {
        try {
            const storageKey = window.AppConfig?.storage?.keys?.reminders || 'remindpro_reminders';
            const reminders = localStorage.getItem(storageKey);
            return reminders ? JSON.parse(reminders) : [];
        } catch (error) {
            console.error('Failed to load reminders:', error);
            return [];
        }
    }
    
    async updateReminder(reminderId, updateData) {
        try {
            const reminders = this.getReminders();
            const reminderIndex = reminders.findIndex(r => r.id === reminderId);
            
            if (reminderIndex === -1) {
                throw new Error('Reminder not found');
            }
            
            reminders[reminderIndex] = {
                ...reminders[reminderIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            const storageKey = window.AppConfig?.storage?.keys?.reminders || 'remindpro_reminders';
            localStorage.setItem(storageKey, JSON.stringify(reminders));
            return reminders[reminderIndex];
        } catch (error) {
            console.error('Failed to update reminder:', error);
            throw error;
        }
    }
    
    async deleteReminder(reminderId) {
        try {
            const reminders = this.getReminders();
            const filteredReminders = reminders.filter(r => r.id !== reminderId);
            const storageKey = window.AppConfig?.storage?.keys?.reminders || 'remindpro_reminders';
            localStorage.setItem(storageKey, JSON.stringify(filteredReminders));
            console.log('🗑️ Reminder deleted');
        } catch (error) {
            console.error('Failed to delete reminder:', error);
            throw error;
        }
    }
    
    // Statistics Management
    async updateStats(newStats) {
        try {
            const currentStats = this.getUserStats() || {};
            const updatedStats = {
                ...currentStats,
                ...newStats,
                lastUpdated: new Date().toISOString()
            };
            
            const storageKey = window.AppConfig?.storage?.keys?.stats || 'remindpro_stats';
            localStorage.setItem(storageKey, JSON.stringify(updatedStats));
            return updatedStats;
        } catch (error) {
            console.error('Failed to update stats:', error);
            throw error;
        }
    }
    
    getUserStats() {
        try {
            const storageKey = window.AppConfig?.storage?.keys?.stats || 'remindpro_stats';
            const stats = localStorage.getItem(storageKey);
            return stats ? JSON.parse(stats) : {
                messagesSent: 0,
                contactsAdded: 0,
                remindersCreated: 0,
                lastLogin: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to load stats:', error);
            return {};
        }
    }
    
    // Demo Data Generation
    generateDemoDataIfNeeded() {
        if (this.demoDataGenerated) return;
        
        try {
            // Check if data already exists
            const existingContacts = this.getContacts();
            const existingReminders = this.getReminders();
            
            if (existingContacts.length === 0 && window.AppConfig?.demo?.sampleData?.generateContacts) {
                this.generateDemoContacts();
            }
            
            if (existingReminders.length === 0 && window.AppConfig?.demo?.sampleData?.generateReminders) {
                this.generateDemoReminders();
            }
            
            this.demoDataGenerated = true;
            console.log('📝 Demo data generated');
        } catch (error) {
            console.error('Failed to generate demo data:', error);
        }
    }
    
    generateDemoContacts() {
        const demoContacts = [
            {
                name: 'Mario Rossi',
                phone: '+39 347 123 4567',
                email: 'mario.rossi@email.com',
                tags: ['cliente', 'vip']
            },
            {
                name: 'Giulia Bianchi',
                phone: '+39 338 987 6543',
                email: 'giulia.bianchi@email.com',
                tags: ['prospect', 'milano']
            },
            {
                name: 'Luca Verdi',
                phone: '+39 333 555 7777',
                email: 'luca.verdi@email.com',
                tags: ['cliente', 'roma']
            },
            {
                name: 'Anna Ferrari',
                phone: '+39 320 111 2222',
                email: 'anna.ferrari@email.com',
                tags: ['vip', 'fidelizzato']
            }
        ];
        
        demoContacts.forEach(contactData => {
            this.addContact(contactData);
        });
    }
    
    generateDemoReminders() {
        const demoReminders = [
            {
                name: 'Reminder Ordine Settimanale',
                type: 'recurring',
                date: this.getTomorrowDate(),
                time: '10:00',
                message: '🥗 Ciao {nome}! È giovedì, ricordati di ordinare i pasti per la settimana da FreshMeals! 👨‍🍳',
                target: 'all',
                recurring: 'weekly'
            },
            {
                name: 'Follow-up Clienti VIP',
                type: 'recurring',
                date: this.getTomorrowDate(),
                time: '15:00',
                message: '⭐ Ciao {nome}! Come va? Abbiamo novità interessanti per i nostri clienti VIP. Ti va di sentirci? 😊',
                target: 'segment',
                recurring: 'monthly'
            }
        ];
        
        demoReminders.forEach(reminderData => {
            this.addReminder(reminderData);
        });
    }
    
    // Helper Methods
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }
    
    // Data Export/Import
    exportAllData() {
        try {
            const data = {
                contacts: this.getContacts(),
                reminders: this.getReminders(),
                profile: this.getUserProfile(),
                stats: this.getUserStats(),
                exportDate: new Date().toISOString(),
                version: window.AppConfig?.app?.version || '1.0.0'
            };
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Failed to export data:', error);
            throw error;
        }
    }
    
    async importAllData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            const keys = window.AppConfig?.storage?.keys || {};
            
            if (data.contacts) {
                localStorage.setItem(keys.contacts || 'remindpro_contacts', JSON.stringify(data.contacts));
            }
            
            if (data.reminders) {
                localStorage.setItem(keys.reminders || 'remindpro_reminders', JSON.stringify(data.reminders));
            }
            
            if (data.profile) {
                localStorage.setItem(keys.profile || 'remindpro_profile', JSON.stringify(data.profile));
            }
            
            if (data.stats) {
                localStorage.setItem(keys.stats || 'remindpro_stats', JSON.stringify(data.stats));
            }
            
            console.log('📥 Data imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            throw error;
        }
    }
    
    // Clear All Data
    clearAllData() {
        try {
            const keys = window.AppConfig?.storage?.keys || {
                user: 'remindpro_user',
                profile: 'remindpro_profile',
                reminders: 'remindpro_reminders',
                contacts: 'remindpro_contacts',
                settings: 'remindpro_settings',
                stats: 'remindpro_stats'
            };
            
            Object.values(keys).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('🗑️ All data cleared');
        } catch (error) {
            console.error('Failed to clear data:', error);
            throw error;
        }
    }
};