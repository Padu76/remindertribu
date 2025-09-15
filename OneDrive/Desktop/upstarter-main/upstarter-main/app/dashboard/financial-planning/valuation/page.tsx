'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, ArrowRight, CheckCircle, Calculator, 
  Download, Save, RefreshCw, Wand2, Eye, TrendingUp,
  DollarSign, BarChart3, Target, Calendar, AlertTriangle,
  Info, Lightbulb, FileText, PieChart, Activity, Building,
  Users, Globe, Award, Zap
} from 'lucide-react'

interface ValuationData {
  id: string
  title: string
  description: string
  icon: any
  completed: boolean
  fields: { [key: string]: string | number }
}

interface ValuationResult {
  method: string
  value: number
  confidence: number
  description: string
}

export default function ValuationCalculatorWizard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [valuationResults, setValuationResults] = useState<ValuationResult[]>([])

  // Valuation Calculator Sections
  const sections: ValuationData[] = [
    {
      id: 'company-basics',
      title: 'Dati Aziendali',
      description: 'Informazioni base su settore e business model',
      icon: Building,
      completed: false,
      fields: {
        companyName: '',
        industry: '',
        businessModel: '',
        stage: '',
        foundedYear: new Date().getFullYear(),
        employees: 0,
        location: '',
        legalStructure: ''
      }
    },
    {
      id: 'financials',
      title: 'Dati Finanziari',
      description: 'Revenue, costi e metriche finanziarie chiave',
      icon: DollarSign,
      completed: false,
      fields: {
        currentRevenue: 0,
        monthlyRecurringRevenue: 0,
        grossMargin: 0,
        burnRate: 0,
        cashOnHand: 0,
        customerCount: 0,
        averageContractValue: 0,
        customerAcquisitionCost: 0
      }
    },
    {
      id: 'growth-metrics',
      title: 'Metriche di Crescita',
      description: 'Trazione, crescita e performance del business',
      icon: TrendingUp,
      completed: false,
      fields: {
        monthlyGrowthRate: 0,
        yearOverYearGrowth: 0,
        churnRate: 0,
        retentionRate: 0,
        marketShare: 0,
        totalAddressableMarket: 0,
        customerGrowthRate: 0,
        revenueGrowthRate: 0
      }
    },
    {
      id: 'competitive-position',
      title: 'Posizione Competitiva',
      description: 'Differenziatori e vantaggi competitivi',
      icon: Target,
      completed: false,
      fields: {
        competitiveAdvantage: '',
        moat: '',
        intellectualProperty: '',
        keyPartnerships: '',
        marketPosition: '',
        brandStrength: 0,
        technologyEdge: 0,
        regulatoryBarriers: 0
      }
    },
    {
      id: 'risk-assessment',
      title: 'Valutazione del Rischio',
      description: 'Fattori di rischio e mitigazione',
      icon: AlertTriangle,
      completed: false,
      fields: {
        marketRisk: 0,
        competitionRisk: 0,
        technologyRisk: 0,
        teamRisk: 0,
        regulatoryRisk: 0,
        financialRisk: 0,
        riskMitigation: '',
        contingencyPlan: ''
      }
    }
  ]

  const [sectionData, setSectionData] = useState<ValuationData[]>(sections)

  useEffect(() => {
    // Load saved data from localStorage
    const savedData = localStorage.getItem('upstarter-valuation-calculator')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setSectionData(parsed.sections || sections)
        setCurrentSection(parsed.currentSection || 0)
        if (parsed.lastSaved) {
          setLastSaved(new Date(parsed.lastSaved))
        }
      } catch (error) {
        console.error('Error loading saved valuation:', error)
      }
    }
    
    // Calculate initial valuations
    calculateValuations()
  }, [])

  const calculateValuations = () => {
    const financials = sectionData[1]?.fields || {}
    const growth = sectionData[2]?.fields || {}
    const competitive = sectionData[3]?.fields || {}
    const risk = sectionData[4]?.fields || {}

    const revenue = Number(financials.currentRevenue) || 0
    const mrr = Number(financials.monthlyRecurringRevenue) || 0
    const growthRate = Number(growth.monthlyGrowthRate) || 0
    const churnRate = Number(growth.churnRate) || 5
    const tam = Number(growth.totalAddressableMarket) || 0

    const results: ValuationResult[] = []

    // Revenue Multiple Method
    const industryMultiples: { [key: string]: number } = {
      'SaaS': 8,
      'E-commerce': 4,
      'FinTech': 6,
      'HealthTech': 7,
      'EdTech': 5,
      'MarTech': 6,
      'Default': 5
    }
    
    const industry = String(sectionData[0]?.fields?.industry || 'Default')
    const multiple = industryMultiples[industry] || industryMultiples['Default']
    const revenueValuation = revenue * multiple
    
    if (revenue > 0) {
      results.push({
        method: 'Revenue Multiple',
        value: revenueValuation,
        confidence: 85,
        description: `${multiple}x multiple per ${industry}`
      })
    }

    // DCF Simplified (SaaS focused)
    if (mrr > 0) {
      const annualRevenue = mrr * 12
      const projectedRevenue = annualRevenue * Math.pow(1 + (growthRate / 100), 3) // 3 year projection
      const discountRate = 0.15 // 15% discount rate
      const terminalValue = projectedRevenue * 3 // 3x terminal multiple
      const dcfValue = terminalValue / Math.pow(1 + discountRate, 3)
      
      results.push({
        method: 'DCF Semplificato',
        value: dcfValue,
        confidence: 75,
        description: 'Cash flow proiettato 3 anni'
      })
    }

    // Market Approach
    if (tam > 0) {
      const marketShare = Number(growth.marketShare) || 0.1
      const marketValuation = tam * (marketShare / 100) * 2 // 2x market penetration multiple
      
      results.push({
        method: 'Market Approach',
        value: marketValuation,
        confidence: 70,
        description: `Basato su TAM di €${tam.toLocaleString()}`
      })
    }

    // Risk-Adjusted Valuation
    if (revenue > 0) {
      const averageRisk = (
        Number(risk.marketRisk) + 
        Number(risk.competitionRisk) + 
        Number(risk.technologyRisk) + 
        Number(risk.teamRisk) + 
        Number(risk.financialRisk)
      ) / 5 || 5
      
      const riskMultiplier = Math.max(0.3, 1 - (averageRisk / 10))
      const riskAdjustedValue = revenueValuation * riskMultiplier
      
      results.push({
        method: 'Risk-Adjusted',
        value: riskAdjustedValue,
        confidence: 80,
        description: `Adjusted per risk score ${averageRisk.toFixed(1)}/10`
      })
    }

    // Comparable Analysis (industry benchmarks)
    if (revenue > 0) {
      const benchmarkMultiples: { [key: string]: { revenue: number, growth: number } } = {
        'SaaS': { revenue: 10, growth: 1.5 },
        'E-commerce': { revenue: 3, growth: 1.2 },
        'FinTech': { revenue: 8, growth: 1.4 },
        'HealthTech': { revenue: 9, growth: 1.6 },
        'Default': { revenue: 5, growth: 1.3 }
      }
      
      const benchmark = benchmarkMultiples[industry] || benchmarkMultiples['Default']
      const growthMultiplier = growthRate > 15 ? benchmark.growth : 1
      const comparableValue = revenue * benchmark.revenue * growthMultiplier
      
      results.push({
        method: 'Comparable Analysis',
        value: comparableValue,
        confidence: 85,
        description: `Benchmark ${industry} con growth premium`
      })
    }

    setValuationResults(results)
  }

  const saveToLocalStorage = () => {
    const dataToSave = {
      sections: sectionData,
      currentSection,
      lastSaved: new Date().toISOString()
    }
    localStorage.setItem('upstarter-valuation-calculator', JSON.stringify(dataToSave))
    setLastSaved(new Date())
  }

  const updateSectionField = (sectionIndex: number, field: string, value: string | number) => {
    const newSectionData = [...sectionData]
    newSectionData[sectionIndex].fields[field] = value
    
    // Check if section is completed
    const requiredFields = Object.keys(newSectionData[sectionIndex].fields).filter(f => 
      typeof newSectionData[sectionIndex].fields[f] === 'number' ? 
      newSectionData[sectionIndex].fields[f] > 0 : 
      String(newSectionData[sectionIndex].fields[f]).trim() !== ''
    )
    const totalFields = Object.keys(newSectionData[sectionIndex].fields).length
    newSectionData[sectionIndex].completed = requiredFields.length >= Math.ceil(totalFields * 0.7) // 70% completion
    
    setSectionData(newSectionData)
    
    // Recalculate valuations when financial data changes
    if (sectionIndex >= 1 && sectionIndex <= 4) {
      setTimeout(() => calculateValuations(), 500)
    }
    
    setTimeout(() => {
      saveToLocalStorage()
    }, 1000)
  }

  const generateAIContent = async (sectionIndex: number) => {
    setIsGenerating(true)
    
    setTimeout(() => {
      const section = sectionData[sectionIndex]
      const mockContent: { [key: string]: { [key: string]: string | number } } = {
        'company-basics': {
          companyName: 'InnovateAI Solutions',
          industry: 'SaaS',
          businessModel: 'B2B SaaS subscription',
          stage: 'Series A',
          foundedYear: 2022,
          employees: 25,
          location: 'Milano, Italia',
          legalStructure: 'SRL Innovativa'
        },
        'financials': {
          currentRevenue: 840000,
          monthlyRecurringRevenue: 70000,
          grossMargin: 85,
          burnRate: 45000,
          cashOnHand: 350000,
          customerCount: 120,
          averageContractValue: 7000,
          customerAcquisitionCost: 350
        },
        'growth-metrics': {
          monthlyGrowthRate: 18,
          yearOverYearGrowth: 250,
          churnRate: 4,
          retentionRate: 96,
          marketShare: 0.5,
          totalAddressableMarket: 2500000000,
          customerGrowthRate: 15,
          revenueGrowthRate: 20
        },
        'competitive-position': {
          competitiveAdvantage: 'AI nativa italiana con supporto locale',
          moat: 'Tecnologia proprietaria + network effects',
          intellectualProperty: '3 brevetti depositati, trademark registrato',
          keyPartnerships: 'Microsoft Partner, AWS Advanced Tier',
          marketPosition: 'Leader mercato italiano PMI',
          brandStrength: 8,
          technologyEdge: 9,
          regulatoryBarriers: 6
        },
        'risk-assessment': {
          marketRisk: 4,
          competitionRisk: 5,
          technologyRisk: 3,
          teamRisk: 2,
          regulatoryRisk: 3,
          financialRisk: 4,
          riskMitigation: 'Diversificazione clienti, R&D investment, team retention',
          contingencyPlan: 'Pivot B2C se necessario, cost reduction plan ready'
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

  const exportValuation = () => {
    const link = document.createElement('a')
    link.href = '#'
    link.download = 'valuation-report.pdf'
    link.click()
    
    alert('Valuation Report esportato in PDF!')
  }

  const currentSectionData = sectionData[currentSection]

  // Calculate average valuation and confidence
  const averageValuation = valuationResults.length > 0 
    ? valuationResults.reduce((sum, result) => sum + result.value, 0) / valuationResults.length 
    : 0
    
  const weightedConfidence = valuationResults.length > 0
    ? valuationResults.reduce((sum, result) => sum + (result.confidence * result.value), 0) / 
      valuationResults.reduce((sum, result) => sum + result.value, 0)
    : 0

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getValuationRange = () => {
    if (valuationResults.length === 0) return { min: 0, max: 0 }
    const values = valuationResults.map(r => r.value)
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }

  const range = getValuationRange()

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
                <Calculator className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Valuation Calculator</span>
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
                onClick={exportValuation}
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
                <Calculator className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Sezioni</h2>
              </div>
              
              <div className="space-y-2">
                {sectionData.map((section, index) => (
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
                        <section.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{section.title}</div>
                      <div className="text-xs text-gray-500">
                        {index + 1} di {sectionData.length}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Valuation Summary */}
              {averageValuation > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Valutazione Media</h3>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        €{(averageValuation / 1000000).toFixed(1)}M
                      </div>
                      <div className={`text-sm ${getConfidenceColor(weightedConfidence)}`}>
                        Confidence: {weightedConfidence.toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Range: €{(range.min / 1000000).toFixed(1)}M - €{(range.max / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>
              )}

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
                      <currentSectionData.icon className="w-5 h-5 text-purple-600" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(currentSectionData.fields).map(([field, value]) => (
                    <div key={field} className={field === 'competitiveAdvantage' || field === 'moat' || field === 'intellectualProperty' || field === 'keyPartnerships' || field === 'riskMitigation' || field === 'contingencyPlan' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}
                        {typeof value === 'number' && field.includes('Rate') && <span className="text-gray-500 ml-1">(%)</span>}
                        {typeof value === 'number' && field.includes('Risk') && <span className="text-gray-500 ml-1">(1-10)</span>}
                        {typeof value === 'number' && (field.includes('Revenue') || field.includes('Value') || field.includes('Cash') || field.includes('Market')) && <span className="text-gray-500 ml-1">(€)</span>}
                      </label>
                      {typeof value === 'string' && (field.includes('advantage') || field.includes('moat') || field.includes('Property') || field.includes('partnerships') || field.includes('mitigation') || field.includes('Plan')) ? (
                        <textarea
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          placeholder={`Descrivi ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                          rows={3}
                        />
                      ) : typeof value === 'string' && field === 'industry' ? (
                        <select
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          <option value="">Seleziona settore</option>
                          <option value="SaaS">SaaS</option>
                          <option value="E-commerce">E-commerce</option>
                          <option value="FinTech">FinTech</option>
                          <option value="HealthTech">HealthTech</option>
                          <option value="EdTech">EdTech</option>
                          <option value="MarTech">MarTech</option>
                          <option value="AI/ML">AI/ML</option>
                          <option value="IoT">IoT</option>
                          <option value="Blockchain">Blockchain</option>
                        </select>
                      ) : typeof value === 'string' && field === 'stage' ? (
                        <select
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          <option value="">Seleziona stage</option>
                          <option value="Pre-Seed">Pre-Seed</option>
                          <option value="Seed">Seed</option>
                          <option value="Series A">Series A</option>
                          <option value="Series B">Series B</option>
                          <option value="Series C+">Series C+</option>
                          <option value="Growth">Growth</option>
                        </select>
                      ) : typeof value === 'string' ? (
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          placeholder={`Inserisci ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />
                      ) : (
                        <input
                          type="number"
                          value={value as number}
                          onChange={(e) => updateSectionField(currentSection, field, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          min="0"
                          max={field.includes('Risk') ? "10" : undefined}
                          step={field.includes('Rate') ? "0.1" : field.includes('Risk') ? "1" : field.includes('Revenue') ? "1000" : "1"}
                        />
                      )}
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

          {/* Valuation Results Panel */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Valuation Methods */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Metodologie</h3>
                </div>
                
                {valuationResults.length > 0 ? (
                  <div className="space-y-4">
                    {valuationResults.map((result, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm text-gray-900">{result.method}</div>
                          <div className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                            {result.confidence}%
                          </div>
                        </div>
                        <div className="text-lg font-bold text-purple-600 mb-1">
                          €{(result.value / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-gray-500">{result.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Compila i dati per vedere le valutazioni</div>
                  </div>
                )}
              </div>

              {/* Valuation Summary */}
              {averageValuation > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-sm text-purple-600 font-medium mb-1">Valutazione Stimata</div>
                    <div className="text-3xl font-bold text-purple-700 mb-2">
                      €{(averageValuation / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-purple-600 mb-4">
                      Confidence: {weightedConfidence.toFixed(0)}%
                    </div>
                    <div className="text-xs text-purple-500">
                      Range: €{(range.min / 1000000).toFixed(1)}M - €{(range.max / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              {currentSection === 4 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Risk Profile</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(currentSectionData.fields).filter(([field]) => field.includes('Risk') && !field.includes('mitigation')).map(([field, value]) => (
                      <div key={field} className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 capitalize">
                          {field.replace('Risk', '').replace(/([A-Z])/g, ' $1')}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                Number(value) <= 3 ? 'bg-green-500' : 
                                Number(value) <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${(Number(value) / 10) * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-sm font-medium w-6">{value}/10</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Export Valutazione</h3>
                <div className="space-y-2">
                  <button
                    onClick={exportValuation}
                    className="w-full flex items-center justify-center gap-2 bg-purple-50 text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Report PDF
                  </button>
                  <button
                    onClick={() => alert('Excel con dettagli metodologie esportato!')}
                    className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Excel Dettagliato
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}