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
            apiKey: process.env.FIREBASE_API_KEY || window.ENV?.FIREBASE_API_KEY || "",
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || window.ENV?.FIREBASE_AUTH_DOMAIN || "",
            projectId: process.env.FIREBASE_PROJECT_ID || window.ENV?.FIREBASE_PROJECT_ID || "",
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || window.ENV?.FIREBASE_STORAGE_BUCKET || "",
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || window.ENV?.FIREBASE_MESSAGING_SENDER_ID || "",
            appId: process.env.FIREBASE_APP_ID || window.ENV?.FIREBASE_APP_ID || "",
            measurementId: process.env.FIREBASE_MEASUREMENT_ID || window.ENV?.FIREBASE_MEASUREMENT_ID || ""
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