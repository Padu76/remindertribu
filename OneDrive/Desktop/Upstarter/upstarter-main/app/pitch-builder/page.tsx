'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, ArrowRight, CheckCircle, Lightbulb, 
  Download, Share2, Eye, Wand2, Save, RefreshCw,
  Presentation, Target, Users, TrendingUp, DollarSign,
  Building, BarChart3, Phone, Rocket, User, Menu, X
} from 'lucide-react'

interface SlideData {
  id: string
  title: string
  icon: any
  completed: boolean
  fields: { [key: string]: string }
}

export default function PitchBuilderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [template, setTemplate] = useState('professional')

  // Slides configuration
  const slides: SlideData[] = [
    {
      id: 'title',
      title: 'Title Slide',
      icon: Presentation,
      completed: false,
      fields: {
        companyName: '',
        tagline: '',
        founderName: '',
        description: ''
      }
    },
    {
      id: 'problem',
      title: 'Problem',
      icon: Target,
      completed: false,
      fields: {
        mainProblem: '',
        painPoint1: '',
        painPoint2: '',
        painPoint3: '',
        marketNeed: ''
      }
    },
    {
      id: 'solution',
      title: 'Solution',
      icon: Lightbulb,
      completed: false,
      fields: {
        solutionOverview: '',
        keyBenefit1: '',
        keyBenefit2: '',
        keyBenefit3: '',
        uniqueValue: ''
      }
    },
    {
      id: 'market',
      title: 'Market Size',
      icon: TrendingUp,
      completed: false,
      fields: {
        tam: '',
        sam: '',
        som: '',
        marketTrends: '',
        targetCustomer: ''
      }
    },
    {
      id: 'business',
      title: 'Business Model',
      icon: DollarSign,
      completed: false,
      fields: {
        revenueModel: '',
        pricingStrategy: '',
        revenueStreams: '',
        customerAcquisition: '',
        monetization: ''
      }
    },
    {
      id: 'traction',
      title: 'Traction',
      icon: BarChart3,
      completed: false,
      fields: {
        keyMetrics: '',
        growth: '',
        customers: '',
        revenue: '',
        partnerships: ''
      }
    },
    {
      id: 'competition',
      title: 'Competition',
      icon: Target,
      completed: false,
      fields: {
        competitors: '',
        advantages: '',
        differentiators: '',
        moat: '',
        positioning: ''
      }
    },
    {
      id: 'team',
      title: 'Team',
      icon: Users,
      completed: false,
      fields: {
        founder: '',
        coFounder: '',
        keyTeam: '',
        advisors: '',
        experience: ''
      }
    },
    {
      id: 'financials',
      title: 'Financial Projections',
      icon: TrendingUp,
      completed: false,
      fields: {
        revenue3Years: '',
        expenses: '',
        profitability: '',
        keyAssumptions: '',
        unitEconomics: ''
      }
    },
    {
      id: 'funding',
      title: 'Funding Ask',
      icon: DollarSign,
      completed: false,
      fields: {
        fundingAmount: '',
        valuation: '',
        investorType: '',
        timeline: '',
        milestones: ''
      }
    },
    {
      id: 'use-of-funds',
      title: 'Use of Funds',
      icon: BarChart3,
      completed: false,
      fields: {
        productDevelopment: '',
        marketing: '',
        hiring: '',
        operations: '',
        other: ''
      }
    },
    {
      id: 'contact',
      title: 'Contact & Next Steps',
      icon: Phone,
      completed: false,
      fields: {
        email: '',
        phone: '',
        website: '',
        nextSteps: '',
        callToAction: ''
      }
    }
  ]

  const [slideData, setSlideData] = useState<SlideData[]>(slides)

  const isAuthenticated = status === 'authenticated'

  useEffect(() => {
    // Load saved data from localStorage
    const savedData = localStorage.getItem('upstarter-pitch-deck')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setSlideData(parsed.slides || slides)
        setCurrentSlide(parsed.currentSlide || 0)
        setTemplate(parsed.template || 'professional')
      } catch (error) {
        console.error('Error loading saved pitch deck:', error)
      }
    }
  }, [])

  const saveToLocalStorage = () => {
    const dataToSave = {
      slides: slideData,
      currentSlide,
      template,
      lastSaved: new Date().toISOString()
    }
    localStorage.setItem('upstarter-pitch-deck', JSON.stringify(dataToSave))
  }

  const updateSlideField = (slideIndex: number, field: string, value: string) => {
    const newSlideData = [...slideData]
    newSlideData[slideIndex].fields[field] = value
    
    // Check if slide is completed
    const allFieldsFilled = Object.values(newSlideData[slideIndex].fields).every(v => v.trim() !== '')
    newSlideData[slideIndex].completed = allFieldsFilled
    
    setSlideData(newSlideData)
    saveToLocalStorage()
  }

  const generateAIContent = async (slideIndex: number) => {
    setIsGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      // Mock AI-generated content based on slide type
      const slide = slideData[slideIndex]
      const mockContent: { [key: string]: { [key: string]: string } } = {
        'title': {
          companyName: 'InnovateAI',
          tagline: 'Revolutionizing Business with AI',
          founderName: session?.user?.name || 'Your Name',
          description: 'The next-generation AI platform for modern businesses'
        },
        'problem': {
          mainProblem: 'Businesses struggle with manual processes and inefficient workflows',
          painPoint1: '70% of time spent on repetitive tasks',
          painPoint2: 'High operational costs due to inefficiency',
          painPoint3: 'Lack of data-driven decision making',
          marketNeed: '$50B market opportunity in process automation'
        },
        'solution': {
          solutionOverview: 'AI-powered automation platform that streamlines business operations',
          keyBenefit1: '80% reduction in manual work',
          keyBenefit2: '50% cost savings on operations',
          keyBenefit3: 'Real-time analytics and insights',
          uniqueValue: 'First platform to combine AI, automation, and analytics in one solution'
        }
      }

      if (mockContent[slide.id]) {
        Object.entries(mockContent[slide.id]).forEach(([field, value]) => {
          updateSlideField(slideIndex, field, value)
        })
      }
      
      setIsGenerating(false)
    }, 2000)
  }

  const nextSlide = () => {
    if (currentSlide < slideData.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const completedSlides = slideData.filter(slide => slide.completed).length
  const progressPercentage = (completedSlides / slideData.length) * 100

  const exportPitchDeck = (format: string) => {
    // Mock export functionality
    const link = document.createElement('a')
    link.href = '#'
    link.download = `pitch-deck.${format}`
    link.click()
    
    // Show success message
    alert(`Pitch Deck esportato in formato ${format.toUpperCase()}!`)
  }

  const currentSlideData = slideData[currentSlide]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo & Back */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">UpStarter</span>
              </Link>
              <div className="hidden md:flex items-center gap-2 text-gray-500">
                <span>/</span>
                <Presentation className="w-4 h-4" />
                <span>Pitch Deck Builder</span>
              </div>
            </div>

            {/* Progress & Actions */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  Progresso: {completedSlides}/{slideData.length}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {isAuthenticated ? (
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Link>
              ) : (
                <Link 
                  href="/auth/signin" 
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
                >
                  Accedi
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <div className="px-4 py-2">
                  <div className="text-sm text-gray-600 mb-2">
                    Progresso: {completedSlides}/{slideData.length}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                {isAuthenticated ? (
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900 px-4 py-2">
                    Accedi
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar - Slides Overview */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Presentation className="w-5 h-5 text-orange-600" />
                <h2 className="font-semibold text-gray-900">Slide Overview</h2>
              </div>
              
              <div className="space-y-2">
                {slideData.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      index === currentSlide
                        ? 'bg-orange-50 border border-orange-200 text-orange-900'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      slide.completed 
                        ? 'bg-green-100 text-green-600' 
                        : index === currentSlide
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {slide.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <slide.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{slide.title}</div>
                      <div className="text-xs text-gray-500">
                        Slide {index + 1}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Template Selector */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Style
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="professional">Professional</option>
                  <option value="modern">Modern</option>
                  <option value="creative">Creative</option>
                </select>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={saveToLocalStorage}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  Salva Progresso
                </button>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => exportPitchDeck('pdf')}
                    className="flex items-center justify-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-xs"
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </button>
                  <button
                    onClick={() => exportPitchDeck('pptx')}
                    className="flex items-center justify-center gap-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-xs"
                  >
                    <Download className="w-3 h-3" />
                    PPTX
                  </button>
                  <button
                    onClick={() => exportPitchDeck('key')}
                    className="flex items-center justify-center gap-1 bg-purple-50 text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors text-xs"
                  >
                    <Download className="w-3 h-3" />
                    KEY
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Slide Editor */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Slide Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <currentSlideData.icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        {currentSlideData.title}
                      </h1>
                      <p className="text-sm text-gray-500">
                        Slide {currentSlide + 1} di {slideData.length}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => generateAIContent(currentSlide)}
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

              {/* Slide Content Editor */}
              <div className="p-6">
                <div className="space-y-6">
                  {Object.entries(currentSlideData.fields).map(([field, value]) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      {field.includes('description') || field.includes('overview') || field.includes('need') ? (
                        <textarea
                          value={value}
                          onChange={(e) => updateSlideField(currentSlide, field, e.target.value)}
                          placeholder={`Inserisci ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                          rows={3}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateSlideField(currentSlide, field, e.target.value)}
                          placeholder={`Inserisci ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Precedente
                  </button>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{currentSlide + 1}</span>
                    <span>/</span>
                    <span>{slideData.length}</span>
                  </div>

                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === slideData.length - 1}
                    className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              
              {/* Slide Preview */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 mb-4 aspect-[4/3] flex flex-col justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <currentSlideData.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{currentSlideData.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {Object.entries(currentSlideData.fields).slice(0, 2).map(([field, value]) => (
                      <div key={field} className="truncate">
                        {value || `${field.replace(/([A-Z])/g, ' $1')}...`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completate:</span>
                  <span className="font-medium text-gray-900">{completedSlides}/{slideData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso:</span>
                  <span className="font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Template:</span>
                  <span className="font-medium text-gray-900 capitalize">{template}</span>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-900 mb-1">Suggerimento</div>
                    <div className="text-xs text-blue-700">
                      {currentSlide === 0 && "Inizia con un titolo accattivante che catturi l'attenzione degli investitori."}
                      {currentSlide === 1 && "Identifica chiaramente il problema che risolvi. Usa dati e statistiche."}
                      {currentSlide === 2 && "La tua soluzione deve essere chiara e diretta. Evita tecnicismi eccessivi."}
                      {currentSlide > 2 && "Usa il button 'AI Assist' per generare contenuti ottimizzati per questa slide."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}