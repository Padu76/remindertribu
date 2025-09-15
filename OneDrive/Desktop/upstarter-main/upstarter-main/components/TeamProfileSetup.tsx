'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { 
  User, Users, MapPin, Clock, Briefcase, Star, 
  Upload, Link2, Linkedin, Github, Globe,
  CheckCircle, AlertCircle, ChevronRight, ChevronLeft,
  Plus, X, Code, Palette, TrendingUp, Zap,
  Brain, Target, Award, Save, Eye, Wifi, WifiOff
} from 'lucide-react'

interface TeamProfileData {
  // Informazioni Base
  full_name: string
  professional_title: string
  bio: string
  location: string
  timezone: string
  
  // Ruolo e Disponibilità
  role_seeking: 'co-founder' | 'technical' | 'marketing' | 'business' | 'design' | 'operations'
  availability: 'full-time' | 'part-time' | 'weekends' | 'consulting'
  start_timeline: 'immediately' | '1-month' | '3-months' | '6-months'
  
  // Competenze e Esperienza
  skills: string[]
  experience_years: number
  industry_focus: string[]
  previous_roles: string[]
  
  // Preferenze Startup
  startup_stage_preference: string[]
  equity_expectations: string
  compensation_needs: 'equity-only' | 'salary-required' | 'flexible'
  remote_preference: 'remote-only' | 'hybrid' | 'office-only' | 'flexible'
  
  // Portfolio e Links
  portfolio_url?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  cv_file?: File
  
  // Matching Preferences
  team_size_preference: string
  investment_stage_preference: string[]
  geographic_preference: string[]
}

interface ValidationErrors {
  [key: string]: string
}

interface SaveResult {
  success: boolean
  saved_locally: boolean
  saved_remotely: boolean
  error?: string
  profile_id?: string
}

const SKILLS_OPTIONS = [
  // Technical
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'PHP',
  'Mobile Development', 'iOS', 'Android', 'Flutter', 'React Native',
  'DevOps', 'AWS', 'Azure', 'Docker', 'Kubernetes',
  'AI/ML', 'Data Science', 'Blockchain', 'Cybersecurity',
  
  // Business
  'Product Management', 'Business Development', 'Strategy', 'Operations',
  'Sales', 'Marketing', 'Digital Marketing', 'Content Marketing', 'SEO/SEM',
  'Finance', 'Fundraising', 'Legal', 'HR', 'Customer Success',
  
  // Design
  'UI/UX Design', 'Graphic Design', 'Brand Design', 'Product Design',
  'Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research'
]

const INDUSTRIES = [
  'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS', 'AI/ML',
  'Blockchain/Crypto', 'Gaming', 'Social Media', 'Marketplace',
  'IoT', 'CleanTech', 'FoodTech', 'Travel', 'Real Estate',
  'Fashion', 'Entertainment', 'Sports', 'Automotive', 'Other'
]

const STARTUP_STAGES = [
  'Idea Stage', 'MVP Development', 'Pre-Launch', 'Early Stage',
  'Growth Stage', 'Scale-Up', 'Series A+', 'Any Stage'
]

