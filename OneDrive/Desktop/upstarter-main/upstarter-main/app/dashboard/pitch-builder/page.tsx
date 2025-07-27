'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, ArrowRight, CheckCircle, Lightbulb, 
  Download, Share2, Eye, Wand2, Save, RefreshCw,
  Presentation, Users, TrendingUp, Target, DollarSign,
  FileText, Award, Phone, ChevronDown, Sparkles,
  BarChart3, PieChart, Building, Zap
} from 'lucide-react'

interface SlideData {
  id: number
  title: string
  type: string
  icon: any
  content: {
    title?: string
    subtitle?: string
    bullets?: string[]
    description?: string
    metrics?: any
    chart_data?: any
  }
  completed: boolean
}

const SLIDE_TEMPLATES: SlideData[] = [
  {
    id: 1,
    title: "Title Slide",
    type: "title",
    icon: Presentation,
    content: {
      title: "",
      subtitle: "",
      description: ""
    },
    completed: false
  },
  {
    id: 2,
    title: "Problem",
    type: "problem",
    icon: Target,
    content: {
      title: "The Problem",
      bullets: []
    },
    completed: false
  },
  {
    id: 3,
    title: "Solution",
    type: "solution",
    icon: Lightbulb,
    content: {
      title: "Our Solution",
      description: "",
      bullets: []
    },
    completed: false
  },
  {
    id: 4,
    title: "Market Size",
    type: "market",
    icon: TrendingUp,
    content: {
      title: "Market Opportunity",
      metrics: {
        tam: "",
        sam: "",
        som: ""
      }
    },
    completed: false
  },
  {
    id: 5,
    title: "Business Model",
    type: "business_model",
    icon: Building,
    content: {
      title: "How We Make Money",
      description: "",
      bullets: []
    },
    completed: false
  },
  {
    id: 6,
    title: "Traction",
    type: "traction",
    icon: BarChart3,
    content: {
      title: "Traction & Growth",
      metrics: {},
      bullets: []
    },
    completed: false
  },
  {
    id: 7,
    title: "Competition",
    type: "competition",
    icon: Award,
    content: {
      title: "Competitive Landscape",
      description: "",
      bullets: []
    },
    completed: false
  },
  {
    id: 8,
    title: "Team",
    type: "team",
    icon: Users,
    content: {
      title: "Our Team",
      bullets: []
    },
    completed: false
  },
  {
    id: 9,
    title: "Financial Projections",
    type: "financials",
    icon: PieChart,
    content: {
      title: "Financial Forecast",
      chart_data: {},
      metrics: {}
    },
    completed: false
  },
  {
    id: 10,
    title: "Funding Ask",
    type: "funding",
    icon: DollarSign,
    content: {
      title: "Investment Ask",
      description: "",
      metrics: {}
    },
    completed: false
  },
  {
    id: 11,
    title: "Use of Funds",
    type: "use_of_funds",
    icon: Zap,
    content: {
      title: "How We'll Use the Investment",
      bullets: []
    },
    completed: false
  },
  {
    id: 12,
    title: "Contact & Next Steps",
    type: "contact",
    icon: Phone,
    content: {
      title: "Let's Connect",
      description: ""
    },
    completed: false
  }
]

