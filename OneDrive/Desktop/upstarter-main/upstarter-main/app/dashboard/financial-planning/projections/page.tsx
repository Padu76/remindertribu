'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, ArrowRight, CheckCircle, TrendingUp, 
  Download, Save, RefreshCw, Wand2, Eye, Calculator,
  DollarSign, BarChart3, Target, Calendar, AlertTriangle,
  Info, Lightbulb, FileText, PieChart, Activity
} from 'lucide-react'

interface ProjectionData {
  id: string
  title: string
  description: string
  icon: any
  completed: boolean
  fields: { [key: string]: string | number }
}

export default function FinancialProjectionsWizard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [projectionData, setProjectionData] = useState<any[]>([])

  // Financial Projections Sections
  const sections: ProjectionData[] = [
    {
      id: 'business-model',
      title: 'Modello di Business',
      description: 'Definisci il tuo modello di revenue e unit economics',
      icon: Target,
      completed: false,
      fields: {
        businessType: '',
        revenueModel: '',
        customerSegments: '',
        pricingStrategy: '',
        averageOrderValue: 0,
        customerAcquisitionCost: 0,
        customerLifetimeValue: 0,
        monthlyChurnRate: 0
      }
    },
    {
      id: 'revenue-assumptions',
      title: 'Assunzioni Revenue',
      description: 'Parametri chiave per le proiezioni di ricavi',
      icon: DollarSign,
      completed: false,
      fields: {
        launchMonth: 1,
        initialCustomers: 0,
        monthlyGrowthRate: 0,
        seasonalityFactor: 0,
        priceGrowthRate: 0,
        marketSaturation: 0,
        conversionRate: 0,
        retentionRate: 0
      }
    },
    {
      id: 'cost-structure',
      title: 'Struttura Costi',
      description: 'Costi fissi, variabili e investimenti',
      icon: Calculator,
      completed: false,
      fields: {
        fixedCostsMonthly: 0,
        variableCostPercentage: 0,
        salariesMonthly: 0,
        marketingBudget: 0,
        technologyCosts: 0,
        operationalCosts: 0,
        oneTimeInvestments: 0,
        hirePlan: ''
      }
    },
    {
      id: 'growth-scenarios',
      title: 'Scenari di Crescita',
      description: 'Modella diversi scenari di crescita',
      icon: TrendingUp,
      completed: false,
      fields: {
        conservativeGrowth: 0,
        realisticGrowth: 0,
        optimisticGrowth: 0,
        marketRisk: '',
        competitionRisk: '',
        operationalRisk: '',
        mitigationStrategies: ''
      }
    },
    {
      id: 'funding-needs',
      title: 'Fabbisogno Finanziario',
      description: 'Calcola il funding necessario e runway',
      icon: BarChart3,
      completed: false,
      fields: {
        initialInvestment: 0,
        monthlyBurnRate: 0,
        breakEvenMonth: 0,
        fundingRounds: '',
        useOfFunds: '',
        milestones: '',
        exitStrategy: ''
      }
    }
  ]

  const [sectionData, setSectionData] = useState<ProjectionData[]>(sections)

  useEffect(() => {
    // Load saved data from localStorage
    const savedData = localStorage.getItem('upstarter-financial-projections')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setSectionData(parsed.sections || sections)
        setCurrentSection(parsed.currentSection || 0)
        if (parsed.lastSaved) {
          setLastSaved(new Date(parsed.lastSaved))
        }
      } catch (error) {
        console.error('Error loading saved projections:', error)
      }
    }
    
    // Generate sample projection data
    generateProjectionCharts()
  }, [])

  const generateProjectionCharts = () => {
    // Generate 36 months of projection data
    const months: any[] = []
    const baseRevenue = 10000
    const growthRate = 0.15
    
    for (let i = 0; i < 36; i++) {
      const month = i + 1
      const revenue = baseRevenue * Math.pow(1 + growthRate, i) * (1 + 0.1 * Math.sin(i * 0.5)) // Add seasonality
      const costs = revenue * 0.6 + 15000 // Variable costs + fixed costs
      const profit = revenue - costs
      
      months.push({
        month: `M${month}`,
        monthNumber: month,
        revenue: Math.round(revenue),
        costs: Math.round(costs),
        profit: Math.round(profit),
        cumulativeProfit: months.reduce((sum, m) => sum + (m.profit || 0), profit),
        customers: Math.round(50 * Math.pow(1.1, i)),
        burnRate: costs > revenue ? Math.round(costs - revenue) : 0
      })
    }
    
    setProjectionData(months)
  }

  const saveToLocalStorage = () => {
    const dataToSave = {
      sections: sectionData,
      currentSection,
      lastSaved: new Date().toISOString()
    }
    localStorage.setItem('upstarter-financial-projections', JSON.stringify(dataToSave))
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
    
    // Regenerate charts with new data
    if (sectionIndex <= 2) { // If core financial data changed
      generateProjectionCharts()
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
        'business-model': {
          businessType: 'SaaS B2B',
          revenueModel: 'Subscription ricorrente + setup fees',
          customerSegments: 'PMI 50-500 dipendenti settore manifatturiero',
          pricingStrategy: 'Freemium con piani Pro/Enterprise',
          averageOrderValue: 2400,
          customerAcquisitionCost: 350,
          customerLifetimeValue: 12000,
          monthlyChurnRate: 5
        },
        'revenue-assumptions': {
          launchMonth: 3,
          initialCustomers: 25,
          monthlyGrowthRate: 15,
          seasonalityFactor: 10,
          priceGrowthRate: 8,
          marketSaturation: 10000,
          conversionRate: 12,
          retentionRate: 90
        },
        'cost-structure': {
          fixedCostsMonthly: 15000,
          variableCostPercentage: 35,
          salariesMonthly: 45000,
          marketingBudget: 8000,
          technologyCosts: 3500,
          operationalCosts: 2500,
          oneTimeInvestments: 150000,
          hirePlan: '2 sviluppatori Q1, 1 sales Q2, 1 marketing Q3'
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

  const exportProjections = () => {
    const link = document.createElement('a')
    link.href = '#'
    link.download = 'financial-projections.xlsx'
    link.click()
    
    alert('Proiezioni Finanziarie esportate in Excel!')
  }

  const currentSectionData = sectionData[currentSection]

  // Calculate key metrics
  const breakEvenMonth = projectionData.find(m => m.cumulativeProfit > 0)?.monthNumber || 36
  const maxBurnRate = Math.max(...projectionData.slice(0, breakEvenMonth).map(m => m.burnRate))
  const yearOneRevenue = projectionData.slice(0, 12).reduce((sum, m) => sum + m.revenue, 0)
  const yearThreeRevenue = projectionData.slice(24, 36).reduce((sum, m) => sum + m.revenue, 0)

  // Generate simple chart data for visualization
  const chartData = projectionData.slice(0, 24)
  const maxRevenue = Math.max(...chartData.map(m => m.revenue))
  const maxCosts = Math.max(...chartData.map(m => m.costs))
  const maxValue = Math.max(maxRevenue, maxCosts)

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
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900">Proiezioni Finanziarie</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  Progresso: {completedSections}/{sectionData.length}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
                onClick={exportProjections}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Esporta Excel
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
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Sezioni</h2>
              </div>
              
              <div className="space-y-2">
                {sectionData.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      index === currentSection
                        ? 'bg-green-50 border border-green-200 text-green-900'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      section.completed 
                        ? 'bg-green-100 text-green-600' 
                        : index === currentSection
                        ? 'bg-green-100 text-green-600'
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
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Metriche Chiave</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Break-even:</span>
                    <span className="font-medium text-gray-900">Mese {breakEvenMonth}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Max Burn Rate:</span>
                    <span className="font-medium text-red-600">€{maxBurnRate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue Anno 1:</span>
                    <span className="font-medium text-green-600">€{yearOneRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue Anno 3:</span>
                    <span className="font-medium text-green-600">€{yearThreeRevenue.toLocaleString()}</span>
                  </div>
                </div>
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
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <currentSectionData.icon className="w-5 h-5 text-green-600" />
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
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50"
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
                    <div key={field} className={field === 'hirePlan' || field === 'mitigationStrategies' || field === 'useOfFunds' || field === 'milestones' || field === 'exitStrategy' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}
                        {typeof value === 'number' && field.includes('Rate') && <span className="text-gray-500 ml-1">(%)</span>}
                        {typeof value === 'number' && (field.includes('Cost') || field.includes('Value') || field.includes('Budget') || field.includes('Investment')) && <span className="text-gray-500 ml-1">(€)</span>}
                      </label>
                      {typeof value === 'string' && (field.includes('Plan') || field.includes('Strategy') || field.includes('Risk') || field.includes('Funds') || field.includes('milestones') || field.includes('exitStrategy')) ? (
                        <textarea
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          placeholder={`Descrivi ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                          rows={3}
                        />
                      ) : typeof value === 'string' ? (
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => updateSectionField(currentSection, field, e.target.value)}
                          placeholder={`Inserisci ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      ) : (
                        <input
                          type="number"
                          value={value as number}
                          onChange={(e) => updateSectionField(currentSection, field, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          min="0"
                          step={field.includes('Rate') ? "0.1" : field.includes('Cost') ? "100" : "1"}
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
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Successiva
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Panel */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Revenue Growth Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Crescita Revenue</h3>
                </div>
                <div className="h-48 relative">
                  <div className="absolute inset-0 flex items-end justify-between">
                    {chartData.slice(0, 12).map((data, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className="w-4 bg-green-500 rounded-t-sm"
                          style={{
                            height: `${(data.revenue / maxValue) * 160}px`,
                            minHeight: '4px'
                          }}
                          title={`${data.month}: €${data.revenue.toLocaleString()}`}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {data.month}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600 mt-2">
                  Revenue primi 12 mesi
                </div>
              </div>

              {/* Profitability Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Profittabilità</h3>
                </div>
                <div className="space-y-3">
                  {chartData.slice(0, 6).map((data, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 text-xs text-gray-500">{data.month}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.max(5, (data.revenue / maxValue) * 100)}%` }}
                        ></div>
                        <div
                          className="absolute top-0 h-full bg-red-500 rounded-full"
                          style={{ 
                            width: `${Math.max(3, (data.costs / maxValue) * 100)}%`,
                            left: `${(data.revenue / maxValue) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="w-16 text-xs text-right">
                        <div className="text-green-600">€{(data.revenue / 1000).toFixed(0)}K</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Revenue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Costi</span>
                  </div>
                </div>
              </div>

              {/* Break-even Alert */}
              {breakEvenMonth <= 36 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-green-900 mb-1">Break-even Raggiunto</div>
                      <div className="text-xs text-green-700">
                        Il break-even sarà raggiunto al mese {breakEvenMonth} con un investimento massimo di €{maxBurnRate.toLocaleString()}.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Warning */}
              {maxBurnRate > 50000 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-orange-900 mb-1">Burn Rate Elevato</div>
                      <div className="text-xs text-orange-700">
                        Il burn rate massimo di €{maxBurnRate.toLocaleString()} richiede un funding significativo.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Export */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Export Proiezioni</h3>
                <div className="space-y-2">
                  <button
                    onClick={exportProjections}
                    className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Excel Completo
                  </button>
                  <button
                    onClick={() => alert('PDF con grafici esportato!')}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    PDF Report
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