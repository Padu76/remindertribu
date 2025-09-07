/**
 * TribuReminder - inject-env.js
 * Build script: legge le ENV e genera config.js per il browser (window.AppConfig)
 * REGOLE rispettate: nessuna API key in chiaro, niente mock data.
 */

const fs = require('fs');
const path = require('path');

// ---- Lettura ENV (Vercel) ----
const firebase = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

const google = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "",
  calendarId: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || ""
};

// WhatsApp provider: "meta" (WhatsApp Cloud API) | "twilio"
// NB: i token NON vanno mai in chiaro nel client. Qui esponiamo solo flag/ID pubblici.
// Se devi inviare messaggi automatici, fallo da API serverless usando le chiavi lato server.
const whatsapp = {
  provider: (process.env.NEXT_PUBLIC_WA_PROVIDER || "meta").toLowerCase(),
  meta: {
    // ID pagina/dispositivo WhatsApp Cloud (può essere considerato non sensibile).
    phoneId: process.env.NEXT_PUBLIC_WA_META_PHONE_ID || ""
    // Il token NON deve essere esposto lato client -> usalo solo in API serverless con WA_META_TOKEN (senza NEXT_PUBLIC)
  },
  twilio: {
    // Mittente Twilio (non sensibile). SID/AUTH_TOKEN NON devono essere esposti lato client.
    from: process.env.NEXT_PUBLIC_TWILIO_PHONE || ""
  }
};

// Parametri reminder (non sensibili)
const reminders = {
  daysAhead: parseInt(process.env.NEXT_PUBLIC_REMINDER_DAYS_AHEAD || "7", 10),
  dailyTime: process.env.NEXT_PUBLIC_REMINDER_DAILY_TIME || "09:00" // HH:mm
};

// Feature flags (non sensibili)
const features = {
  googleCalendar: (process.env.NEXT_PUBLIC_FEATURE_GOOGLE_CALENDAR || "true") === "true",
  whatsappIntegration: (process.env.NEXT_PUBLIC_FEATURE_WHATSAPP || "true") === "true",
  csvImport: (process.env.NEXT_PUBLIC_FEATURE_CSV_IMPORT || "true") === "true",
  automation: (process.env.NEXT_PUBLIC_FEATURE_AUTOMATION || "true") === "true",
  analytics: (process.env.NEXT_PUBLIC_FEATURE_ANALYTICS || "true") === "true",
  notifications: (process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS || "true") === "true"
};

// UI e app settings (non sensibili)
const appSettings = {
  name: "ReminderTribù",
  version: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0",
  environment: process.env.NEXT_PUBLIC_APP_ENV || "production"
};

const ui = {
  theme: process.env.NEXT_PUBLIC_UI_THEME || "dark",
  language: process.env.NEXT_PUBLIC_UI_LANG || "it",
  dateFormat: process.env.NEXT_PUBLIC_UI_DATE_FORMAT || "DD/MM/YYYY",
  timeFormat: process.env.NEXT_PUBLIC_UI_TIME_FORMAT || "HH:mm",
  itemsPerPage: parseInt(process.env.NEXT_PUBLIC_UI_ITEMS_PER_PAGE || "20", 10)
};

// Storage keys (non sensibili)
const storage = {
  primary: "firebase",
  fallback: "localStorage",
  keys: {
    user: "tribu_user",
    profile: "tribu_profile",
    contacts: "tribu_contacts",
    reminders: "tribu_reminders",
    settings: "tribu_settings",
    stats: "tribu_stats"
  }
};

// Collezioni Firestore (non sensibili)
const collections = {
  members: "members",
  reminders: "reminders",
  marketing: "marketing",
  analytics: "analytics"
};

// ---- Validazioni minime ----
const missing = [];
if (!firebase.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
if (!firebase.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
if (!firebase.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");

if (missing.length) {
  console.warn("⚠️  Mancano variabili ENV Firebase:", missing.join(", "));
} else {
  console.log("✅ Variabili Firebase caricate.");
}

// ---- Generazione contenuto config.js ----
const configContent = `// ⚙️ TribuReminder - config.js (GENERATO DA inject-env.js)
window.AppConfig = {
  app: ${JSON.stringify(appSettings)},
  google: {
    enabled: ${google.apiKey ? "true" : "false"},
    apiKey: "${google.apiKey}",
    clientId: "${google.clientId}",
    clientSecret: "${google.clientSecret}",
    calendarId: "${google.calendarId}",
    scopes: "https://www.googleapis.com/auth/calendar.readonly",
    discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
  },
  firebase: {
    enabled: ${firebase.apiKey && firebase.projectId ? "true" : "false"},
    config: {
      apiKey: "${firebase.apiKey}",
      authDomain: "${firebase.authDomain}",
      projectId: "${firebase.projectId}",
      storageBucket: "${firebase.storageBucket}",
      messagingSenderId: "${firebase.messagingSenderId}",
      appId: "${firebase.appId}",
      measurementId: "${firebase.measurementId}"
    },
    collections: ${JSON.stringify(collections)}
  },
  storage: ${JSON.stringify(storage)},
  whatsapp: {
    enabled: ${(process.env.NEXT_PUBLIC_FEATURE_WHATSAPP || "true") === "true"},
    provider: "${whatsapp.provider}",
    meta: {
      phoneId: "${whatsapp.meta.phoneId}"
    },
    twilio: {
      from: "${whatsapp.twilio.from}"
    }
  },
  reminders: ${JSON.stringify(reminders)},
  features: ${JSON.stringify(features)},
  ui: ${JSON.stringify(ui)},
  debug: {
    enabled: ${(process.env.NEXT_PUBLIC_DEBUG || "false") === "true"},
    logLevel: "${process.env.NEXT_PUBLIC_LOG_LEVEL || "info"}",
    showConsoleMessages: ${(process.env.NEXT_PUBLIC_DEBUG_CONSOLE || "true") === "true"}
  }
};

// Alias storico (se usato altrove)
window.CONFIG = window.AppConfig;

console.log('🧩 AppConfig loaded');
console.log('Firebase Project:', window.AppConfig.firebase.config.projectId || 'NOT CONFIGURED');
console.log('Env:', window.AppConfig.app.environment);
`;

// ---- Scrittura file ----
const outPath = path.join(__dirname, 'config.js');
fs.writeFileSync(outPath, configContent, 'utf8');

console.log(`✅ Generato ${outPath}`);
