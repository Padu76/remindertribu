/**
 * Firebase Module - Updated for TribuReminder
 * Handles Firestore integration for CSEN members and reminders
 */

window.TribuFirebase = class {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.isInitialized = false;
        this.isConnected = false;
    }
    
    async init() {
        try {
            console.log('🔥 Initializing Firebase for TribuReminder...');
            
            if (!window.AppConfig?.firebase?.enabled) {
                console.warn('🔥 Firebase disabled in configuration');
                return false;
            }
            
            if (!window.Firebase) {
                console.error('🔥 Firebase SDK not loaded');
                return false;
            }
            
            // Initialize Firebase app with real credentials
            this.app = window.Firebase.initializeApp(window.AppConfig.firebase.config);
            this.db = window.Firebase.getFirestore(this.app);
            
            // Test connection
            await this.testConnection();
            
            this.isInitialized = true;
            this.isConnected = true;
            
            console.log('✅ Firebase initialized successfully');
            console.log('📊 Connected to project:', window.AppConfig.firebase.config.projectId);
            
            return true;
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            this.isConnected = false;
            return false;
        }
    }
    
    async testConnection() {
        try {
            // Import Firestore functions
            const { collection, getDocs, limit, query } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Test query to members collection
            const membersRef = collection(this.db, 'members');
            const testQuery = query(membersRef, limit(1));
            await getDocs(testQuery);
            
            console.log('✅ Firestore connection test successful');
        } catch (error) {
            console.error('❌ Firestore connection test failed:', error);
            throw error;
        }
    }
    
    // CSEN Members Management
    async getMembers() {
        try {
            if (!this.isConnected) {
                throw new Error('Firebase not connected');
            }
            
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const membersRef = collection(this.db, 'members');
            const snapshot = await getDocs(membersRef);
            
            const members = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                members.push({
                    id: doc.id,
                    ...data,
                    // Map Firebase fields to app structure
                    firebaseId: doc.id,
                    telefono: data.whatsapp,
                    dataScadenza: data.dataScadenza ? new Date(data.dataScadenza) : null,
                    // Calculate expiry status
                    status: this.calculateMemberStatus(data.dataScadenza),
                    daysTillExpiry: this.calculateDaysToExpiry(data.dataScadenza)
                });
            });
            
            console.log(`📊 Loaded ${members.length} members from Firebase`);
            return members;
            
        } catch (error) {
            console.error('❌ Error fetching members:', error);
            throw error;
        }
    }
    
    async updateMemberStatus(memberId, newStatus) {
        try {
            if (!this.isConnected) {
                throw new Error('Firebase not connected');
            }
            
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const memberRef = doc(this.db, 'members', memberId);
            await updateDoc(memberRef, {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            
            console.log(`✅ Member ${memberId} status updated to: ${newStatus}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error updating member status:', error);
            throw error;
        }
    }
    
    async addMember(memberData) {
        try {
            if (!this.isConnected) {
                throw new Error('Firebase not connected');
            }
            
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const membersRef = collection(this.db, 'members');
            const newMember = {
                ...memberData,
                associazione: "tribu personal training asd",
                dataIscrizione: new Date().toISOString(),
                status: "attivo",
                createdAt: new Date().toISOString()
            };
            
            const docRef = await addDoc(membersRef, newMember);
            console.log(`✅ New member added with ID: ${docRef.id}`);
            
            return { id: docRef.id, ...newMember };
            
        } catch (error) {
            console.error('❌ Error adding member:', error);
            throw error;
        }
    }
    
    // CSV Import to Firebase
    async importMembersFromCSV(csvData) {
        try {
            if (!this.isConnected) {
                throw new Error('Firebase not connected');
            }
            
            const { collection, addDoc, writeBatch } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const batch = writeBatch(this.db);
            const membersRef = collection(this.db, 'members');
            let importCount = 0;
            
            for (const row of csvData) {
                // Map CSV fields to Firebase structure
                const memberData = {
                    associazione: row.ASSOCIAZIONE || "tribu personal training asd",
                    cognome: row.COGNOME?.toUpperCase() || "",
                    nome: row.NOME?.toUpperCase() || "",
                    sesso: row.SESSO || "",
                    dataNascita: row['DATA DI NASCITA'] || "",
                    luogoNascita: row['LUOGO DI NASCITA'] || "",
                    codiceFiscale: row['CODICE FISCALE'] || "",
                    dataIscrizione: this.parseDate(row['DATA DI INSERIMENTO']),
                    dataRilascio: this.parseDate(row['DATA DI RILASCIO']),
                    dataScadenza: this.calculateExpiryDate(row['DATA DI RILASCIO']),
                    numeroTessera: row['NUMERO TESSERA'] || "",
                    discipline: row.DISCIPLINE || "BI001",
                    qualifica: row.QUALIFICA || "Atleta Praticante",
                    tesseramento: row.TESSERAMENTO || "Base",
                    telefono: row.TELEFONO || "",
                    whatsapp: row.TELEFONO || "",
                    email: row['E-MAIL'] || "",
                    istruttore: row.ISTRUTTORE || "",
                    status: "attivo",
                    importedAt: new Date().toISOString()
                };
                
                const newDocRef = doc(collection(this.db, 'members'));
                batch.set(newDocRef, memberData);
                importCount++;
            }
            
            await batch.commit();
            console.log(`✅ Imported ${importCount} members to Firebase`);
            
            return importCount;
            
        } catch (error) {
            console.error('❌ Error importing CSV to Firebase:', error);
            throw error;
        }
    }
    
    // Reminders Management
    async getReminders() {
        try {
            if (!this.isConnected) {
                throw new Error('Firebase not connected');
            }
            
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const remindersRef = collection(this.db, 'reminders');
            const snapshot = await getDocs(remindersRef);
            
            const reminders = [];
            snapshot.forEach((doc) => {
                reminders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📝 Loaded ${reminders.length} reminders from Firebase`);
            return reminders;
            
        } catch (error) {
            console.error('❌ Error fetching reminders:', error);
            return [];
        }
    }
    
    async addReminder(reminderData) {
        try {
            if (!this.isConnected) {
                throw new Error('Firebase not connected');
            }
            
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const remindersRef = collection(this.db, 'reminders');
            const newReminder = {
                ...reminderData,
                createdAt: new Date().toISOString(),
                status: 'scheduled'
            };
            
            const docRef = await addDoc(remindersRef, newReminder);
            console.log(`✅ New reminder added with ID: ${docRef.id}`);
            
            return { id: docRef.id, ...newReminder };
            
        } catch (error) {
            console.error('❌ Error adding reminder:', error);
            throw error;
        }
    }
    
    // Marketing Clients (could be separate collection)
    async getMarketingClients() {
        try {
            if (!this.isConnected) {
                throw new Error('Firebase not connected');
            }
            
            // For now, return empty array - can be implemented later
            return [];
            
        } catch (error) {
            console.error('❌ Error fetching marketing clients:', error);
            return [];
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
    
    parseDate(dateString) {
        if (!dateString) return null;
        
        // Handle different date formats from CSV
        const formats = [
            /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
            /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        ];
        
        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                if (format.toString().includes('4')) {
                    // YYYY-MM-DD format
                    return `${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`;
                } else {
                    // DD/MM/YYYY format
                    return `${match[3]}-${match[2]}-${match[1]}T00:00:00.000Z`;
                }
            }
        }
        
        return dateString; // Return as-is if no format matches
    }
    
    calculateExpiryDate(releaseDate) {
        if (!releaseDate) return null;
        
        const date = new Date(this.parseDate(releaseDate));
        if (isNaN(date)) return null;
        
        // Add 1 year for expiry
        date.setFullYear(date.getFullYear() + 1);
        return date.toISOString();
    }
    
    // Connection status
    isReady() {
        return this.isInitialized && this.isConnected;
    }
    
    getStatus() {
        return {
            initialized: this.isInitialized,
            connected: this.isConnected,
            projectId: window.AppConfig?.firebase?.config?.projectId
        };
    }
};

// Initialize Firebase instance
window.Firebase_Instance = new window.TribuFirebase();