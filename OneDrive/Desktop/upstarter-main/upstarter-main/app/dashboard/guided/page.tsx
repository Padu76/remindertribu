'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft, ArrowRight, CheckCircle, Users, Target, 
  DollarSign, TrendingUp, Lightbulb, Brain, Zap, Save,
  AlertCircle, Info, ChevronRight, ChevronLeft
} from 'lucide-react'

// Assicurati che questo import sia corretto
import { ProfessionalStartupAnalyzer } from '@/lib/professional-startup-analyzer'

interface Question {
  id: string
  title: string
  description: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number'
  options?: string[]
  required: boolean
  category: 'basic' | 'team' | 'market' | 'product' | 'financial' | 'competitive'
  placeholder?: string
  validation?: (value: any) => string | null
}

const questions: Question[] = [
  // BASIC INFO
  {
    id: 'project_name',
    title: 'Nome del Progetto',
    description: 'Come si chiama la tua startup o progetto?',
    type: 'text',
    required: true,
    category: 'basic',
    placeholder: 'es. FoodTech AI, GreenEnergy Solutions...'
  },
  {
    id: 'project_description',
    title: 'Descrizione del Progetto',
    description: 'Descrivi in poche righe cosa fa la tua startup',
    type: 'textarea',
    required: true,
    category: 'basic',
    placeholder: 'Sviluppiamo una piattaforma AI che aiuta i ristoranti a...'
  },
  {
    id: 'problem_solution',
    title: 'Problema e Soluzione',
    description: 'Qual è il problema che risolvi e come lo risolvi?',
    type: 'textarea',
    required: true,
    category: 'basic',
    placeholder: 'Problema: I ristoranti sprecano il 30% del cibo...\nSoluzione: La nostra AI predice la domanda e...'
  },
  
  // TEAM
  {
    id: 'team_size',
    title: 'Dimensione del Team',
    description: 'Quante persone compongono il team fondatore?',
    type: 'select',
    options: ['Solo io', '2 persone', '3-4 persone', '5+ persone'],
    required: true,
    category: 'team'
  },
  {
    id: 'team_experience',
    title: 'Esperienza del Team',
    description: 'Descrivi l\'esperienza e le competenze del team',
    type: 'textarea',
    required: true,
    category: 'team',
    placeholder: 'CEO: 10 anni in tech, ex-manager Google...\nCTO: PhD in AI, 3 startup precedenti...'
  },
  {
    id: 'team_advisors',
    title: 'Advisor e Mentori',
    description: 'Hai advisor o mentori nel settore?',
    type: 'textarea',
    required: false,
    category: 'team',
    placeholder: 'Marco Rossi (ex-CEO FoodTech), Maria Verdi (Angel Investor)...'
  },

  // MARKET
  {
    id: 'target_market',
    title: 'Mercato Target',
    description: 'Chi sono i tuoi clienti ideali?',
    type: 'textarea',
    required: true,
    category: 'market',
    placeholder: 'Ristoranti medio-grandi (50-200 coperti) in Italia, con fatturato >500K...'
  },
  {
    id: 'market_size',
    title: 'Dimensione del Mercato',
    description: 'Conosci la dimensione del tuo mercato? (TAM/SAM/SOM)',
    type: 'textarea',
    required: false,
    category: 'market',
    placeholder: 'TAM: €10B (mercato foodtech globale)\nSAM: €1B (mercato italiano)\nSOM: €100M (target realistico)'
  },
  {
    id: 'market_validation',
    title: 'Validazione del Mercato',
    description: 'Come hai validato che esiste domanda per il tuo prodotto?',
    type: 'textarea',
    required: true,
    category: 'market',
    placeholder: 'Interviste a 50 ristoratori, survey online, pilot test con 5 clienti...'
  },

  // PRODUCT
  {
    id: 'product_stage',
    title: 'Stadio del Prodotto',
    description: 'A che punto è lo sviluppo del prodotto?',
    type: 'select',
    options: ['Idea/Concept', 'Prototipo', 'MVP', 'Prodotto funzionante', 'Prodotto completo'],
    required: true,
    category: 'product'
  },
  {
    id: 'unique_value',
    title: 'Valore Unico',
    description: 'Cosa ti rende unico rispetto ai competitor?',
    type: 'textarea',
    required: true,
    category: 'product',
    placeholder: 'Algoritmo proprietario 90% più accurato, integrazione 1-click, costo 50% inferiore...'
  },
  {
    id: 'customer_feedback',
    title: 'Feedback Clienti',
    description: 'Che feedback hai ricevuto dai clienti?',
    type: 'textarea',
    required: false,
    category: 'product',
    placeholder: 'Clienti dicono che riduce sprechi del 25%, facile da usare, vorrebbero più funzionalità...'
  },

  // COMPETITIVE
  {
    id: 'competitors',
    title: 'Principali Competitor',
    description: 'Chi sono i tuoi competitor diretti e indiretti?',
    type: 'textarea',
    required: true,
    category: 'competitive',
    placeholder: 'Diretti: FoodAI Inc, RestaurantTech\nIndiretti: Sistemi manuali, Excel, software gestionali...'
  },
  {
    id: 'competitive_advantage',
    title: 'Vantaggio Competitivo',
    description: 'Perché i clienti dovrebbero scegliere te?',
    type: 'textarea',
    required: true,
    category: 'competitive',
    placeholder: 'Tecnologia AI proprietaria, team esperto, prezzo competitivo, supporto italiano...'
  },

  // FINANCIAL
  {
    id: 'business_model',
    title: 'Modello di Business',
    description: 'Come generi ricavi?',
    type: 'select',
    options: ['Abbonamento mensile', 'Licenza annuale', 'Commissione per transazione', 'Vendita una tantum', 'Freemium', 'Altro'],
    required: true,
    category: 'financial'
  },
  {
    id: 'revenue_projections',
    title: 'Proiezioni di Ricavo',
    description: 'Quali sono le tue proiezioni di ricavo?',
    type: 'textarea',
    required: false,
    category: 'financial',
    placeholder: 'Anno 1: €50K, Anno 2: €200K, Anno 3: €500K\nClienti: 10 → 50 → 100'
  },
  {
    id: 'funding_needs',
    title: 'Fabbisogno di Finanziamento',
    description: 'Quanto capitale ti serve e per cosa?',
    type: 'textarea',
    required: true,
    category: 'financial',
    placeholder: '€300K per: sviluppo prodotto (40%), marketing (30%), team (20%), operazioni (10%)'
  },
  {
    id: 'current_revenue',
    title: 'Ricavi Attuali',
    description: 'Hai già ricavi? Se sì, quanto fatturi?',
    type: 'text',
    required: false,
    category: 'financial',
    placeholder: 'es. €5K/mese, €0 (pre-revenue), €50K annui...'
  }
]

