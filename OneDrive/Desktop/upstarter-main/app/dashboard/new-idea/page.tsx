'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Lightbulb, FileText, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DocumentAnalyzer from '@/components/DocumentAnalyzer'

interface FormData {
  title: string
  description: string
  target_market: string
  value_proposition: string
  business_model: string
  competitive_advantage: string
  team_experience: string
  funding_needed: string
  timeline: string
  main_challenges: string
}

export default function NewIdeaPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [analysisMode, setAnalysisMode] = useState<'form' | 'document'>('form')
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    target_market: '',
    value_proposition: '',
    business_model: '',
    competitive_advantage: '',
    team_experience: '',
    funding_needed: '',
    timeline: '',
    main_challenges: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const totalSteps = 4

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/analyze-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          questionnaire: {
            target_market: formData.target_market,
            value_proposition: formData.value_proposition,
            business_model: formData.business_model,
            competitive_advantage: formData.competitive_advantage,
            team_experience: formData.team_experience,
            funding_needed: formData.funding_needed,
            timeline: formData.timeline,
            main_challenges: formData.main_challenges,
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/dashboard/analysis/${result.projectId}`)
      } else {
        console.error('Errore durante l\'analisi')
      }
    } catch (error) {
      console.error('Errore:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDocumentAnalysis = (analysis: any) => {
    router.push(`/dashboard/analysis/${analysis.projectId}`)
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() !== '' && formData.description.trim() !== ''
      case 2:
        return formData.target_market.trim() !== '' && formData.value_proposition.trim() !== ''
      case 3:
        return formData.business_model.trim() !== '' && formData.competitive_advantage.trim() !== ''
      case 4:
        return formData.team_experience.trim() !== '' && formData.funding_needed.trim() !== ''
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Dashboard
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Lightbulb className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analizza la Tua Idea</h1>
            <p className="text-gray-600">Il nostro sistema analizzerà la tua startup idea e ti darà feedback dettagliato</p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scegli il metodo di analisi</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setAnalysisMode('form')}
            className={`p-4 rounded-lg border-2 transition-all ${
              analysisMode === 'form'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-900">Questionario Guidato</span>
            </div>
            <p className="text-sm text-gray-600 text-left">
              Compila un questionario dettagliato per descrivere la tua idea startup
            </p>
          </button>

          <button
            onClick={() => setAnalysisMode('document')}
            className={`p-4 rounded-lg border-2 transition-all ${
              analysisMode === 'document'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-6 h-6 text-purple-600" />
              <span className="font-semibold text-gray-900">Carica Documento</span>
            </div>
            <p className="text-sm text-gray-600 text-left">
              Carica un file Word o PDF con la presentazione del tuo progetto
            </p>
          </button>
        </div>
      </div>

      {/* Document Analysis Mode */}
      {analysisMode === 'document' && (
        <DocumentAnalyzer onAnalysisComplete={handleDocumentAnalysis} />
      )}

      {/* Form Analysis Mode */}
      {analysisMode === 'form' && (
        <div className="bg-white rounded-xl shadow-lg">
          {/* Progress Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Progresso</span>
              <span className="text-sm text-gray-500">{currentStep} di {totalSteps}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Idea Base */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Idea Base</h2>
                    <p className="text-gray-600">Descrivi la tua idea in modo generale</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo della tua idea *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="es. EcoFood Delivery, AI Study Buddy, FinTech per PMI..."
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione dettagliata *
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrivi la tua idea in dettaglio: cosa fa, come funziona, che problema risolve..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Market & Value */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Mercato & Valore</h2>
                    <p className="text-gray-600">Definisci il mercato di riferimento e la value proposition</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="target_market" className="block text-sm font-medium text-gray-700 mb-2">
                    Mercato di riferimento *
                  </label>
                  <textarea
                    id="target_market"
                    rows={4}
                    value={formData.target_market}
                    onChange={(e) => updateFormData('target_market', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Chi sono i tuoi clienti target? Dimensione del mercato, caratteristiche demografiche, comportamenti..."
                  />
                </div>

                <div>
                  <label htmlFor="value_proposition" className="block text-sm font-medium text-gray-700 mb-2">
                    Value Proposition *
                  </label>
                  <textarea
                    id="value_proposition"
                    rows={4}
                    value={formData.value_proposition}
                    onChange={(e) => updateFormData('value_proposition', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Che valore unico offri? Perché i clienti dovrebbero scegliere te invece di alternative esistenti?"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Business Model */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Modello di Business</h2>
                    <p className="text-gray-600">Come genererai ricavi e qual è il tuo vantaggio competitivo</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="business_model" className="block text-sm font-medium text-gray-700 mb-2">
                    Modello di Business *
                  </label>
                  <textarea
                    id="business_model"
                    rows={4}
                    value={formData.business_model}
                    onChange={(e) => updateFormData('business_model', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Come genererai ricavi? Pricing strategy, fonti di entrata, modello di subscription, commissioni..."
                  />
                </div>

                <div>
                  <label htmlFor="competitive_advantage" className="block text-sm font-medium text-gray-700 mb-2">
                    Vantaggio Competitivo *
                  </label>
                  <textarea
                    id="competitive_advantage"
                    rows={4}
                    value={formData.competitive_advantage}
                    onChange={(e) => updateFormData('competitive_advantage', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Qual è il tuo vantaggio competitivo? Cosa ti differenzia dai competitor esistenti?"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Execution */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Esecuzione</h2>
                    <p className="text-gray-600">Team, finanziamenti e roadmap di sviluppo</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="team_experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Esperienza del Team *
                  </label>
                  <textarea
                    id="team_experience"
                    rows={3}
                    value={formData.team_experience}
                    onChange={(e) => updateFormData('team_experience', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrivi l'esperienza e le competenze del tuo team..."
                  />
                </div>

                <div>
                  <label htmlFor="funding_needed" className="block text-sm font-medium text-gray-700 mb-2">
                    Finanziamenti Necessari *
                  </label>
                  <textarea
                    id="funding_needed"
                    rows={3}
                    value={formData.funding_needed}
                    onChange={(e) => updateFormData('funding_needed', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Di quanto capitale hai bisogno e come lo utilizzerai?"
                  />
                </div>

                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
                    Timeline di Sviluppo
                  </label>
                  <textarea
                    id="timeline"
                    rows={3}
                    value={formData.timeline}
                    onChange={(e) => updateFormData('timeline', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Quali sono le milestones principali e i tempi di sviluppo?"
                  />
                </div>

                <div>
                  <label htmlFor="main_challenges" className="block text-sm font-medium text-gray-700 mb-2">
                    Sfide Principali
                  </label>
                  <textarea
                    id="main_challenges"
                    rows={3}
                    value={formData.main_challenges}
                    onChange={(e) => updateFormData('main_challenges', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Quali sono le principali sfide e rischi che prevedi?"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Indietro
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
                >
                  Avanti
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isSubmitting ? 'Analizzando...' : 'Analizza Idea'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
          💡 Come funziona l'analisi del sistema
        </h4>
        <p className="text-blue-700 text-sm">
          Il nostro sistema analizzerà la tua idea utilizzando framework consolidati come il Business Model Canvas, analisi SWOT e 
          valutazione del mercato. Riceverai un report dettagliato con score, feedback specifici e un piano di miglioramento personalizzato.
        </p>
      </div>
    </div>
  )
}