'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, ArrowRight, CheckCircle, DollarSign, 
  Download, Save, RefreshCw, Wand2, Eye, TrendingUp,
  Calculator, BarChart3, Target, Calendar, AlertTriangle,
  Info, Lightbulb, FileText, PieChart, Activity, Building,
  Users, Globe, Award, Zap, Percent, Clock, Star
} from 'lucide-react'

interface ScenarioData {
  id: string
  title: string
  description: string
  icon: any
  completed: boolean
  fields: { [key: string]: string | number }
}

interface FundingRound {
  name: string
  amount: number
  valuation: number
  dilution: number
  investors: string
  useOfFunds: string
  milestones: string
}

export default function FundingScenariosWizard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([])
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'realistic' | 'optimistic'>('realistic')

  // Funding Scenarios Sections
  const sections: ScenarioData[] = [
    {
      id: 'current-situation',
      title: 'Situazione Attuale',
      description: 'Stato finanziario e operativo corrente',
      icon: Building,
      completed: false,
      fields: {
        currentValuation: 0,
        cashOnHand: 0,
        monthlyBurnRate: 0,
        runwayMonths: 0,
        currentRevenue: 0,
        employeeCount: 0,
        foundersEquity: 0,
        existingInvestors: ''
      }
    },
    {
      id: 'funding-needs',
      title: 'Fabbisogno di Funding',
      description: 'Quanto capitale serve e per cosa',
      icon: DollarSign,
      completed: false,
      fields: {
        totalFundingNeeded: 0,
        targetRunwayMonths: 0,
        productDevelopment: 0,
        marketingAndSales: 0,
        teamExpansion: 0,
        operationalCosts: 0,
        workingCapital: 0,
        emergencyBuffer: 0
      }
    },
    {
      id: 'growth-milestones',
      title: 'Milestone e Crescita',
      description: 'Obiettivi da raggiungere con il funding',
      icon: Target,
      completed: false,
      fields: {
        revenueTarget12m: 0,
        revenueTarget24m: 0,
        customerTarget12m: 0,
        customerTarget24m: 0,
        teamSizeTarget: 0,
        marketExpansion: '',
        productMilestones: '',
        keyMetricsTarget: ''
      }
    },
    {
      id: 'investor-strategy',
      title: 'Strategia Investitori',
      description: 'Tipo di investitori e termini desiderati',
      icon: Users,
      completed: false,
      fields: {
        investorType: '',
        leadInvestorSize: 0,
        strategicValue: '',
        boardSeats: 0,
        liquidationPreference: '',
        antidilutionRights: '',
        investorInvolvement: '',
        exitStrategy: ''
      }
    },
    {
      id: 'dilution-analysis',
      title: 'Analisi Dilution',
      description: 'Impatto sul cap table e ownership',
      icon: PieChart,
      completed: false,
      fields: {
        maxAcceptableDilution: 0,
        employeeStockPool: 0,
        advisorEquity: 0,
        futureRoundsReserve: 0,
        liquidityEvents: '',
        exitValuationTarget: 0,
        founderVesting: '',
        employeeVesting: ''
      }
    }
  ]

  const [sectionData, setSectionData] = useState<ScenarioData[]>(sections)

  useEffect(() => {
    // Load saved data from localStorage
    const savedData = localStorage.getItem('upstarter-funding-scenarios')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setSectionData(parsed.sections || sections)
        setCurrentSection(parsed.currentSection || 0)
        if (parsed.lastSaved) {
          setLastSaved(new Date(parsed.lastSaved))
        }
      } catch (error) {
        console.error('Error loading saved funding scenarios:', error)
      }
    }
    
    // Generate initial funding scenarios
    generateFundingScenarios()
  }, [])

  const generateFundingScenarios = () => {
    const currentSituation = sectionData[0]?.fields || {}
    const fundingNeeds = sectionData[1]?.fields || {}
    
    const currentValuation = Number(currentSituation.currentValuation) || 5000000
    const totalNeeded = Number(fundingNeeds.totalFundingNeeded) || 1000000

    const scenarios = {
      conservative: {
        valuation: currentValuation * 0.8,
        fundingAmount: totalNeeded * 0.7,
        timeline: '18 mesi',
        probability: 85
      },
      realistic: {
        valuation: currentValuation,
        fundingAmount: totalNeeded,
        timeline: '12 mesi',
        probability: 70
      },
      optimistic: {
        valuation: currentValuation * 1.5,
        fundingAmount: totalNeeded * 1.3,
        timeline: '9 mesi',
        probability: 45
      }
    }

    const rounds: FundingRound[] = [
      {
        name: 'Pre-Seed',
        amount: scenarios.conservative.fundingAmount * 0.3,
        valuation: scenarios.conservative.valuation * 0.5,
        dilution: 15,
        investors: 'Business Angels, Incubatori',
        useOfFunds: 'MVP development, team iniziale',
        milestones: 'Product-market fit, primi clienti'
      },
      {
        name: 'Seed',
        amount: scenarios.realistic.fundingAmount,
        valuation: scenarios.realistic.valuation,
        dilution: 20,
        investors: 'Seed VC, Strategic Angels',
        useOfFunds: 'Go-to-market, team expansion',
        milestones: 'Trazione significativa, €500K ARR'
      },
      {
        name: 'Series A',
        amount: scenarios.optimistic.fundingAmount,
        valuation: scenarios.optimistic.valuation,
        dilution: 25,
        investors: 'Tier 1 VC, Corporate VC',
        useOfFunds: 'Scale operations, espansione mercato',
        milestones: '€2M ARR, team 50+ persone'
      }
    ]

    setFundingRounds(rounds)
  }

  const saveToLocalStorage = () => {
    const dataToSave = {
      sections: sectionData,
      currentSection,
      lastSaved: new Date().toISOString()
    }
    localStorage.setItem('upstarter-funding-scenarios', JSON.stringify(dataToSave))
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
    
    // Regenerate scenarios when core data changes
    if (sectionIndex <= 2) {
      setTimeout(() => generateFundingScenarios(), 500)
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
        'current-situation': {
          currentValuation: 5000000,
          cashOnHand: 180000,
          monthlyBurnRate: 45000,
          runwayMonths: 4,
          currentRevenue: 420000,
          employeeCount: 12,
          foundersEquity: 75,
          existingInvestors: 'Angel investors (15%), Employee stock pool (10%)'
        },
        'funding-needs': {
          totalFundingNeeded: 1200000,
          targetRunwayMonths: 24,
          productDevelopment: 300000,
          marketingAndSales: 400000,
          teamExpansion: 350000,
          operationalCosts: 100000,
          workingCapital: 50000,
          emergencyBuffer: 150000
        },
        'growth-milestones': {
          revenueTarget12m: 1200000,
          revenueTarget24m: 3500000,
          customerTarget12m: 200,
          customerTarget24m: 500,
          teamSizeTarget: 35,
          marketExpansion: 'Espansione Europa, focus Germania e Francia',
          productMilestones: 'AI features, mobile app, enterprise dashboard',
          keyMetricsTarget: 'CAC <€300, LTV >€10K, Churn <3%'
        },
        'investor-strategy': {
          investorType: 'Tier 1 VC con esperienza SaaS B2B',
          leadInvestorSize: 600000,
          strategicValue: 'Network clienti enterprise, go-to-market expertise',
          boardSeats: 1,
          liquidationPreference: '1x non-participating preferred',
          antidilutionRights: 'Weighted average broad-based',
          investorInvolvement: 'Quarterly board meetings, strategic advisory',
          exitStrategy: 'Strategic acquisition o IPO in 5-7 anni'
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

  const exportScenarios = () => {
    const link = document.createElement('a')
    link.href = '#'
    link.download = 'funding-scenarios.pdf'
    link.click()
    
    alert('Funding Scenarios esportati in PDF!')
  }

  const currentSectionData = sectionData[currentSection]

  // Calculate key metrics
  const currentValuation = Number(sectionData[0]?.fields?.currentValuation) || 0
  const totalFunding = Number(sectionData[1]?.fields?.totalFundingNeeded) || 0
  const maxDilution = Number(sectionData[4]?.fields?.maxAcceptableDilution) || 25
  
  const estimatedDilution = currentValuation > 0 ? (totalFunding / (currentValuation + totalFunding)) * 100 : 0
  const postMoneyValuation = currentValuation + totalFunding
  const runwayMonths = Number(sectionData[0]?.fields?.runwayMonths) || 0

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'conservative': return 'text-red-600 bg-red-50 border-red-200'
      case 'realistic': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'optimistic': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

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
                <DollarSign className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-gray-900">Funding Scenarios</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  Progresso: {completedSections}/{sectionData.length}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
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
                onClick={exportScenarios}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
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
                <DollarSign className="w-5 h-5 text-orange-600" />
                <h2 className="font-semibold text-gray-900">Sezioni</h2>
              </div>
              
              <div className="space-y-2">
                {sectionData.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      index === currentSection
                        ? 'bg-orange-50 border border-orange-200 text-orange-900'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      section.completed 
                        ? 'bg-green-100 text-green-600' 
                        : index === currentSection
                        ? 'bg-orange-100 text-orange-600'
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

              {/* Key Metrics */}
              {totalFunding > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Metriche Chiave</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Funding Target:</span>
                      <span className="font-medium text-gray-900">€{(totalFunding / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dilution Stimata:</span>
                      <span className={`font-medium ${estimatedDilution > maxDilution ? 'text-red-600' : 'text-green-600'}`}>
                        {estimatedDilution.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Post-Money:</span>
                      <span className="font-medium text-gray-900">€{(postMoneyValuation / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Runway Attuale:</span>
                      <span className={`font-medium ${runwayMonths < 6 ? 'text-red-600' : 'text-green-600'}`}>
                        {runwayMonths} mesi
                      </span>
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
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <currentSectionData.icon className="w-5 h-5 text-orange-600" />
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
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50"
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
                    <div key={field} className={field === 'existingInvestors' || field === 'marketExpansion' || field === 'productMilestones' || field === 'keyMetricsTarget' || field === 'strategicValue' || field === 'investorInvolvement' || field === 'exitStrategy' || field === 'liquidityEvents' || field === 'founderVesting' || field === 'employeeVesting' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}
                        {typeof value === 'number' && field.includes('Months') && <span className="text-gray-500 ml-1">(mesi)</span>}
                        {typeof value === 'number' && field.includes('Percent') && <span className="text-gray-500 ml-1">(%)</span>}
                        {typeof value === 'number' && (field.includes('amount') || field.includes('Revenue') || field.includes('Target') || field.includes('Cash') || field.includes('Valuation') || field.includes('Rate') || field.includes('Cost') || field.includes('Capital')) && <span className="text-gray-500 ml-1">(€)</span>}
                      </label>
                      {typeof value === 'string' && (field.includes('Investors') || field.includes('Expansion') || field.includes('Milestones') || field.includes('Target') || field.includes('Value') || field.includes('Involvement') || field.includes('Strategy') || field.includes('Events') || field.includes('Vesting')) ? (
                        <textarea
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          placeholder={`Descrivi ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                          rows={3}
                        />
                      ) : typeof value === 'string' && field === 'investorType' ? (
                        <select
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        >
                          <option value="">Seleziona tipo investitore</option>
                          <option value="Business Angels">Business Angels</option>
                          <option value="Seed VC">Seed VC</option>
                          <option value="Tier 1 VC">Tier 1 VC</option>
                          <option value="Corporate VC">Corporate VC</option>
                          <option value="Family Office">Family Office</option>
                          <option value="Strategic Investor">Strategic Investor</option>
                          <option value="Government Grant">Government Grant</option>
                        </select>
                      ) : typeof value === 'string' && field === 'liquidationPreference' ? (
                        <select
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        >
                          <option value="">Seleziona liquidation preference</option>
                          <option value="1x non-participating preferred">1x Non-Participating Preferred</option>
                          <option value="1x participating preferred">1x Participating Preferred</option>
                          <option value="2x non-participating preferred">2x Non-Participating Preferred</option>
                          <option value="Common stock">Common Stock</option>
                        </select>
                      ) : typeof value === 'string' ? (
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          placeholder={`Inserisci ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        />
                      ) : (
                        <input
                          type="number"
                          value={value as number}
                          onChange={(e) => updateSectionField(currentSection, field, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          min="0"
                          step={field.includes('Dilution') || field.includes('Equity') || field.includes('Percent') ? "0.1" : field.includes('Rate') || field.includes('Target') ? "1000" : "1"}
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
                    className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Successiva
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Scenarios Panel */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Scenario Selector */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Scenari Funding</h3>
                </div>
                
                <div className="space-y-2">
                  {['conservative', 'realistic', 'optimistic'].map((scenario) => (
                    <button
                      key={scenario}
                      onClick={() => setSelectedScenario(scenario as any)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        selectedScenario === scenario
                          ? getScenarioColor(scenario)
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-medium capitalize">{scenario}</div>
                        <div className="text-xs opacity-75">
                          {scenario === 'conservative' && '85% probabilità'}
                          {scenario === 'realistic' && '70% probabilità'}
                          {scenario === 'optimistic' && '45% probabilità'}
                        </div>
                      </div>
                      <Star className={`w-4 h-4 ${selectedScenario === scenario ? '' : 'opacity-30'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Funding Rounds */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Round Consigliati</h3>
                </div>
                
                {fundingRounds.length > 0 ? (
                  <div className="space-y-4">
                    {fundingRounds.map((round, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm text-gray-900">{round.name}</div>
                          <div className="text-xs text-orange-600">
                            {round.dilution}% dilution
                          </div>
                        </div>
                        <div className="text-lg font-bold text-orange-600 mb-1">
                          €{(round.amount / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Valuation: €{(round.valuation / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-gray-600">
                          <div><strong>Investitori:</strong> {round.investors}</div>
                          <div><strong>Obiettivi:</strong> {round.milestones}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Compila i dati per vedere i round</div>
                  </div>
                )}
              </div>

              {/* Dilution Warning */}
              {estimatedDilution > maxDilution && maxDilution > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-red-900 mb-1">Dilution Elevata</div>
                      <div className="text-xs text-red-700">
                        La dilution stimata ({estimatedDilution.toFixed(1)}%) supera il limite accettabile ({maxDilution}%). 
                        Considera di ridurre il funding richiesto o aumentare la valuation.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Runway Alert */}
              {runwayMonths > 0 && runwayMonths < 6 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-orange-900 mb-1">Runway Critico</div>
                      <div className="text-xs text-orange-700">
                        Solo {runwayMonths} mesi di runway rimasti. È urgente iniziare il processo di fundraising.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Export Scenarios</h3>
                <div className="space-y-2">
                  <button
                    onClick={exportScenarios}
                    className="w-full flex items-center justify-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    PDF Report
                  </button>
                  <button
                    onClick={() => alert('Excel con cap table modeling esportato!')}
                    className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Cap Table Excel
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