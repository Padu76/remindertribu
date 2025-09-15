'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  Calculator, TrendingUp, DollarSign, PieChart, 
  CheckCircle, ArrowRight, FileText, BarChart3, 
  Target, Lightbulb, Star, Users, Building, Calendar
} from 'lucide-react'

export default function FinancialPlanningPage() {
  const { data: session } = useSession()

  const modules = [
    {
      id: 'business-plan',
      title: 'Business Plan Generator',
      description: 'Crea business plan professionali collegati alle tue analisi esistenti',
      icon: FileText,
      features: [
        'Executive Summary automatico',
        'Market Analysis da dati esistenti',
        'Competitive Landscape integrato',
        'Template investor-ready',
        'Export PDF professionale'
      ],
      color: 'blue',
      href: '/dashboard/financial-planning/business-plan',
      isReady: true
    },
    {
      id: 'projections',
      title: 'Proiezioni Finanziarie',
      description: 'Modelli avanzati per revenue forecast e crescita aziendale',
      icon: TrendingUp,
      features: [
        'Revenue forecasting AI-powered',
        'Cash flow projections',
        'Break-even analysis',
        'Scenario modeling (best/worst/realistic)',
        'Unit economics calculator'
      ],
      color: 'green',
      href: '/dashboard/financial-planning/projections',
      isReady: true
    },
    {
      id: 'valuation',
      title: 'Valuation Calculator',
      description: 'Calcola la valutazione della tua startup con metodologie consolidate',
      icon: Calculator,
      features: [
        'Multiple valuation methods',
        'DCF model semplificato',
        'Comparable company analysis',
        'Risk assessment integrato',
        'Investor presentation ready'
      ],
      color: 'purple',
      href: '/dashboard/financial-planning/valuation',
      isReady: true
    },
    {
      id: 'funding',
      title: 'Funding Scenarios',
      description: 'Pianifica round di investimento e strategie di crescita',
      icon: DollarSign,
      features: [
        'Funding needs calculator',
        'Dilution scenarios',
        'Investor matching suggestions',
        'Milestone-based funding',
        'Exit strategy planning'
      ],
      color: 'orange',
      href: '/dashboard/financial-planning/funding',
      isReady: true
    }
  ]

  const testimonials = [
    {
      name: 'Marco Verdi',
      company: 'TechStartup SRL',
      text: 'Il Business Plan Generator mi ha fatto risparmiare settimane di lavoro. Template perfetto per presentare agli investitori.',
      rating: 5,
      avatar: 'MV'
    },
    {
      name: 'Giulia Rossi',
      company: 'EcoInnovation',
      text: 'Le proiezioni finanziarie sono incredibilmente accurate. Abbiamo ottenuto il funding grazie a questi modelli.',
      rating: 5,
      avatar: 'GR'
    },
    {
      name: 'Alessandro Bianchi',
      company: 'FinTech Solutions',
      text: 'Valuation Calculator preciso e professionale. Gli investitori hanno apprezzato la metodologia.',
      rating: 5,
      avatar: 'AB'
    },
    {
      name: 'Francesca Neri',
      company: 'HealthTech Italia',
      text: 'Funding Scenarios mi ha aiutato a strutturare il round Series A. Raccolti €2M con dilution ottimale.',
      rating: 5,
      avatar: 'FN'
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'bg-blue-100 text-blue-600',
          accent: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'green':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'bg-green-100 text-green-600',
          accent: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700'
        }
      case 'purple':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: 'bg-purple-100 text-purple-600',
          accent: 'text-purple-600',
          button: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'orange':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'bg-orange-100 text-orange-600',
          accent: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'bg-gray-100 text-gray-600',
          accent: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700'
        }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Calculator className="w-8 h-8 text-purple-200" />
              <span className="text-purple-200 font-semibold text-lg">Financial Planning</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Pianificazione Finanziaria
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Completa
              </span>
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Dall'idea al funding: business plan, proiezioni, valutazione e strategie di investimento. 
              Tutto integrato con AI e pronto per gli investitori.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#modules"
                className="flex items-center justify-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-lg hover:bg-purple-50 transition-colors text-lg font-semibold"
              >
                <Calculator className="w-5 h-5" />
                Esplora i Moduli
              </Link>
              <Link
                href="/dashboard/financial-planning/business-plan"
                className="flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-purple-600 transition-colors text-lg font-semibold"
              >
                Inizia Subito
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-gray-600">Business Plan Generati</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">€100M+</div>
              <div className="text-gray-600">Funding Ottenuto</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">350+</div>
              <div className="text-gray-600">Startup Valutate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">24h</div>
              <div className="text-gray-600">Setup Completo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div id="modules" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">4 Moduli Integrati</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un ecosistema completo per il financial planning dalla validazione dell'idea al funding round
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {modules.map((module) => {
              const colors = getColorClasses(module.color)
              return (
                <div
                  key={module.id}
                  className={`bg-white rounded-2xl shadow-sm border-2 ${colors.border} p-8 hover:shadow-lg transition-all duration-200 relative overflow-hidden`}
                >
                  {/* Ready Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Disponibile
                    </span>
                  </div>

                  <div className={`w-16 h-16 ${colors.icon} rounded-xl flex items-center justify-center mb-6`}>
                    <module.icon className="w-8 h-8" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{module.title}</h3>
                  <p className="text-gray-600 mb-6">{module.description}</p>

                  <ul className="space-y-3 mb-8">
                    {module.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${colors.accent}`} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={module.href}
                    className={`flex items-center justify-center gap-2 ${colors.button} text-white px-6 py-3 rounded-lg transition-colors font-semibold`}
                  >
                    Apri Modulo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Integration Showcase */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Integrazione Perfetta</h3>
              <p className="text-gray-600">
                I 4 moduli lavorano insieme per creare un flusso di pianificazione finanziaria completo
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Business Plan</h4>
                <p className="text-sm text-gray-600">Definisci strategia e mercato</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">2. Proiezioni</h4>
                <p className="text-sm text-gray-600">Modella crescita e finanziari</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">3. Valuation</h4>
                <p className="text-sm text-gray-600">Calcola valore della startup</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">4. Funding</h4>
                <p className="text-sm text-gray-600">Pianifica round investimento</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Flusso di Lavoro</h2>
            <p className="text-xl text-gray-600">
              Un processo step-by-step per preparare la tua startup al funding
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategia & Piano</h3>
              <p className="text-gray-600 leading-relaxed">
                Crea un business plan completo con market analysis, competitive landscape e roadmap prodotto.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Modelli Finanziari</h3>
              <p className="text-gray-600 leading-relaxed">
                Sviluppa proiezioni accurate per revenue, costs, cash flow e break-even analysis.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Valutazione</h3>
              <p className="text-gray-600 leading-relaxed">
                Calcola la valuation con 5 metodologie diverse per negoziare da posizione di forza.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Strategy</h3>
              <p className="text-gray-600 leading-relaxed">
                Pianifica round, dilution e investor targeting per massimizzare il successo del fundraising.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">
              Startup che hanno ottenuto funding con Financial Planning
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 text-sm italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Calculator className="w-16 h-16 text-yellow-300 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">
            Inizia la Tua Pianificazione Finanziaria
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Tutti i 4 moduli sono pronti e completamente gratuiti. 
            Dall'idea al funding in un'unica piattaforma integrata.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/financial-planning/business-plan"
              className="flex items-center justify-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-lg hover:bg-purple-50 transition-colors text-lg font-semibold"
            >
              <FileText className="w-5 h-5" />
              Inizia con Business Plan
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-purple-600 transition-colors text-lg font-semibold"
            >
              Torna alla Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-purple-200 text-sm mt-6">
            Tutti i moduli gratuiti • Salvataggio automatico • Export professionale • AI integrata
          </p>
        </div>
      </div>
    </div>
  )
}