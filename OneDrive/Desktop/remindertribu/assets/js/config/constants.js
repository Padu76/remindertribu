/**
 * RemindPro Enterprise - Application Configuration
 * Central configuration for all app settings and constants
 */

window.AppConfig = {
    // App Information
    app: {
        name: 'RemindPro Enterprise',
        version: '1.0.0',
        description: 'Piattaforma avanzata per automatizzare i reminder WhatsApp',
        author: 'RemindPro Team',
        website: 'https://remindpro.com'
    },
    
    // Environment Settings
    environment: {
        isDevelopment: window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'),
        isProduction: !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'),
        apiUrl: window.location.hostname.includes('localhost')
            ? 'http://localhost:3000/api' 
            : 'https://api.remindpro.com'
    },
    
    // Firebase Configuration
    firebase: {
        enabled: true,
        config: {
            apiKey: "demo-key-replace-with-your-firebase-config",
            authDomain: "remindpro-demo.firebaseapp.com",
            projectId: "remindpro-demo",
            storageBucket: "remindpro-demo.appspot.com",
            messagingSenderId: "123456789",
            appId: "1:123456789:web:abcdef123456"
        }
    },
    
    // Stripe Configuration
    stripe: {
        enabled: true,
        publishableKey: window.location.hostname.includes('localhost')
            ? 'pk_test_demo_key_replace_with_your_stripe_test_key'
            : 'pk_live_your_stripe_live_key',
        plans: {
            starter: {
                name: 'Starter',
                price: 0,
                priceId: null,
                features: {
                    contacts: 100,
                    messagesPerMonth: 500,
                    reminders: 'unlimited',
                    analytics: 'basic',
                    support: 'email'
                }
            },
            professional: {
                name: 'Professional',
                price: 29,
                priceId: 'price_professional_monthly',
                features: {
                    contacts: 'unlimited',
                    messagesPerMonth: 10000,
                    reminders: 'unlimited',
                    analytics: 'advanced',
                    support: 'priority',
                    abTesting: true,
                    customIntegrations: true
                }
            },
            enterprise: {
                name: 'Enterprise',
                price: 99,
                priceId: 'price_enterprise_monthly',
                features: {
                    contacts: 'unlimited',
                    messagesPerMonth: 'unlimited',
                    reminders: 'unlimited',
                    analytics: 'premium',
                    support: '24/7',
                    whiteLabel: true,
                    api: true,
                    customBranding: true,
                    sla: true
                }
            }
        }
    },
    
    // EmailJS Configuration
    emailjs: {
        enabled: true,
        publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
        serviceId: 'YOUR_EMAILJS_SERVICE_ID',
        templates: {
            welcome: 'template_welcome',
            reminder: 'template_reminder',
            support: 'template_support'
        }
    },
    
    // WhatsApp Integration Settings
    whatsapp: {
        enabled: true,
        automationScript: {
            version: '4.0',
            checkInterval: 5000,
            messageDelay: 3000,
            maxRetries: 3,
            timeoutDuration: 8000
        },
        limits: {
            messagesPerMinute: 20,
            messagesPerHour: 1000,
            messagesPerDay: 5000
        }
    },
    
    // UI Configuration
    ui: {
        theme: {
            primary: '#25D366',
            primaryDark: '#128C7E',
            secondary: '#34495e',
            accent: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            danger: '#e74c3c'
        },
        animations: {
            duration: 300,
            easing: 'ease-out'
        },
        toast: {
            duration: 5000,
            position: 'top-right'
        },
        pagination: {
            itemsPerPage: 25,
            maxPages: 10
        }
    },
    
    // Data Management
    data: {
        autoSave: true,
        autoSaveInterval: 30000,
        backupInterval: 300000,
        maxBackups: 10,
        exportFormats: ['csv', 'json', 'xlsx']
    },
    
    // Security Settings
    security: {
        sessionTimeout: 7200000,
        maxLoginAttempts: 5,
        passwordMinLength: 6,
        enableTwoFactor: false
    },
    
    // Demo Mode Settings
    demo: {
        enabled: true,
        credentials: {
            email: 'demo@remindpro.com',
            password: 'demo123'
        },
        sampleData: {
            generateContacts: true,
            generateReminders: true,
            contactsCount: 4,
            remindersCount: 2
        }
    },
    
    // Storage Keys
    storage: {
        keys: {
            user: 'remindpro_user',
            profile: 'remindpro_profile',
            reminders: 'remindpro_reminders',
            contacts: 'remindpro_contacts',
            settings: 'remindpro_settings',
            stats: 'remindpro_stats',
            whatsappStatus: 'remindpro_whatsapp_status',
            whatsappLogs: 'remindpro_whatsapp_logs',
            whatsappCommands: 'remindpro_whatsapp_commands'
        }
    }
};

// Freeze configuration to prevent modifications
Object.freeze(window.AppConfig);

// Log configuration in development
if (window.AppConfig.environment.isDevelopment) {
    console.log('📋 RemindPro Configuration loaded:', window.AppConfig.app.name, window.AppConfig.app.version);
}