export default function TeamProfileSetup({ onComplete, onClose }: { 
  onComplete?: (profileData: TeamProfileData) => void
  onClose?: () => void 
}) {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [profileData, setProfileData] = useState<TeamProfileData>({
    full_name: session?.user?.name || '',
    professional_title: '',
    bio: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    role_seeking: 'co-founder',
    availability: 'full-time',
    start_timeline: 'immediately',
    skills: [],
    experience_years: 0,
    industry_focus: [],
    previous_roles: [],
    startup_stage_preference: [],
    equity_expectations: '',
    compensation_needs: 'flexible',
    remote_preference: 'flexible',
    team_size_preference: '2-5 membri',
    investment_stage_preference: ['Pre-Seed', 'Seed'],
    geographic_preference: ['Italia', 'Europa']
  })
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveResult | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const steps = [
    {
      title: 'Informazioni Base',
      description: 'Presentati alla community',
      icon: User,
      fields: ['full_name', 'professional_title', 'bio', 'location']
    },
    {
      title: 'Ruolo e Disponibilità',
      description: 'Cosa stai cercando',
      icon: Users,
      fields: ['role_seeking', 'availability', 'start_timeline', 'remote_preference']
    },
    {
      title: 'Competenze ed Esperienza',
      description: 'Le tue skills e background',
      icon: Briefcase,
      fields: ['skills', 'experience_years', 'industry_focus', 'previous_roles']
    },
    {
      title: 'Preferenze Startup',
      description: 'Tipo di progetti interessanti',
      icon: Target,
      fields: ['startup_stage_preference', 'equity_expectations', 'compensation_needs']
    },
    {
      title: 'Portfolio e Links',
      description: 'Mostra il tuo lavoro',
      icon: Link2,
      fields: ['portfolio_url', 'linkedin_url', 'github_url', 'website_url', 'cv_file']
    }
  ]

  // Auto-save ogni 3 secondi
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(profileData).some(key => profileData[key as keyof TeamProfileData])) {
        saveProgress()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [profileData])

  // Load saved progress
  useEffect(() => {
    loadProgress()
  }, [])

  const saveProgress = () => {
    setIsSaving(true)
    const progressKey = `team_profile_${session?.user?.email}`
    try {
      localStorage.setItem(progressKey, JSON.stringify({
        profileData,
        currentStep,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('Unable to save progress to localStorage:', error)
    }
    setTimeout(() => setIsSaving(false), 1000)
  }

  const loadProgress = () => {
    const progressKey = `team_profile_${session?.user?.email}`
    try {
      const saved = localStorage.getItem(progressKey)
      if (saved) {
        const { profileData: savedData, currentStep: savedStep, timestamp } = JSON.parse(saved)
        // Load if saved within last 7 days
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
          setProfileData(prev => ({ ...prev, ...savedData }))
          setCurrentStep(savedStep)
        }
      }
    } catch (error) {
      console.warn('Failed to load saved progress:', error)
    }
  }

  const updateProfileData = (field: keyof TeamProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateCurrentStep = (): boolean => {
    const currentStepFields = steps[currentStep].fields
    const errors: ValidationErrors = {}

    currentStepFields.forEach(field => {
      const value = profileData[field as keyof TeamProfileData]
      
      switch (field) {
        case 'full_name':
          if (!value || (value as string).trim().length < 2) {
            errors[field] = 'Nome completo richiesto (min 2 caratteri)'
          }
          break
        case 'professional_title':
          if (!value || (value as string).trim().length < 3) {
            errors[field] = 'Titolo professionale richiesto (min 3 caratteri)'
          }
          break
        case 'bio':
          if (!value || (value as string).trim().length < 50) {
            errors[field] = 'Bio richiesta (min 50 caratteri per essere efficace)'
          }
          break
        case 'location':
          if (!value || (value as string).trim().length < 2) {
            errors[field] = 'Posizione geografica richiesta'
          }
          break
        case 'skills':
          if (!Array.isArray(value) || value.length < 3) {
            errors[field] = 'Seleziona almeno 3 competenze principali'
          }
          break
        case 'industry_focus':
          if (!Array.isArray(value) || value.length === 0) {
            errors[field] = 'Seleziona almeno un settore di interesse'
          }
          break
        case 'startup_stage_preference':
          if (!Array.isArray(value) || value.length === 0) {
            errors[field] = 'Seleziona almeno una fase startup di interesse'
          }
          break
        case 'equity_expectations':
          if (!value || (value as string).trim().length === 0) {
            errors[field] = 'Specifica le tue aspettative di equity'
          }
          break
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const nextStep = () => {
    if (!validateCurrentStep()) return
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const saveToAirtable = async (profileData: TeamProfileData): Promise<{ success: boolean; error?: string; id?: string }> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const response = await fetch('/api/team-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_id: session?.user?.email,
          user_email: session?.user?.email,
          ...profileData,
          // Ensure arrays are properly formatted
          skills: profileData.skills || [],
          industry_focus: profileData.industry_focus || [],
          previous_roles: profileData.previous_roles || [],
          startup_stage_preference: profileData.startup_stage_preference || [],
          investment_stage_preference: profileData.investment_stage_preference || [],
          geographic_preference: profileData.geographic_preference || [],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}`
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        return { 
          success: false, 
          error: `Errore server (${response.status}): ${errorMessage}` 
        }
      }

      const result = await response.json()
      return { success: true, id: result.id }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Timeout - riprova tra qualche secondo' }
      }
      
      console.error('Airtable save error:', error)
      
      if (error.message?.includes('fetch')) {
        return { success: false, error: 'Errore di connessione - verifica la tua rete' }
      }
      
      return { 
        success: false, 
        error: error.message || 'Errore sconosciuto durante il salvataggio' 
      }
    }
  }

  const saveLocally = (profileData: TeamProfileData): boolean => {
    try {
      const localKey = `team_profile_final_${session?.user?.email}`
      const profileWithMetadata = {
        ...profileData,
        saved_at: new Date().toISOString(),
        local_id: `local_${Date.now()}`,
        status: 'pending_sync'
      }
      localStorage.setItem(localKey, JSON.stringify(profileWithMetadata))
      return true
    } catch (error) {
      console.error('Local save error:', error)
      return false
    }
  }

  const handleComplete = async () => {
    if (!validateCurrentStep()) return
    
    setIsLoading(true)
    setSaveStatus(null)
    
    try {
      let result: SaveResult = {
        success: false,
        saved_locally: false,
        saved_remotely: false
      }

      // Tentativo salvataggio locale (sempre prima)
      const localSaved = saveLocally(profileData)
      result.saved_locally = localSaved

      // Tentativo salvataggio remoto
      const remoteSaveResult = await saveToAirtable(profileData)
      result.saved_remotely = remoteSaveResult.success
      
      if (remoteSaveResult.success) {
        result.success = true
        result.profile_id = remoteSaveResult.id
        
        // Pulisci i dati salvati temporaneamente
        const progressKey = `team_profile_${session?.user?.email}`
        try {
          localStorage.removeItem(progressKey)
        } catch (error) {
          console.warn('Unable to clear progress:', error)
        }
        
        setSaveStatus(result)
        
        // Chiama onComplete dopo un breve delay per mostrare il successo
        setTimeout(() => {
          if (onComplete) {
            onComplete(profileData)
          }
        }, 2000)
        
      } else {
        // Salvataggio remoto fallito, ma locale riuscito
        result.error = remoteSaveResult.error
        result.success = localSaved // Successo se almeno locale funziona
        
        setSaveStatus(result)
        
        if (localSaved) {
          // Offri possibilità di retry o continuare con salvataggio locale
          setTimeout(() => {
            if (retryCount < 2) {
              // Auto-retry per errori di rete
              if (remoteSaveResult.error?.includes('connessione') || remoteSaveResult.error?.includes('timeout')) {
                setRetryCount(prev => prev + 1)
                handleComplete()
                return
              }
            }
            
            // Mostra opzioni all'utente
            const shouldContinue = confirm(
              `Profilo salvato localmente ma non sincronizzato online.\n\n` +
              `Errore: ${remoteSaveResult.error}\n\n` +
              `Vuoi continuare? Potrai sincronizzare più tardi.`
            )
            
            if (shouldContinue && onComplete) {
              onComplete(profileData)
            }
          }, 3000)
        } else {
          // Entrambi i salvataggi falliti
          setTimeout(() => {
            alert(`Errore durante il salvataggio:\n${remoteSaveResult.error}\n\nRiprova o contatta il supporto.`)
          }, 2000)
        }
      }
      
    } catch (error) {
      console.error('Unexpected error during save:', error)
      setSaveStatus({
        success: false,
        saved_locally: false,
        saved_remotely: false,
        error: 'Errore imprevisto durante il salvataggio'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type and size
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!validTypes.includes(file.type)) {
        alert('Formato file non supportato. Usa PDF, DOC o DOCX.')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File troppo grande. Massimo 5MB.')
        return
      }
      
      updateProfileData('cv_file', file)
    }
  }

  const addSkill = (skill: string) => {
    if (!profileData.skills.includes(skill)) {
      updateProfileData('skills', [...profileData.skills, skill])
    }
  }

  const removeSkill = (skill: string) => {
    updateProfileData('skills', profileData.skills.filter(s => s !== skill))
  }

  const toggleArrayValue = (field: keyof TeamProfileData, value: string) => {
    const currentArray = profileData[field] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    updateProfileData(field, newArray)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'co-founder': return <Users className="w-5 h-5" />
      case 'technical': return <Code className="w-5 h-5" />
      case 'marketing': return <TrendingUp className="w-5 h-5" />
      case 'business': return <Briefcase className="w-5 h-5" />
      case 'design': return <Palette className="w-5 h-5" />
      case 'operations': return <Target className="w-5 h-5" />
      default: return <Star className="w-5 h-5" />
    }
  }

  // Preview Mode
  if (previewMode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Anteprima Profilo</h2>
              <button
                onClick={() => setPreviewMode(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Preview content */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  {profileData.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{profileData.full_name}</h3>
                <p className="text-gray-600">{profileData.professional_title}</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {profileData.location}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Bio</h4>
                <p className="text-gray-700 leading-relaxed">{profileData.bio}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ruolo Cercato</h4>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(profileData.role_seeking)}
                    <span className="capitalize">{profileData.role_seeking.replace('-', ' ')}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Disponibilità</h4>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="capitalize">{profileData.availability.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Competenze Principali</h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Settori di Interesse</h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.industry_focus.map((industry, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {industry}
                    </span>
                  ))}
                </div>
              </div>

              {(profileData.linkedin_url || profileData.github_url || profileData.portfolio_url) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Links</h4>
                  <div className="space-y-2">
                    {profileData.linkedin_url && (
                      <a href={profileData.linkedin_url} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {profileData.github_url && (
                      <a href={profileData.github_url} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                        <Github className="w-4 h-4" />
                        GitHub
                      </a>
                    )}
                    {profileData.portfolio_url && (
                      <a href={profileData.portfolio_url} className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
                        <Globe className="w-4 h-4" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">🤝 Crea il tuo Team Profile</h2>
              <p className="text-blue-100 mt-1">Connettiti con co-founder e startup innovative</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Save Status Indicator */}
              {isSaving && (
                <div className="flex items-center gap-2 text-blue-100">
                  <Save className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Salvando...</span>
                </div>
              )}
              {saveStatus && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  saveStatus.success 
                    ? 'bg-green-100 text-green-800' 
                    : saveStatus.saved_locally 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {saveStatus.success ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Salvato!</span>
                    </>
                  ) : saveStatus.saved_locally ? (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span>Salvato localmente</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Errore salvataggio</span>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => setPreviewMode(true)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Anteprima Profilo"
              >
                <Eye className="w-5 h-5" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Steps Navigation */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                    index < currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold text-gray-900">{steps[currentStep].title}</h3>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {/* Step 0: Informazioni Base */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => updateProfileData('full_name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.full_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mario Rossi"
                />
                {validationErrors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titolo Professionale *
                </label>
                <input
                  type="text"
                  value={profileData.professional_title}
                  onChange={(e) => updateProfileData('professional_title', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.professional_title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Senior Full-Stack Developer"
                />
                {validationErrors.professional_title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.professional_title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio Professionale *
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => updateProfileData('bio', e.target.value)}
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    validationErrors.bio ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Racconta chi sei, cosa fai e cosa ti appassiona delle startup. Includi la tua esperienza, i tuoi successi e cosa puoi portare a un team..."
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.bio ? (
                    <p className="text-sm text-red-600">{validationErrors.bio}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Minimum 50 caratteri per essere efficace</p>
                  )}
                  <p className="text-sm text-gray-400">{profileData.bio.length}/500</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posizione Geografica *
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => updateProfileData('location', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Milano, Italia"
                />
                {validationErrors.location && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Ruolo e Disponibilità */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Che ruolo stai cercando? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'co-founder', label: 'Co-Founder', icon: Users },
                    { value: 'technical', label: 'Technical Lead', icon: Code },
                    { value: 'marketing', label: 'Marketing Lead', icon: TrendingUp },
                    { value: 'business', label: 'Business Lead', icon: Briefcase },
                    { value: 'design', label: 'Design Lead', icon: Palette },
                    { value: 'operations', label: 'Operations Lead', icon: Target }
                  ].map((role) => (
                    <button
                      key={role.value}
                      onClick={() => updateProfileData('role_seeking', role.value)}
                      className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                        profileData.role_seeking === role.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <role.icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">{role.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Disponibilità di Tempo *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'full-time', label: 'Full-Time', desc: '40+ ore/settimana' },
                    { value: 'part-time', label: 'Part-Time', desc: '20-30 ore/settimana' },
                    { value: 'weekends', label: 'Weekend', desc: 'Solo fine settimana' },
                    { value: 'consulting', label: 'Consulting', desc: 'Progetto specifico' }
                  ].map((availability) => (
                    <button
                      key={availability.value}
                      onClick={() => updateProfileData('availability', availability.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        profileData.availability === availability.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{availability.label}</div>
                      <div className="text-sm text-gray-500">{availability.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quando potresti iniziare? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'immediately', label: 'Subito', desc: 'Disponibile ora' },
                    { value: '1-month', label: 'Entro 1 mese', desc: 'Preavviso breve' },
                    { value: '3-months', label: 'Entro 3 mesi', desc: 'Pianificazione media' },
                    { value: '6-months', label: 'Entro 6 mesi', desc: 'Pianificazione lunga' }
                  ].map((timeline) => (
                    <button
                      key={timeline.value}
                      onClick={() => updateProfileData('start_timeline', timeline.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        profileData.start_timeline === timeline.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{timeline.label}</div>
                      <div className="text-sm text-gray-500">{timeline.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferenza Lavoro *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'remote-only', label: 'Solo Remoto', desc: 'Lavoro da casa' },
                    { value: 'hybrid', label: 'Ibrido', desc: 'Mix ufficio/remoto' },
                    { value: 'office-only', label: 'Solo Ufficio', desc: 'Presenza fisica' },
                    { value: 'flexible', label: 'Flessibile', desc: 'Adattabile alle esigenze' }
                  ].map((remote) => (
                    <button
                      key={remote.value}
                      onClick={() => updateProfileData('remote_preference', remote.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        profileData.remote_preference === remote.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{remote.label}</div>
                      <div className="text-sm text-gray-500">{remote.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Competenze ed Esperienza */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Competenze Principali * (seleziona almeno 3)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {SKILLS_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => profileData.skills.includes(skill) ? removeSkill(skill) : addSkill(skill)}
                      className={`px-3 py-2 text-sm border rounded-lg transition-all hover:shadow-sm ${
                        profileData.skills.includes(skill)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                {validationErrors.skills && (
                  <p className="text-sm text-red-600">{validationErrors.skills}</p>
                )}
                <p className="text-sm text-gray-500">
                  Selezionate: {profileData.skills.length} competenze
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anni di Esperienza Professionale *
                </label>
                <select
                  value={profileData.experience_years}
                  onChange={(e) => updateProfileData('experience_years', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Meno di 1 anno</option>
                  <option value={1}>1-2 anni</option>
                  <option value={3}>3-5 anni</option>
                  <option value={6}>6-10 anni</option>
                  <option value={11}>Più di 10 anni</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Settori di Interesse * (seleziona i tuoi preferiti)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {INDUSTRIES.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => toggleArrayValue('industry_focus', industry)}
                      className={`px-3 py-2 text-sm border rounded-lg transition-all hover:shadow-sm ${
                        profileData.industry_focus.includes(industry)
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
                {validationErrors.industry_focus && (
                  <p className="text-sm text-red-600">{validationErrors.industry_focus}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruoli Precedenti (opzionale)
                </label>
                <textarea
                  value={profileData.previous_roles.join('\n')}
                  onChange={(e) => updateProfileData('previous_roles', e.target.value.split('\n').filter(r => r.trim()))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Senior Developer at TechCorp
Product Manager at StartupXYZ
Founder of PreviousVenture"
                />
                <p className="text-sm text-gray-500 mt-1">Un ruolo per riga</p>
              </div>
            </div>
          )}

          {/* Step 3: Preferenze Startup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Fasi Startup di Interesse * (seleziona le tue preferite)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {STARTUP_STAGES.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => toggleArrayValue('startup_stage_preference', stage)}
                      className={`p-3 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        profileData.startup_stage_preference.includes(stage)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{stage}</div>
                    </button>
                  ))}
                </div>
                {validationErrors.startup_stage_preference && (
                  <p className="text-sm text-red-600">{validationErrors.startup_stage_preference}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aspettative di Equity *
                </label>
                <textarea
                  value={profileData.equity_expectations}
                  onChange={(e) => updateProfileData('equity_expectations', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    validationErrors.equity_expectations ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Es: Cerco 10-20% di equity come co-founder tecnico, disposto a negoziare basato su valuation e responsabilità..."
                />
                {validationErrors.equity_expectations && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.equity_expectations}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Necessità di Compenso *
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'equity-only', label: 'Solo Equity', desc: 'Nessun salario iniziale, solo partecipazione' },
                    { value: 'salary-required', label: 'Salario Richiesto', desc: 'Ho bisogno di un compenso fisso' },
                    { value: 'flexible', label: 'Flessibile', desc: 'Aperto a discussioni caso per caso' }
                  ].map((comp) => (
                    <button
                      key={comp.value}
                      onClick={() => updateProfileData('compensation_needs', comp.value)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        profileData.compensation_needs === comp.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{comp.label}</div>
                      <div className="text-sm text-gray-500">{comp.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Portfolio e Links */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={profileData.linkedin_url || ''}
                    onChange={(e) => updateProfileData('linkedin_url', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/tuo-profilo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub URL
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={profileData.github_url || ''}
                    onChange={(e) => updateProfileData('github_url', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://github.com/tuo-username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio/Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={profileData.portfolio_url || ''}
                    onChange={(e) => updateProfileData('portfolio_url', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://tuo-portfolio.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website Personale
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={profileData.website_url || ''}
                    onChange={(e) => updateProfileData('website_url', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://tuo-sito.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  CV/Resume (PDF, DOC, DOCX - max 5MB)
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {profileData.cv_file ? (
                    <div>
                      <p className="text-green-600 font-medium">{profileData.cv_file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(profileData.cv_file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 font-medium">Clicca per caricare il tuo CV</p>
                      <p className="text-sm text-gray-500">PDF, DOC, DOCX fino a 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Indietro
          </button>
          
          <div className="text-sm text-gray-600">
            Step {currentStep + 1} di {steps.length}
          </div>
          
          <button
            onClick={nextStep}
            disabled={isLoading}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                <Award className="w-4 h-4 mr-2" />
                Completa Profilo
              </>
            ) : (
              <>
                Continua
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}