export default function PitchDeckBuilder() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(1)
  const [slides, setSlides] = useState<SlideData[]>(SLIDE_TEMPLATES)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('professional')
  const [deckTitle, setDeckTitle] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const currentSlideData = slides.find(slide => slide.id === currentSlide)
  const completedSlides = slides.filter(slide => slide.completed).length
  const progress = (completedSlides / slides.length) * 100

  useEffect(() => {
    // Load saved deck data
    loadSavedData()
  }, [])

  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem(`pitch_deck_${session?.user?.email}`)
      if (saved) {
        const data = JSON.parse(saved)
        setSlides(data.slides || SLIDE_TEMPLATES)
        setDeckTitle(data.title || '')
        setSelectedTemplate(data.template || 'professional')
      }
    } catch (error) {
      console.warn('Could not load saved pitch deck data')
    }
  }

  const saveData = () => {
    try {
      const data = {
        slides,
        title: deckTitle,
        template: selectedTemplate,
        updated_at: new Date().toISOString()
      }
      localStorage.setItem(`pitch_deck_${session?.user?.email}`, JSON.stringify(data))
    } catch (error) {
      console.warn('Could not save pitch deck data')
    }
  }

  const updateSlideContent = (content: any) => {
    const updatedSlides = slides.map(slide => 
      slide.id === currentSlide 
        ? { ...slide, content: { ...slide.content, ...content }, completed: true }
        : slide
    )
    setSlides(updatedSlides)
    saveData()
  }

  const generateAIContent = async () => {
    setIsGeneratingContent(true)
    
    // Simulate AI content generation
    setTimeout(() => {
      const suggestions = getAISuggestions(currentSlideData?.type || '')
      updateSlideContent(suggestions)
      setIsGeneratingContent(false)
    }, 2000)
  }

  const getAISuggestions = (slideType: string) => {
    const suggestions: { [key: string]: any } = {
      title: {
        title: `${deckTitle || 'Your Startup'}`,
        subtitle: "Revolutionizing the industry with AI-powered solutions",
        description: "Empowering businesses to achieve more with intelligent technology"
      },
      problem: {
        bullets: [
          "Current solutions are expensive and inefficient",
          "Market lacks user-friendly alternatives", 
          "Small businesses are underserved",
          "Manual processes waste valuable time"
        ]
      },
      solution: {
        description: "Our platform provides an intelligent, automated solution that saves time and reduces costs",
        bullets: [
          "AI-powered automation reduces manual work by 80%",
          "User-friendly interface requires no technical expertise",
          "Scalable solution grows with your business",
          "Integrated analytics provide actionable insights"
        ]
      },
      market: {
        metrics: {
          tam: "$50B Total Addressable Market",
          sam: "$5B Serviceable Addressable Market", 
          som: "$500M Serviceable Obtainable Market"
        }
      },
      business_model: {
        description: "SaaS subscription model with multiple pricing tiers",
        bullets: [
          "Freemium model attracts users",
          "Premium features drive conversions",
          "Enterprise plans for large organizations",
          "Additional revenue from integrations"
        ]
      }
    }
    
    return suggestions[slideType] || {}
  }

  const nextSlide = () => {
    if (currentSlide < slides.length) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const exportDeck = () => {
    // Simulate export functionality
    alert('Pitch deck exported successfully! 🎉\nFormats: PDF, PowerPoint, Keynote')
  }

  const renderSlideEditor = () => {
    if (!currentSlideData) return null

    switch (currentSlideData.type) {
      case 'title':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={currentSlideData.content.title || ''}
                onChange={(e) => updateSlideContent({ title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={currentSlideData.content.subtitle || ''}
                onChange={(e) => updateSlideContent({ subtitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Your compelling tagline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brief Description
              </label>
              <textarea
                value={currentSlideData.content.description || ''}
                onChange={(e) => updateSlideContent({ description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="What does your company do?"
              />
            </div>
          </div>
        )

      case 'problem':
      case 'solution':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Points
              </label>
              {(currentSlideData.content.bullets || []).map((bullet, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => {
                      const newBullets = [...(currentSlideData.content.bullets || [])]
                      newBullets[index] = e.target.value
                      updateSlideContent({ bullets: newBullets })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={`Point ${index + 1}`}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newBullets = [...(currentSlideData.content.bullets || []), '']
                  updateSlideContent({ bullets: newBullets })
                }}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                + Add Point
              </button>
            </div>
            {currentSlideData.type === 'solution' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solution Description
                </label>
                <textarea
                  value={currentSlideData.content.description || ''}
                  onChange={(e) => updateSlideContent({ description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe your solution in detail"
                />
              </div>
            )}
          </div>
        )

      case 'market':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TAM (Total Addressable Market)
                </label>
                <input
                  type="text"
                  value={currentSlideData.content.metrics?.tam || ''}
                  onChange={(e) => updateSlideContent({ 
                    metrics: { ...currentSlideData.content.metrics, tam: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="$50B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SAM (Serviceable Addressable Market)
                </label>
                <input
                  type="text"
                  value={currentSlideData.content.metrics?.sam || ''}
                  onChange={(e) => updateSlideContent({ 
                    metrics: { ...currentSlideData.content.metrics, sam: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="$5B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SOM (Serviceable Obtainable Market)
                </label>
                <input
                  type="text"
                  value={currentSlideData.content.metrics?.som || ''}
                  onChange={(e) => updateSlideContent({ 
                    metrics: { ...currentSlideData.content.metrics, som: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="$500M"
                />
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={currentSlideData.content.description || ''}
                onChange={(e) => updateSlideContent({ description: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your content here..."
              />
            </div>
          </div>
        )
    }
  }

  const renderSlidePreview = () => {
    if (!currentSlideData) return null

    return (
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 aspect-video p-8 flex flex-col justify-center">
        <div className="text-center">
          <currentSlideData.icon className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {currentSlideData.content.title || currentSlideData.title}
          </h2>
          
          {currentSlideData.content.subtitle && (
            <p className="text-lg text-gray-600 mb-6">{currentSlideData.content.subtitle}</p>
          )}
          
          {currentSlideData.content.description && (
            <p className="text-gray-700 mb-4">{currentSlideData.content.description}</p>
          )}
          
          {currentSlideData.content.bullets && currentSlideData.content.bullets.length > 0 && (
            <ul className="text-left space-y-2 max-w-md mx-auto">
              {currentSlideData.content.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{bullet}</span>
                </li>
              ))}
            </ul>
          )}
          
          {currentSlideData.content.metrics && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              {Object.entries(currentSlideData.content.metrics).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-sm font-medium text-gray-500 uppercase">{key}</div>
                  <div className="text-lg font-bold text-orange-600">{value as string}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg mr-3">
                  <Presentation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Pitch Deck Builder</h1>
                  <p className="text-sm text-gray-600">AI-powered presentations for investors</p>
                </div>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                {completedSlides}/{slides.length} slides completed
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={exportDeck}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Slide {currentSlide}: {currentSlideData?.title}
            </h2>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Slide Navigation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Slides</h3>
            <div className="space-y-2">
              {slides.map((slide) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(slide.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    currentSlide === slide.id
                      ? 'bg-orange-100 border-2 border-orange-500 text-orange-900'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <slide.icon className={`w-5 h-5 ${slide.completed ? 'text-green-500' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="font-medium">{slide.title}</div>
                    <div className="text-xs text-gray-500">Slide {slide.id}</div>
                  </div>
                  {slide.completed && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Slide {currentSlide}
                </h3>
                <button
                  onClick={generateAIContent}
                  disabled={isGeneratingContent}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isGeneratingContent ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {isGeneratingContent ? 'Generating...' : 'AI Assist'}
                </button>
              </div>
              
              {renderSlideEditor()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 1}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlide === slides.length}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {renderSlidePreview()}
            
            {/* Template Options */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-3">Template Style</h4>
              <div className="grid grid-cols-3 gap-2">
                {['professional', 'modern', 'creative'].map((template) => (
                  <button
                    key={template}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-2 rounded text-xs font-medium transition-colors ${
                      selectedTemplate === template
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}