/**
 * Firebase Configuration Module
 * Handles Firebase initialization and utilities
 */

class FirebaseConfig {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.isInitialized = false;
    }
    
    async init() {
        try {
            if (!window.AppConfig.firebase.enabled) {
                console.log('🔥 Firebase disabled in configuration');
                return false;
            }
            
            if (!window.Firebase) {
                console.warn('🔥 Firebase SDK not loaded');
                return false;
            }
            
            // Initialize Firebase app
            this.app = window.Firebase.initializeApp(window.AppConfig.firebase.config);
            this.auth = window.Firebase.getAuth(this.app);
            this.db = window.Firebase.getFirestore(this.app);
            
            // Set up auth state listener
            window.Firebase.onAuthStateChanged(this.auth, (user) => {
                this.handleAuthStateChange(user);
            });
            
            this.isInitialized = true;
            console.log('✅ Firebase configuration initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            return false;
        }
    }
    
    handleAuthStateChange(user) {
        if (window.AppEventBus) {
            if (user) {
                window.AppEventBus.emit('firebase:user-login', user);
            } else {
                window.AppEventBus.emit('firebase:user-logout');
            }
        }
    }
    
    getApp() {
        return this.app;
    }
    
    getAuth() {
        return this.auth;
    }
    
    getDb() {
        return this.db;
    }
    
    isReady() {
        return this.isInitialized;
    }
}

window.FirebaseConfig = FirebaseConfig;