export default function GuidedAnalysisPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const progressPercent = ((currentQuestion + 1) / questions.length) * 100
    setProgress(progressPercent)
  }, [currentQuestion])

  const validateAnswer = (question: Question, value: any) => {
    if (question.required && (!value || value.toString().trim() === '')) {
      return 'Questo campo è obbligatorio'
    }
    
    if (question.validation) {
      return question.validation(value)
    }
    
    return null
  }

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    
    // Rimuovi errore se presente
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }))
    }
  }

  const goToNext = () => {
    const question = questions[currentQuestion]
    const error = validateAnswer(question, answers[question.id])
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        [question.id]: error
      }))
      return
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      generateAnalysis()
    }
  }

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const generateAnalysis = async () => {
    try {
      setIsGenerating(true)
      
      // Genera contenuto per l'analisi
      const content = generateAnalysisContent()
      
      // Inizializza l'analizzatore
      const analyzer = new ProfessionalStartupAnalyzer()
      
      // Genera analisi
      const analysis = await analyzer.analyzeStartup(answers.project_name, content)
      
      // Crea ID univoco
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Salva analisi
      const analysisData = {
        id: analysisId,
        title: answers.project_name,
        type: 'guided',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: session?.user?.email || 'anonymous',
        answers: answers,
        professional_analysis: analysis,
        analysis_data: {
          professional_analysis: analysis
        }
      }
      
      localStorage.setItem(`analysis_${analysisId}`, JSON.stringify(analysisData))
      
      // Salva progetto
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const newProject = {
        id: `project_${Date.now()}`,
        title: answers.project_name,
        description: answers.project_description,
        score: analysis.overall_score,
        status: 'completed',
        type: 'guided',
        source: 'Questionario Guidato',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        analysis_id: analysisId,
        user_id: session?.user?.email || 'anonymous',
        // Aggiungi i dati del questionario per future modifiche
        ...answers
      }
      
      projects.push(newProject)
      localStorage.setItem('projects', JSON.stringify(projects))
      
      // Dispatch event per aggiornare sidebar
      window.dispatchEvent(new Event('projectsUpdated'))
      
      // Vai all'analisi
      router.push(`/dashboard/analysis/${analysisId}`)
      
    } catch (error) {
      console.error('Errore generazione analisi:', error)
      alert('Errore durante la generazione dell\'analisi')
      setIsGenerating(false)
    }
  }

  const generateAnalysisContent = () => {
    const sections = []
    
    // Informazioni base
    sections.push(`PROGETTO: ${answers.project_name}`)
    sections.push(`DESCRIZIONE: ${answers.project_description}`)
    sections.push(`PROBLEMA E SOLUZIONE: ${answers.problem_solution}`)
    
    // Team
    sections.push(`TEAM SIZE: ${answers.team_size}`)
    sections.push(`ESPERIENZA TEAM: ${answers.team_experience}`)
    if (answers.team_advisors) {
      sections.push(`ADVISOR: ${answers.team_advisors}`)
    }
    
    // Mercato
    sections.push(`TARGET MARKET: ${answers.target_market}`)
    if (answers.market_size) {
      sections.push(`MARKET SIZE: ${answers.market_size}`)
    }
    sections.push(`VALIDAZIONE MERCATO: ${answers.market_validation}`)
    
    // Prodotto
    sections.push(`STADIO PRODOTTO: ${answers.product_stage}`)
    sections.push(`VALORE UNICO: ${answers.unique_value}`)
    if (answers.customer_feedback) {
      sections.push(`FEEDBACK CLIENTI: ${answers.customer_feedback}`)
    }
    
    // Competitive
    sections.push(`COMPETITOR: ${answers.competitors}`)
    sections.push(`VANTAGGIO COMPETITIVO: ${answers.competitive_advantage}`)
    
    // Financial
    sections.push(`BUSINESS MODEL: ${answers.business_model}`)
    if (answers.revenue_projections) {
      sections.push(`PROIEZIONI RICAVI: ${answers.revenue_projections}`)
    }
    sections.push(`FABBISOGNO FINANZIARIO: ${answers.funding_needs}`)
    if (answers.current_revenue) {
      sections.push(`RICAVI ATTUALI: ${answers.current_revenue}`)
    }
    
    return sections.join('\n\n')
  }

  const question = questions[currentQuestion]
  const currentAnswer = answers[question.id] || ''
  const currentError = errors[question.id] || ''

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-blue-100 text-blue-800'
      case 'team': return 'bg-purple-100 text-purple-800'
      case 'market': return 'bg-green-100 text-green-800'
      case 'product': return 'bg-orange-100 text-orange-800'
      case 'competitive': return 'bg-red-100 text-red-800'
      case 'financial': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic': return <Info className="w-4 h-4" />
      case 'team': return <Users className="w-4 h-4" />
      case 'market': return <TrendingUp className="w-4 h-4" />
      case 'product': return <Target className="w-4 h-4" />
      case 'competitive': return <Zap className="w-4 h-4" />
      case 'financial': return <DollarSign className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Generazione Analisi...</h2>
          <p className="text-gray-600">Sto elaborando le tue risposte con l'AI</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Dashboard
            </button>
            <div className="border-l border-gray-300 h-6"></div>
            <h1 className="text-2xl font-bold text-gray-900">Questionario Guidato</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">
              {currentQuestion + 1} di {questions.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Progresso</span>
            <span className="text-sm font-medium text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(question.category)}`}>
              {getCategoryIcon(question.category)}
              <span className="ml-2 capitalize">{question.category}</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">{question.title}</h2>
          <p className="text-gray-600 mb-6">{question.description}</p>

          {/* Answer Input */}
          <div className="space-y-4">
            {question.type === 'text' && (
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={question.placeholder}
              />
            )}

            {question.type === 'textarea' && (
              <textarea
                value={currentAnswer}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={question.placeholder}
              />
            )}

            {question.type === 'select' && (
              <select
                value={currentAnswer}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona un'opzione</option>
                {question.options?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}

            {question.type === 'number' && (
              <input
                type="number"
                value={currentAnswer}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={question.placeholder}
              />
            )}

            {currentError && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{currentError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentQuestion === 0}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Precedente
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                // Salva come bozza
                const draftData = {
                  answers,
                  currentQuestion,
                  timestamp: new Date().toISOString()
                }
                localStorage.setItem('guided_analysis_draft', JSON.stringify(draftData))
                alert('Bozza salvata! Puoi continuare più tardi.')
              }}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Salva Bozza
            </button>

            <button
              onClick={goToNext}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentQuestion === questions.length - 1 ? (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Genera Analisi
                </>
              ) : (
                <>
                  Avanti
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}