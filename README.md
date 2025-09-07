# ReminderTribù

Sistema di **marketing automation e reminder clienti** per Tribù Personal Training.  
Gestione scadenze tesseramenti, messaggi WhatsApp motivazionali e promemoria pasti.

---

## 📂 Struttura del progetto

.
├── index.html # Entry point (carica config.js + moduli JS)
├── inject-env.js # Script build: genera config.js dalle ENV
├── config.js # File generato (NON modificare a mano)
├── assets/ # CSS + JS modulari
│ ├── css/ # Stili (dashboard, auth, responsive, ecc.)
│ └── js/ # Moduli app (auth, reminders, storage, ecc.)
└── vercel.json # Configurazione Vercel (cron, routing, ecc.)

---

## ⚙️ Flusso di build

1. **ENV su Vercel**  
   Configura le variabili nel progetto Vercel (`Project → Settings → Environment Variables`).  
   - **Firebase**  
     - `NEXT_PUBLIC_FIREBASE_API_KEY`  
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`  
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`  
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`  
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`  
     - `NEXT_PUBLIC_FIREBASE_APP_ID`  
     - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`  

   - **Google Calendar (opzionale)**  
     - `NEXT_PUBLIC_GOOGLE_API_KEY`  
     - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`  
     - `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET`  
     - `NEXT_PUBLIC_GOOGLE_CALENDAR_ID`  

   - **WhatsApp (Meta / Twilio)**  
     - `NEXT_PUBLIC_WA_PROVIDER` (`meta` o `twilio`)  
     - `NEXT_PUBLIC_WA_META_PHONE_ID` (solo ID, non il token)  
     - `NEXT_PUBLIC_TWILIO_PHONE`  

   - **Reminder Settings**  
     - `NEXT_PUBLIC_REMINDER_DAYS_AHEAD` (es. `7`)  
     - `NEXT_PUBLIC_REMINDER_DAILY_TIME` (es. `09:00`)  

   - **⚠️ Attenzione**  
     - Token sensibili (`WA_META_TOKEN`, `TWILIO_AUTH_TOKEN`, `STRIPE_SECRET_KEY`, ecc.)  
       NON devono avere prefisso `NEXT_PUBLIC` → restano segreti lato server e si usano solo nelle API serverless.

---

## 🛠️ Build & Deploy

### 1. Installazione locale
Se vuoi testare in locale:
```bash
npm install
