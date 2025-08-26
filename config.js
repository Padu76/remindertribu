// TribuReminder Configuration
// Updated with real Firebase and Google credentials

window.AppConfig = {
    // Application Settings
    app: {
        name: "ReminderTribù",
        version: "2.0.0",
        environment: "production"
    },
    
    // Google Services Configuration
    google: {
        enabled: true,
        apiKey: process.env.GOOGLE_API_KEY || window.ENV?.GOOGLE_API_KEY || "YOUR_GOOGLE_API_KEY",
        clientId: process.env.GOOGLE_CLIENT_ID || window.ENV?.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID", 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || window.ENV?.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
        calendarId: process.env.GOOGLE_CALENDAR_ID || window.ENV?.GOOGLE_CALENDAR_ID || "tribupersonalstudio@gmail.com",
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
    },
    
    // Firebase Configuration - Use Environment Variables
    firebase: {
        enabled: true,
        config: {
            apiKey: process.env.FIREBASE_API_KEY || window.ENV?.FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || window.ENV?.FIREBASE_AUTH_DOMAIN || "reminderpush.firebaseapp.com",
            projectId: process.env.FIREBASE_PROJECT_ID || window.ENV?.FIREBASE_PROJECT_ID || "reminderpush",
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || window.ENV?.FIREBASE_STORAGE_BUCKET || "reminderpush.appspot.com",
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || window.ENV?.FIREBASE_MESSAGING_SENDER_ID || "533477700960",
            appId: process.env.FIREBASE_APP_ID || window.ENV?.FIREBASE_APP_ID || "YOUR_FIREBASE_APP_ID"
        },
        collections: {
            members: "members",
            reminders: "reminders",
            marketing: "marketing",
            analytics: "analytics"
        }
    },
    
    // Storage Configuration
    storage: {
        primary: "firebase", // firebase | localStorage
        fallback: "localStorage",
        keys: {
            user: "tribu_user",
            profile: "tribu_profile",
            contacts: "tribu_contacts",
            reminders: "tribu_reminders",
            settings: "tribu_settings",
            stats: "tribu_stats"
        }
    },
    
    // WhatsApp Integration
    whatsapp: {
        enabled: true,
        apiUrl: "https://api.whatsapp.com/send",
        templates: {
            scadenze: "Ciao {nome}! Il tuo tesseramento presso Tribù Personal Training è scaduto. Per rinnovarlo e continuare ad allenarti con noi, contattaci al più presto!",
            pasti: "Ciao {nome}! È lunedì mattina, non dimenticare di ordinare i pasti per questa settimana! Ricorda che una buona alimentazione è fondamentale per raggiungere i tuoi obiettivi.",
            motivazionale: "Ciao {nome}! Ricorda che ogni allenamento ti avvicina ai tuoi obiettivi. Non mollare, sei più forte di quanto pensi! Oggi è il giorno perfetto per dare il massimo!",
            reminder_appuntamento: "Ciao {nome}! Ti ricordo che domani {data} alle {ora} hai l'appuntamento per {tipo_allenamento}. Ti aspetto in palestra!",
            followup_appuntamento: "Ciao {nome}! Come è andato l'allenamento di ieri? Spero tu abbia dato il massimo! Ricorda di idratarti bene e riposare. A presto!"
        }
    },
    
    // Authentication Configuration
    auth: {
        enabled: true,
        type: "simple", // simple | firebase | oauth
        credentials: {
            email: "admin@tribu.com",
            password: "tribu2025"
        }
    },
    
    // Features Toggle
    features: {
        googleCalendar: true,
        whatsappIntegration: true,
        csvImport: true,
        automation: true,
        analytics: true,
        notifications: true
    },
    
    // UI Configuration
    ui: {
        theme: "dark",
        language: "it",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "HH:mm",
        itemsPerPage: 20
    },
    
    // Status Configuration for CSEN Members
    memberStatus: {
        active: {
            label: "Attivo",
            color: "#10b981",
            daysThreshold: 30
        },
        expiring: {
            label: "In Scadenza",
            color: "#f59e0b",
            daysThreshold: 0
        },
        expired: {
            label: "Scaduto",
            color: "#ef4444",
            daysThreshold: -999
        },
        messagesent: {
            label: "Messaggio Inviato",
            color: "#3b82f6",
            daysThreshold: null
        },
        renewed: {
            label: "Rinnovato",
            color: "#8b5cf6",
            daysThreshold: null
        }
    },
    
    // Demo Data Settings
    demo: {
        enabled: false,
        sampleData: {
            generateContacts: false,
            generateReminders: false,
            generateAnalytics: false
        }
    },
    
    // Debug Settings
    debug: {
        enabled: false,
        logLevel: "info", // error | warn | info | debug
        showConsoleMessages: true
    }
};

// Make config globally available
window.CONFIG = window.AppConfig;

// Log initialization
console.log('🔧 TribuReminder Configuration Loaded');
console.log('📡 Firebase Project:', window.AppConfig.firebase.config.projectId);
console.log('📅 Google Calendar:', window.AppConfig.google.calendarId);
console.log('🎯 Environment:', window.AppConfig.app.environment);