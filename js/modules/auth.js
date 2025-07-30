/**
 * Authentication Module
 * Handles user authentication, session management, and security
 */

class AuthModule {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.sessionTimeout = 7200000; // 2 hours
        this.sessionTimer = null;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 5;
        this.lockoutTime = 900000; // 15 minutes
        this.isInitialized = false;
    }
    
    async init() {
        try {
            console.log('🔐 Inizializzazione Auth Module...');
            
            // Check for existing session
            await this.checkExistingSession();
            
            // Setup session monitoring
            this.setupSessionMonitoring();
            
            // Setup auto-logout on inactivity
            this.setupInactivityDetection();
            
            this.isInitialized = true;
            console.log('✅ Auth Module inizializzato');
            
            return this.isAuthenticated;
            
        } catch (error) {
            console.error('❌ Errore inizializzazione Auth:', error);
            return false;
        }
    }
    
    async checkExistingSession() {
        try {
            const sessionData = localStorage.getItem('remindpro_session');
            
            if (!sessionData) {
                console.log('📝 Nessuna sessione esistente trovata');
                return false;
            }
            
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            // Check if session is expired
            if (now > session.expiresAt) {
                console.log('⏰ Sessione scaduta');
                await this.logout(false);
                return false;
            }
            
            // Validate session integrity
            if (!this.validateSession(session)) {
                console.log('🚫 Sessione non valida');
                await this.logout(false);
                return false;
            }
            
            // Restore user session
            this.currentUser = session.user;
            this.isAuthenticated = true;
            
            // Extend session
            await this.extendSession();
            
            console.log('✅ Sessione ripristinata per:', this.currentUser.email);
            return true;
            
        } catch (error) {
            console.error('❌ Errore controllo sessione:', error);
            await this.logout(false);
            return false;
        }
    }
    
    validateSession(session) {
        return session && 
               session.user && 
               session.user.id && 
               session.user.email && 
               session.createdAt && 
               session.expiresAt &&
               session.token;
    }
    
    async login(email, password, rememberMe = false) {
        try {
            // Check if account is locked
            if (this.isAccountLocked()) {
                throw new Error('Account temporaneamente bloccato. Riprova tra 15 minuti.');
            }
            
            // Validate credentials
            const user = await this.validateCredentials(email, password);
            
            if (!user) {
                this.loginAttempts++;
                localStorage.setItem('remindpro_login_attempts', JSON.stringify({
                    count: this.loginAttempts,
                    timestamp: Date.now()
                }));
                
                const remainingAttempts = this.maxLoginAttempts - this.loginAttempts;
                
                if (remainingAttempts <= 0) {
                    localStorage.setItem('remindpro_lockout', Date.now().toString());
                    throw new Error('Troppi tentativi di login. Account bloccato per 15 minuti.');
                }
                
                throw new Error(`Credenziali non valide. Tentativi rimanenti: ${remainingAttempts}`);
            }
            
            // Reset login attempts on successful login
            this.loginAttempts = 0;
            localStorage.removeItem('remindpro_login_attempts');
            localStorage.removeUser('remindpro_lockout');
            
            // Create session
            await this.createSession(user, rememberMe);
            
            // Load or create user profile
            await this.loadUserProfile(user);
            
            console.log('✅ Login successful for:', email);
            
            return {
                success: true,
                user: this.currentUser,
                message: 'Login effettuato con successo!'
            };
            
        } catch (error) {
            console.error('❌ Errore login:', error);
            throw error;
        }
    }
    
    async validateCredentials(email, password) {
        // Demo mode credentials
        const demoCredentials = {
            email: 'demo@remindpro.com',
            password: 'demo123'
        };
        
        if (email === demoCredentials.email && password === demoCredentials.password) {
            return {
                id: 'demo_user',
                email: email,
                name: 'Demo User',
                role: 'admin',
                plan: 'professional',
                isDemo: true,
                createdAt: new Date().toISOString()
            };
        }
        
        // Additional demo users
        const additionalUsers = [
            {
                email: 'admin@remindpro.com',
                password: 'admin123',
                user: {
                    id: 'admin_user',
                    email: 'admin@remindpro.com',
                    name: 'Admin User',
                    role: 'admin',
                    plan: 'enterprise',
                    isDemo: true
                }
            },
            {
                email: 'test@example.com',
                password: 'test123',
                user: {
                    id: 'test_user',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'user',
                    plan: 'starter',
                    isDemo: true
                }
            }
        ];
        
        const matchedUser = additionalUsers.find(u => 
            u.email === email && u.password === password
        );
        
        if (matchedUser) {
            return {
                ...matchedUser.user,
                createdAt: new Date().toISOString()
            };
        }
        
        // In production, this would validate against your backend
        // For now, we'll allow any email/password combination for demo
        if (email && password && email.includes('@') && password.length >= 6) {
            return {
                id: 'user_' + Date.now(),
                email: email,
                name: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                role: 'user',
                plan: 'starter',
                isDemo: false,
                createdAt: new Date().toISOString()
            };
        }
        
        return null;
    }
    
    isAccountLocked() {
        const lockoutTime = localStorage.getItem('remindpro_lockout');
        
        if (!lockoutTime) return false;
        
        const lockoutTimestamp = parseInt(lockoutTime);
        const now = Date.now();
        
        if (now - lockoutTimestamp < this.lockoutTime) {
            return true;
        }
        
        // Lockout period expired
        localStorage.removeItem('remindpro_lockout');
        return false;
    }
    
    async createSession(user, rememberMe = false) {
        const now = Date.now();
        const sessionDuration = rememberMe ? this.sessionTimeout * 7 : this.sessionTimeout; // 7x longer if remember me
        
        const session = {
            user: user,
            token: this.generateSessionToken(),
            createdAt: now,
            expiresAt: now + sessionDuration,
            rememberMe: rememberMe,
            lastActivity: now,
            userAgent: navigator.userAgent,
            ipHash: await this.getIpHash() // Simple fingerprinting
        };
        
        // Store session
        localStorage.setItem('remindpro_session', JSON.stringify(session));
        
        // Update auth state
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Start session timer
        this.startSessionTimer(sessionDuration);
        
        console.log('🔑 Sessione creata:', {
            user: user.email,
            expiresAt: new Date(session.expiresAt).toLocaleString('it-IT')
        });
    }
    
    generateSessionToken() {
        // Simple token generation - in production use crypto.getRandomValues()
        return 'rpro_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async getIpHash() {
        // Simple browser fingerprinting
        const fingerprint = navigator.userAgent + navigator.language + screen.width + screen.height;
        return btoa(fingerprint).substr(0, 16);
    }
    
    async loadUserProfile(user) {
        try {
            // For demo, create basic profile
            const profile = {
                ...user,
                settings: {
                    notifications: true,
                    emailUpdates: true,
                    language: 'it',
                    timezone: 'Europe/Rome'
                },
                preferences: {
                    theme: 'dark',
                    autoSave: true,
                    confirmActions: true
                },
                usage: {
                    loginCount: 1,
                    lastLogin: new Date().toISOString(),
                    firstLogin: new Date().toISOString()
                }
            };
            
            // Update current user with full profile
            this.currentUser = profile;
            
        } catch (error) {
            console.error('❌ Errore caricamento profilo:', error);
            // Continue with basic user data
        }
    }
    
    async logout(showMessage = true) {
        try {
            const user = this.currentUser;
            
            // Clear session timer
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
                this.sessionTimer = null;
            }
            
            // Clear session data
            localStorage.removeItem('remindpro_session');
            
            // Reset auth state
            this.currentUser = null;
            this.isAuthenticated = false;
            
            console.log('👋 Logout completato');
            
            return true;
            
        } catch (error) {
            console.error('❌ Errore logout:', error);
            return false;
        }
    }
    
    async extendSession() {
        try {
            const sessionData = localStorage.getItem('remindpro_session');
            
            if (!sessionData) return false;
            
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            // Extend expiration
            const sessionDuration = session.rememberMe ? this.sessionTimeout * 7 : this.sessionTimeout;
            session.expiresAt = now + sessionDuration;
            session.lastActivity = now;
            
            // Save updated session
            localStorage.setItem('remindpro_session', JSON.stringify(session));
            
            // Restart session timer
            this.startSessionTimer(sessionDuration);
            
            return true;
            
        } catch (error) {
            console.error('❌ Errore estensione sessione:', error);
            return false;
        }
    }
    
    startSessionTimer(duration) {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        
        this.sessionTimer = setTimeout(async () => {
            console.log('⏰ Sessione scaduta');
            await this.logout();
        }, duration);
    }
    
    setupSessionMonitoring() {
        // Monitor session in localStorage changes (for multiple tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'remindpro_session') {
                if (!e.newValue && this.isAuthenticated) {
                    // Session was cleared in another tab
                    this.logout(false);
                }
            }
        });
    }
    
    setupInactivityDetection() {
        let inactivityTimer;
        const inactivityThreshold = 1800000; // 30 minutes
        
        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            
            if (this.isAuthenticated) {
                inactivityTimer = setTimeout(() => {
                    console.log('💤 Logout per inattività');
                    this.logout();
                }, inactivityThreshold);
            }
        };
        
        // Track user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true);
        });
        
        // Start timer if authenticated
        if (this.isAuthenticated) {
            resetInactivityTimer();
        }
    }
    
    // Public methods
    getCurrentUser() {
        return this.currentUser;
    }
    
    isLoggedIn() {
        return this.isAuthenticated;
    }
    
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
    
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // Simple role-based permissions
        const rolePermissions = {
            admin: ['read', 'write', 'delete', 'manage_users', 'view_analytics'],
            user: ['read', 'write'],
            demo: ['read', 'write'] // Demo users have most permissions
        };
        
        const userPermissions = rolePermissions[this.currentUser.role] || [];
        return userPermissions.includes(permission);
    }
    
    // Login demo shortcut
    loginDemo() {
        return this.login('demo@remindpro.com', 'demo123', false);
    }
    
    destroy() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
    }
}

// Create global instance (FIXED - this was missing!)
window.AuthModule = new AuthModule();