/**
 * Authentication Module
 * Handles login/logout and session management
 */

window.AppAuth = class {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.sessionTimeout = null;
    }
    
    init() {
        console.log('Authentication module initialized');
        
        // Check existing session
        this.checkExistingSession();
        
        // Setup session timeout (24 hours)
        this.setupSessionTimeout();
    }
    
    checkExistingSession() {
        try {
            const session = localStorage.getItem('tribu_session');
            if (session) {
                const sessionData = JSON.parse(session);
                const now = new Date().getTime();
                
                // Check if session is still valid (24 hours)
                if (sessionData.expires > now) {
                    this.currentUser = sessionData.user;
                    this.isAuthenticated = true;
                    console.log('Existing session found, user authenticated');
                    return true;
                } else {
                    // Session expired, clear it
                    this.clearSession();
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
            this.clearSession();
        }
        
        return false;
    }
    
    async performLogin() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        
        if (!email || !password) {
            if (window.AppToast) {
                window.AppToast.show('Inserisci email e password', 'error');
            }
            return false;
        }
        
        try {
            // Simple authentication - can be extended with Firebase Auth
            const credentials = window.AppConfig?.auth?.credentials;
            
            if (email === credentials?.email && password === credentials?.password) {
                
                // Create user session
                const user = {
                    email: email,
                    name: 'Admin Tribu',
                    role: 'admin',
                    loginTime: new Date().toISOString()
                };
                
                this.currentUser = user;
                this.isAuthenticated = true;
                
                // Save session (expires in 24 hours)
                const sessionData = {
                    user: user,
                    expires: new Date().getTime() + (24 * 60 * 60 * 1000)
                };
                localStorage.setItem('tribu_session', JSON.stringify(sessionData));
                
                if (window.AppToast) {
                    window.AppToast.show('Login effettuato con successo!', 'success');
                }
                
                // Hide login screen and show app
                setTimeout(() => {
                    this.showMainApp();
                }, 1500);
                
                return true;
                
            } else {
                if (window.AppToast) {
                    window.AppToast.show('Credenziali non valide', 'error');
                }
                return false;
            }
            
        } catch (error) {
            console.error('Login error:', error);
            if (window.AppToast) {
                window.AppToast.show('Errore durante il login', 'error');
            }
            return false;
        }
    }
    
    showMainApp() {
        const loadingScreen = document.getElementById('loading-screen');
        const authContainer = document.getElementById('auth-container');
        const mainApp = document.getElementById('main-app');
        
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (authContainer) authContainer.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
        
        // Initialize the main application
        if (window.TribuApp) {
            window.TribuApp.postLoginInit();
        }
    }
    
    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.clearSession();
        
        if (window.AppToast) {
            window.AppToast.show('Disconnesso con successo', 'info');
        }
        
        // Redirect to login
        setTimeout(() => {
            this.showLoginScreen();
        }, 1000);
    }
    
    showLoginScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const authContainer = document.getElementById('auth-container');
        const mainApp = document.getElementById('main-app');
        
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        if (authContainer) authContainer.classList.remove('hidden');
        
        // Clear form
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }
    
    clearSession() {
        localStorage.removeItem('tribu_session');
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }
    }
    
    setupSessionTimeout() {
        // Auto logout after 24 hours
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }
        
        this.sessionTimeout = setTimeout(() => {
            if (this.isAuthenticated) {
                if (window.AppToast) {
                    window.AppToast.show('Sessione scaduta. Effettua nuovamente il login.', 'warning');
                }
                this.logout();
            }
        }, 24 * 60 * 60 * 1000); // 24 hours
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isLoggedIn() {
        return this.isAuthenticated;
    }
    
    requireAuth() {
        if (!this.isAuthenticated) {
            if (window.AppToast) {
                window.AppToast.show('Accesso richiesto', 'warning');
            }
            this.showLoginScreen();
            return false;
        }
        return true;
    }
};

// Initialize auth instance
window.Auth_Instance = new window.AppAuth();