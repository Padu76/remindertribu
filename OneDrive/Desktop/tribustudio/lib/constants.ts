// lib/constants.ts
export const BRAND_COLORS = {
  primary: '#F37021', // Arancione Tribù
  primaryDark: '#D95E16', // Arancione scuro (hover)
  dark: '#1A1A1A',
  gray: '#333333',
  lightGray: '#F7F7F7',
  white: '#FFFFFF',
  whatsapp: '#25D366'
}

export const CONTACT_INFO = {
  phone: '3478881515',
  phoneDisplay: '347 888 1515',
  email: 'info@tribustudio.it',
  address: 'Via Albere 27/B – Verona',
  whatsappMessage: 'Ciao Tribù, vorrei prenotare la mia prima lezione!'
}

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/tribu_personal_trainer/',
  facebook: 'https://www.facebook.com/tribupersonaltrainingstudio/?locale=it_IT'
}

export const ORARI = {
  weekdays: 'Lun–Ven: 7:00 – 21:00',
  saturday: 'Sabato: mattina'
}

export const PREZZI = {
  individuale: [
    { lezioni: 10, prezzo: 55, label: '10 lezioni → 55€/lez' },
    { lezioni: 20, prezzo: 50, label: '20 lezioni → 50€/lez' },
    { lezioni: 30, prezzo: 45, label: '30 lezioni → 45€/lez' }
  ],
  coppia: [
    { lezioni: 10, prezzo: 35, label: '10 lezioni → 35€/lez/pers' },
    { lezioni: 20, prezzo: 30, label: '20 lezioni → 30€/lez/pers' },
    { lezioni: 30, prezzo: 25, label: '30 lezioni → 25€/lez/pers' }
  ],
  miniclass: [
    { lezioni: 10, prezzo: 15, label: '10 lezioni → 15€/lez' }
  ],
  tesseramento: 30
}

export const SERVIZI = [
  {
    id: 'individuale',
    titolo: 'Lezioni Individuali',
    descrizione: 'Allenamenti 1-to-1 per risultati massimi',
    prezzi: PREZZI.individuale,
    dettagli: 'Allenamento completamente personalizzato con un personal trainer dedicato esclusivamente a te. Massima attenzione, correzione immediata della tecnica e progressi rapidi.'
  },
  {
    id: 'coppia',
    titolo: 'Lezioni di Coppia',
    descrizione: 'Allenati con un amico/a e condividi motivazione',
    prezzi: PREZZI.coppia,
    dettagli: 'Perfetto per chi vuole allenarsi con un partner. Motivazione reciproca, divertimento e risparmio, mantenendo sempre la supervisione professionale.'
  },
  {
    id: 'miniclass',
    titolo: 'Miniclass (3-5 persone)',
    descrizione: 'Gruppi ristretti per motivazione e personalizzazione',
    prezzi: PREZZI.miniclass,
    dettagli: 'Il giusto equilibrio tra personalizzazione e dinamica di gruppo. Ideale per chi cerca motivazione e socialità senza rinunciare alla qualità.'
  },
  {
    id: 'nutrizionista',
    titolo: 'Nutrizionista',
    descrizione: 'Consulenza nutrizionale integrata all\'allenamento',
    prezzi: null,
    dettagli: 'Piano alimentare personalizzato che si integra perfettamente con il tuo programma di allenamento per risultati ottimali.'
  },
  {
    id: 'massaggi',
    titolo: 'Massaggi',
    descrizione: 'Recupero muscolare e benessere',
    prezzi: null,
    dettagli: 'Massaggi professionali per il recupero post-allenamento, riduzione delle tensioni muscolari e miglioramento del benessere generale.'
  },
  {
    id: 'online',
    titolo: 'Coaching Online',
    descrizione: 'Allenati ovunque con il nostro supporto',
    link: 'https://www.tornoinforma.it',
    prezzi: null,
    dettagli: 'Programmi di allenamento online personalizzati con supporto costante del tuo personal trainer, ovunque tu sia.'
  }
]

export const STATS = [
  { icon: '👥', value: 1200, label: 'Clienti seguiti', suffix: '+' },
  { icon: '⏳', value: 10, label: 'Anni di esperienza', suffix: '+' },
  { icon: '🏋️', value: 25000, label: 'Sessioni completate', suffix: '+' },
  { icon: '⭐', value: 150, label: 'Recensioni 5 stelle', suffix: '+' }
]

export const TESTIMONIANZE = [
  {
    id: 1,
    nome: 'Luca',
    testo: 'Ho trovato motivazione e risultati che in palestra non ho mai avuto!',
    rating: 5
  },
  {
    id: 2,
    nome: 'Marta',
    testo: 'Personale preparatissimo e super disponibili. Consigliato!',
    rating: 5
  },
  {
    id: 3,
    nome: 'Giovanni',
    testo: 'Allenamenti personalizzati e un ambiente motivante.',
    rating: 5
  }
]

export const FAQ_DATA = [
  {
    domanda: 'Serve esperienza per allenarmi con voi?',
    risposta: 'No, gli allenamenti sono accessibili a tutti e personalizzati sul tuo livello.'
  },
  {
    domanda: 'Quanto dura una lezione?',
    risposta: 'Circa 55 minuti.'
  },
  {
    domanda: 'Posso fare solo miniclass?',
    risposta: 'Certo! Puoi scegliere tra individuale, coppia o miniclass.'
  },
  {
    domanda: 'Avete consulenza nutrizionale?',
    risposta: 'Sì, offriamo anche piani nutrizionali integrati.'
  }
]

export const NAVIGATION_ITEMS = [
  { label: 'Chi siamo', href: '#chi-siamo' },
  { label: 'Servizi', href: '#servizi' },
  { label: 'Come funziona', href: '#come-funziona' },
  { label: 'Testimonianze', href: '#testimonianze' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contatti', href: '#contatti' }
]