# 🚀 UpStarter

**La piattaforma evolutiva per trasformare idee in startup di successo**

UpStarter è una webapp completa che accompagna aspiranti imprenditori nel percorso dalla validazione dell'idea alla costruzione del team, utilizzando l'intelligenza artificiale di Claude per fornire feedback personalizzato e un sistema di matching avanzato per connettere startup e investitori.

## ✨ Funzionalità Principali

### 🧠 Analisi AI delle Idee
- Questionario guidato multi-step per raccogliere tutti i dettagli dell'idea
- Analisi approfondita con Claude AI utilizzando framework consolidati
- Report dettagliato con SWOT analysis, score e raccomandazioni actionable
- Piano di miglioramento personalizzato con task specifici

### 👥 Sistema TeamUp
- Creazione profili dettagliati per founder e collaboratori
- Matching intelligente basato su skill, esperienza e disponibilità
- Sistema di messaggistica integrato per facilitare le connessioni
- Dashboard per gestire richieste e opportunità

### 💰 Investor Matching
- Dashboard dedicata per investitori con deal flow pre-qualificato
- Algoritmo di compatibilità avanzato (settore, stage, ticket size)
- Metriche standardizzate per valutazione rapida
- Sistema di interesse reciproco e scheduling meeting

### 📈 Progress Tracking
- Gamification con achievement e milestone
- Analytics dettagliate sui progressi
- Suggerimenti AI per ottimizzare il percorso
- Community challenges e peer comparison

## 🛠 Stack Tecnologico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Airtable
- **Database**: Airtable (no-code, visual interface)
- **AI**: Claude AI (Anthropic) per analisi e feedback
- **Autenticazione**: NextAuth.js (Google + GitHub OAuth)
- **Deploy**: Vercel (auto-deploy da GitHub)
- **Styling**: Tailwind CSS + Lucide Icons

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+ installato
- Account GitHub
- Account Vercel
- Account Airtable
- API Key Claude AI (Anthropic)

### Setup Locale

1. **Clone del repository**
```bash
git clone https://github.com/Padu76/upstarter.git
cd upstarter
```

2. **Installazione dipendenze**
```bash
npm install
```

3. **Configurazione variabili d'ambiente**
```bash
cp .env.example .env.local
```

Compila il file `.env.local` con le tue chiavi:
```bash
# Airtable
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# NextAuth
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

4. **Avvio sviluppo**
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## 📊 Setup Airtable

### Struttura Database

Crea una nuova base Airtable con queste tabelle:

#### Users
- `id` (Primary key)
- `email` (Email)
- `name` (Single line text)
- `user_type` (Single select: startup, investor)
- `created_at` (Date)

#### Projects
- `id` (Primary key)
- `user_id` (Link to Users)
- `title` (Single line text)
- `description` (Long text)
- `status` (Single select: draft, analyzing, completed)
- `score` (Number)
- `created_at` (Date)

#### Ideas_Analysis
- `id` (Primary key)
- `project_id` (Link to Projects)
- `overall_score` (Number)
- `swot_analysis` (JSON)
- `detailed_feedback` (JSON)
- `next_steps` (JSON)
- `created_at` (Date)

#### User_Profiles (per TeamUp)
- `id` (Primary key)
- `user_id` (Link to Users)
- `skills` (Multiple select)
- `experience_years` (Number)
- `availability_hours` (Number)
- `bio` (Long text)

#### Matches
- `id` (Primary key)
- `project_id` (Link to Projects)
- `user_profile_id` (Link to User_Profiles)
- `compatibility_score` (Number)
- `status` (Single select)

## 🔑 Configurazione OAuth

### Google OAuth
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea nuovo progetto o seleziona esistente
3. Attiva Google+ API
4. Crea credenziali OAuth 2.0
5. Aggiungi domini autorizzati: `localhost:3000` e il tuo dominio Vercel

### GitHub OAuth
1. Vai su GitHub Settings > Developer settings > OAuth Apps
2. Crea nuova OAuth App
3. Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`

## 🚀 Deploy su Vercel

### Automatico da GitHub
1. Connetti repository GitHub a Vercel
2. Configura variabili d'ambiente in Vercel Dashboard
3. Deploy automatico ad ogni push su main

### Manuale
```bash
npm run build
vercel --prod
```

## 🧪 Testing

```bash
# Test linting
npm run lint

# Build test
npm run build

# Start production
npm start
```

## 📁 Struttura Progetto

```
upstarter/
├── app/                    # Next.js 14 App Router
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── auth/              # Autenticazione
│   ├── dashboard/         # Dashboard startup
│   ├── investor/          # Dashboard investitori
│   └── api/               # API routes
├── components/            # Componenti React
│   ├── ui/               # Componenti base
│   ├── landing/          # Componenti landing
│   └── dashboard/        # Componenti dashboard
├── lib/                  # Utilities e configurazioni
│   ├── airtable.ts       # Client Airtable
│   ├── claude.ts         # Client Claude AI
│   └── auth.ts           # Configurazione NextAuth
├── types/                # Definizioni TypeScript
└── hooks/                # Custom React hooks
```

## 🎯 Roadmap

### Fase 1 - MVP (Completata)
- ✅ Landing page responsive
- ✅ Sistema autenticazione
- ✅ Dashboard startup base
- ✅ Analisi idee con Claude AI
- ✅ Setup Airtable + deploy Vercel

### Fase 2 - TeamUp
- 🔄 Sistema matching startup-collaboratori
- 🔄 Profili dettagliati utenti
- 🔄 Messaggistica integrata
- 🔄 Dashboard per gestire connessioni

### Fase 3 - Investor Platform
- 📅 Dashboard investitori
- 📅 Deal flow personalizzato
- 📅 Matching startup-investitori
- 📅 Analytics e reporting

### Fase 4 - Advanced Features
- 📅 Piano miglioramento gamificato
- 📅 Video pitch integration
- 📅 Legal document templates
- 📅 Payments e premium features

## 🤝 Contribuire

1. Fork del repository
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Apri Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi file `LICENSE` per dettagli.

## 🆘 Supporto

Per domande o supporto:
- 📧 Email: hello@upstarter.com
- 💬 GitHub Issues: [Crea issue](https://github.com/Padu76/upstarter/issues)
- 📖 Documentazione: [Wiki del progetto](https://github.com/Padu76/upstarter/wiki)

## 🙏 Ringraziamenti

- [Next.js](https://nextjs.org/) per il framework
- [Tailwind CSS](https://tailwindcss.com/) per lo styling
- [Airtable](https://airtable.com/) per il database
- [Anthropic](https://anthropic.com/) per Claude AI
- [Vercel](https://vercel.com/) per l'hosting

---

**Fatto con ❤️ da Andrea Padoan per il futuro delle startup italiane** 🇮🇹