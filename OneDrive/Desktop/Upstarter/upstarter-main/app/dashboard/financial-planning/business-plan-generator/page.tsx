'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, ArrowRight, CheckCircle, FileText, 
  Download, Save, RefreshCw, Wand2, Eye,
  Building, Users, TrendingUp, Target, DollarSign,
  BarChart3, Lightbulb, Calendar, Globe, Mail
} from 'lucide-react'

interface SectionData {
  id: string
  title: string
  description: string
  icon: any
  completed: boolean
  fields: { [key: string]: string }
}

export default function BusinessPlanGenerator() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Business Plan Sections
  const sections: SectionData[] = [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      description: 'Panoramica generale del business plan',
      icon: Building,
      completed: false,
      fields: {
        companyName: '',
        mission: '',
        vision: '',
        keyProducts: '',
        targetMarket: '',
        competitiveAdvantage: '',
        financialSummary: '',
        fundingRequest: ''
      }
    },
    {
      id: 'company-description',
      title: 'Descrizione Azienda',
      description: 'Storia, struttura e obiettivi dell\'azienda',
      icon: Building,
      completed: false,
      fields: {
        companyHistory: '',
        legalStructure: '',
        location: '',
        facilities: '',
        companyGoals: '',
        milestones: '',
        successFactors: ''
      }
    },
    {
      id: 'market-analysis',
      title: 'Analisi di Mercato',
      description: 'Ricerca di mercato e analisi competitiva',
      icon: BarChart3,
      completed: false,
      fields: {
        industryOverview: '',
        marketSize: '',
        targetCustomers: '',
        marketTrends: '',
        growthProjections: '',
        marketSegmentation: '',
        customerNeeds: ''
      }
    },
    {
      id: 'competitive-analysis',
      title: 'Analisi Competitiva',
      description: 'Concorrenti e posizionamento competitivo',
      icon: Target,
      completed: false,
      fields: {
        directCompetitors: '',
        indirectCompetitors: '',
        competitiveAdvantages: '',
        swotAnalysis: '',
        marketPosition: '',
        pricingStrategy: '',
        barrierToEntry: ''
      }
    },
    {
      id: 'products-services',
      title: 'Prodotti e Servizi',
      description: 'Descrizione dettagliata dell\'offerta',
      icon: Lightbulb,
      completed: false,
      fields: {
        productDescription: '',
        features: '',
        benefits: '',
        developmentStage: '',
        intellectualProperty: '',
        researchDevelopment: '',
        futureProducts: ''
      }
    },
    {
      id: 'marketing-sales',
      title: 'Marketing e Vendite',
      description: 'Strategia di marketing e piano vendite',
      icon: TrendingUp,
      completed: false,
      fields: {
        marketingStrategy: '',
        salesStrategy: '',
        pricingModel: '',
        distributionChannels: '',
        promotionalPlan: '',
        customerRetention: '',
        salesProjections: ''
      }
    },
    {
      id: 'team-management',
      title: 'Team e Management',
      description: 'Struttura organizzativa e team chiave',
      icon: Users,
      completed: false,
      fields: {
        founders: '',
        keyTeamMembers: '',
        advisors: '',
        organizationalStructure: '',
        hiringPlan: '',
        compensationPlan: '',
        boardOfDirectors: ''
      }
    },
    {
      id: 'financial-projections',
      title: 'Proiezioni Finanziarie',
      description: 'Previsioni finanziarie e analisi economica',
      icon: DollarSign,
      completed: false,
      fields: {
        revenueProjections: '',
        expenseProjections: '',
        profitLoss: '',
        cashFlow: '',
        breakEvenAnalysis: '',
        fundingNeeds: '',
        useOfFunds: ''
      }
    },
    {
      id: 'implementation',
      title: 'Piano di Implementazione',
      description: 'Timeline e milestone di esecuzione',
      icon: Calendar,
      completed: false,
      fields: {
        implementationTimeline: '',
        keyMilestones: '',
        riskAnalysis: '',
        contingencyPlans: '',
        successMetrics: '',
        exitStrategy: '',
        nextSteps: ''
      }
    }
  ]

  const [sectionData, setSectionData] = useState<SectionData[]>(sections)

  useEffect(() => {
    // Load saved data from localStorage
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('upstarter-business-plan')
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          setSectionData(parsed.sections || sections)
          setCurrentSection(parsed.currentSection || 0)
          if (parsed.lastSaved) {
            setLastSaved(new Date(parsed.lastSaved))
          }
        } catch (error) {
          console.error('Error loading saved business plan:', error)
        }
      }
    }
  }, [])

  const saveToLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const dataToSave = {
        sections: sectionData,
        currentSection,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem('upstarter-business-plan', JSON.stringify(dataToSave))
      setLastSaved(new Date())
    }
  }

  const updateSectionField = (sectionIndex: number, field: string, value: string) => {
    const newSectionData = [...sectionData]
    newSectionData[sectionIndex].fields[field] = value
    
    // Check if section is completed
    const allFieldsFilled = Object.values(newSectionData[sectionIndex].fields).every(v => v.trim() !== '')
    newSectionData[sectionIndex].completed = allFieldsFilled
    
    setSectionData(newSectionData)
    
    // Auto-save every 1 second after last change
    setTimeout(() => {
      saveToLocalStorage()
    }, 1000)
  }

  const generateAIContent = async (sectionIndex: number) => {
    setIsGenerating(true)
    
    // Simulate AI generation with realistic business content
    setTimeout(() => {
      const section = sectionData[sectionIndex]
      const mockContent: { [key: string]: { [key: string]: string } } = {
        'executive-summary': {
          companyName: 'InnovateAI Solutions',
          mission: 'Democratizzare l\'intelligenza artificiale per le PMI italiane',
          vision: 'Diventare il leader europeo nelle soluzioni AI accessibili entro il 2030',
          keyProducts: 'Piattaforma SaaS per automazione processi aziendali con AI',
          targetMarket: 'PMI italiane nei settori manifatturiero, retail e servizi',
          competitiveAdvantage: 'Soluzione no-code, supporto in italiano, prezzi competitivi',
          financialSummary: 'Proiezione €2M ricavi anno 3, break-even mese 18',
          fundingRequest: '€500K per sviluppo prodotto e acquisizione clienti'
        },
        'company-description': {
          companyHistory: 'Fondata nel 2024 da un team di esperti AI e business development',
          legalStructure: 'Società a Responsabilità Limitata Semplificata (SRLS)',
          location: 'Sede principale a Milano, team distribuito in Italia',
          facilities: 'Uffici co-working a Milano e hub tecnologico a Torino',
          companyGoals: 'Diventare il punto di riferimento per l\'AI nelle PMI italiane',
          milestones: 'MVP completato, primi 10 clienti acquisiti, team di 5 persone',
          successFactors: 'Expertise tecnica, comprensione mercato PMI, supporto localizzato'
        },
        'market-analysis': {
          industryOverview: 'Il mercato AI B2B in Italia vale €1.2B e cresce del 25% annuo',
          marketSize: 'TAM €8B (Europa), SAM €1.2B (Italia), SOM €120M',
          targetCustomers: 'PMI 50-500 dipendenti nei settori manifatturiero e servizi',
          marketTrends: 'Crescente adozione AI, focus su automazione, carenza competenze tecniche',
          growthProjections: 'Crescita mercato AI del 25% annuo fino al 2028',
          marketSegmentation: 'Manifatturiero (40%), Servizi (35%), Retail (25%)',
          customerNeeds: 'Automazione processi, riduzione costi, miglioramento efficienza'
        },
        'competitive-analysis': {
          directCompetitors: 'Microsoft Power Platform, Salesforce Einstein, UiPath',
          indirectCompetitors: 'Consulenti IT tradizionali, software house locali',
          competitiveAdvantages: 'Soluzione no-code, prezzi accessibili, supporto italiano',
          swotAnalysis: 'Forze: team esperto, prodotto innovativo. Debolezze: startup, risorse limitate',
          marketPosition: 'Challenger nel segmento PMI con focus su accessibilità',
          pricingStrategy: 'Modello freemium con piani enterprise personalizzati',
          barrierToEntry: 'Expertise tecnica, investimenti R&D, rete commerciale'
        },
        'products-services': {
          productDescription: 'Piattaforma SaaS no-code per automazione processi con AI',
          features: 'Drag&drop workflow, AI pre-addestrata, integrazioni native',
          benefits: 'Riduzione costi 40%, aumento produttività 60%, ROI in 6 mesi',
          developmentStage: 'MVP completato, beta testing con 10 clienti pilota',
          intellectualProperty: '2 brevetti in corso, algoritmi proprietari, marchi registrati',
          researchDevelopment: 'Investimento 30% ricavi in R&D, partnership università',
          futureProducts: 'AI verticali per settori specifici, mobile app, API marketplace'
        },
        'marketing-sales': {
          marketingStrategy: 'Content marketing, eventi settore, partnership con consulenti',
          salesStrategy: 'Inside sales qualificato, demo personalizzate, trial gratuiti',
          pricingModel: 'SaaS mensile: €49/user Basic, €99/user Pro, €199/user Enterprise',
          distributionChannels: 'Vendita diretta online, partner channel, marketplace',
          promotionalPlan: 'Webinar educativi, case studies, programma referral',
          customerRetention: 'Customer success dedicato, formazione continua, roadmap condivisa',
          salesProjections: 'Anno 1: 50 clienti, Anno 2: 200 clienti, Anno 3: 500 clienti'
        },
        'team-management': {
          founders: 'CEO: Marco Rossi (ex-McKinsey), CTO: Sara Bianchi (ex-Google)',
          keyTeamMembers: '2 AI Engineers, 1 Product Manager, 1 Sales Manager',
          advisors: 'Advisory board con esperti AI, imprenditori seriali, investitori',
          organizationalStructure: 'Struttura piatta, team agili, decisioni collaborative',
          hiringPlan: 'Piano assunzioni: +10 persone entro 18 mesi (eng, sales, marketing)',
          compensationPlan: 'Salary competitivo + equity + bonus performance',
          boardOfDirectors: 'Founders + lead investor + independent director'
        },
        'financial-projections': {
          revenueProjections: 'Anno 1: €300K, Anno 2: €1.2M, Anno 3: €2.5M',
          expenseProjections: 'Personnel 60%, Marketing 25%, Tech 10%, Operations 5%',
          profitLoss: 'Break-even mese 18, EBITDA positivo anno 3',
          cashFlow: 'Burn rate €50K/mese, runway 15 mesi con funding attuale',
          breakEvenAnalysis: '120 clienti paganti per raggiungere break-even',
          fundingNeeds: '€800K Serie A per crescita team e acquisizione clienti',
          useOfFunds: 'Team 50%, Marketing 30%, Prodotto 15%, Operations 5%'
        },
        'implementation': {
          implementationTimeline: 'Q1: Team building, Q2: Product launch, Q3: Scale sales',
          keyMilestones: 'M6: 25 clienti, M12: €500K ARR, M18: Serie A',
          riskAnalysis: 'Rischi: competizione, adozione lenta, recession, talent acquisition',
          contingencyPlans: 'Pivot prodotto, riduzione burn, focus nicchia, partnership',
          successMetrics: 'ARR growth, CAC/LTV ratio, churn rate, customer satisfaction',
          exitStrategy: 'IPO entro 7 anni o acquisizione strategica da tech giant',
          nextSteps: 'Chiusura Serie A, hiring key roles, lancio marketing campaign'
        }
      }

      if (mockContent[section.id]) {
        Object.entries(mockContent[section.id]).forEach(([field, value]) => {
          updateSectionField(sectionIndex, field, value)
        })
      }
      
      setIsGenerating(false)
    }, 2500)
  }

  const nextSection = () => {
    if (currentSection < sectionData.length - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const completedSections = sectionData.filter(section => section.completed).length
  const progressPercentage = (completedSections / sectionData.length) * 100

  const exportBusinessPlan = () => {
    // Mock export functionality
    alert('Business Plan esportato in PDF! (Funzionalità simulata)')
  }

  const currentSectionData = sectionData[currentSection]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/financial-planning" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                Financial Planning
              </Link>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Business Plan Generator</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  Progresso: {completedSections}/{sectionData.length}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={saveToLocalStorage}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                Salva
              </button>

              <button
                onClick={exportBusinessPlan}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Esporta PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar - Sections Overview */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Sezioni</h2>
              </div>
              
              <div className="space-y-2">
                {sectionData.map((section, index) => {
                  // CORREZIONE: Assegna l'icona a una variabile prima di usarla
                  const IconComponent = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setCurrentSection(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        index === currentSection
                          ? 'bg-purple-50 border border-purple-200 text-purple-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        section.completed 
                          ? 'bg-green-100 text-green-600' 
                          : index === currentSection
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {section.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <IconComponent className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{section.title}</div>
                        <div className="text-xs text-gray-500">
                          {index + 1} di {sectionData.length}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {lastSaved && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Ultimo salvataggio: {lastSaved.toLocaleTimeString('it-IT')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Section Editor */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Section Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      {/* CORREZIONE: Assegna l'icona a una variabile prima di usarla */}
                      {(() => {
                        const CurrentIcon = currentSectionData.icon
                        return <CurrentIcon className="w-5 h-5 text-purple-600" />
                      })()}
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        {currentSectionData.title}
                      </h1>
                      <p className="text-sm text-gray-500">
                        {currentSectionData.description}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => generateAIContent(currentSection)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {isGenerating ? 'Generando...' : 'AI Assist'}
                  </button>
                </div>
              </div>

              {/* Section Content Editor */}
              <div className="p-6">
                <div className="space-y-6">
                  {Object.entries(currentSectionData.fields).map(([field, value]) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}
                      </label>
                      <textarea
                        value={value}
                        onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                        placeholder={`Descrivi ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                        rows={4}
                      />
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={prevSection}
                    disabled={currentSection === 0}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Precedente
                  </button>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{currentSection + 1}</span>
                    <span>/</span>
                    <span>{sectionData.length}</span>
                  </div>

                  <button
                    onClick={nextSection}
                    disabled={currentSection === sectionData.length - 1}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Successiva
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Preview</h3>
              </div>
              
              {/* Section Preview */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mb-6 min-h-[200px]">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    {/* CORREZIONE: Assegna l'icona a una variabile prima di usarla */}
                    {(() => {
                      const PreviewIcon = currentSectionData.icon
                      return <PreviewIcon className="w-6 h-6 text-purple-600" />
                    })()}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{currentSectionData.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {Object.entries(currentSectionData.fields).slice(0, 3).map(([field, value]) => (
                      <div key={field} className="text-left">
                        <div className="font-medium text-xs text-purple-600 uppercase tracking-wide">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="truncate">
                          {value || 'Non compilato...'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sezioni completate:</span>
                  <span className="font-medium text-gray-900">{completedSections}/{sectionData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso:</span>
                  <span className="font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-900 mb-1">Suggerimento</div>
                    <div className="text-xs text-blue-700">
                      {currentSection === 0 && "L'Executive Summary è la prima cosa che leggeranno gli investitori. Rendilo convincente!"}
                      {currentSection === 1 && "Racconta la storia della tua azienda in modo coinvolgente e professionale."}
                      {currentSection === 2 && "Usa dati concreti e ricerche affidabili per supportare la tua analisi di mercato."}
                      {currentSection > 2 && "Usa il button 'AI Assist' per generare contenuti ottimizzati per questa sezione."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              {completedSections > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-3">Esporta Business Plan</div>
                  <div className="space-y-2">
                    <button
                      onClick={exportBusinessPlan}
                      className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      PDF Professionale
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}