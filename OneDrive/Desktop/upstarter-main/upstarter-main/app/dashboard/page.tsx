'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  BarChart3, CheckCircle, Clock, FileText, Upload, Edit2, Trash2, 
  Check, X, RefreshCw, ArrowRight, Plus, TrendingUp, Users, 
  Lightbulb, Target, Calendar, Bell, Presentation, Calculator,
  DollarSign, Building, Award, Zap
} from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  status: 'analyzing' | 'completed' | 'draft'
  score?: number
  createdAt: string
  lastUpdated: string
}

export default function DashboardMain() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notifications] = useState([
    {
      id: 1,
      type: 'success',
      message: 'Business Plan "InnovateAI" completato con successo',
      time: '1 ora fa'
    },
    {
      id: 2,
      type: 'info', 
      message: 'Proiezioni finanziarie aggiornate - Break-even M18',
      time: '3 ore fa'
    },
    {
      id: 3,
      type: 'warning',
      message: 'Valuation Calculator: nuova metodologia disponibile',
      time: '1 giorno fa'
    }
  ])

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setProjects([
        {
          id: '1',
          name: 'EcoApp - Sostenibilità Digitale',
          status: 'completed',
          score: 87,
          createdAt: '2025-01-25',
          lastUpdated: '2025-01-27'
        },
        {
          id: '2', 
          name: 'FinTech Revolution',
          status: 'analyzing',
          createdAt: '2025-01-27',
          lastUpdated: '2025-01-27'
        },
        {
          id: '3',
          name: 'AI Healthcare Platform',
          status: 'completed',
          score: 92,
          createdAt: '2025-01-26',
          lastUpdated: '2025-01-27'
        }
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'analyzing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completata'
      case 'analyzing':
        return 'In Analisi'
      case 'draft':
        return 'Bozza'
      default:
        return 'Sconosciuto'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700'
      case 'analyzing':
        return 'bg-blue-50 text-blue-700'
      case 'draft':
        return 'bg-yellow-50 text-yellow-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Benvenuto, {session?.user?.name?.split(' ')[0] || 'Founder'}! 👋
        </h1>
        <p className="text-gray-600">
          Il tuo ecosistema completo per trasformare idee in startup di successo
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Progetti Completati</p>
              <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status === 'completed').length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Score Medio</p>
              <p className="text-2xl font-bold text-gray-900">89%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Documenti Creati</p>
              <p className="text-2xl font-bold text-gray-900">7</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Team Connections</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Enhanced with Financial Planning */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            href="/dashboard/new-idea" 
            className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200 hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Analizza Nuova Idea</h3>
            <p className="text-sm text-gray-600">Sistema di validazione AI-powered</p>
          </Link>

          <Link 
            href="/team-up" 
            className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200 hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Trova Co-founder</h3>
            <p className="text-sm text-gray-600">Network di founder e professionisti</p>
          </Link>

          <Link 
            href="/dashboard/pitch-builder" 
            className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 border border-orange-200 hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Presentation className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Pitch Deck Builder</h3>
            <p className="text-sm text-gray-600">Presentazioni AI per investitori</p>
          </Link>

          <Link 
            href="/dashboard/financial-planning" 
            className="group bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 border-2 border-emerald-300 hover:scale-105 relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Zap className="w-3 h-3" />
              HOT
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Financial Planning</h3>
            <p className="text-sm text-gray-600">Ecosistema completo per il funding</p>
          </Link>
        </div>
      </div>

      {/* Financial Planning Spotlight */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Financial Planning Completo</h2>
                <span className="bg-yellow-400 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">
                  4 MODULI ATTIVI
                </span>
              </div>
              <p className="text-emerald-100 mb-6 text-lg">
                Dall'idea al funding: business plan, proiezioni, valutazione e strategie di investimento. 
                Tutto integrato e pronto per gli investitori.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-emerald-500/30 rounded-lg p-3 text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Business Plan</div>
                </div>
                <div className="bg-emerald-500/30 rounded-lg p-3 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Proiezioni</div>
                </div>
                <div className="bg-emerald-500/30 rounded-lg p-3 text-center">
                  <Calculator className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Valuation</div>
                </div>
                <div className="bg-emerald-500/30 rounded-lg p-3 text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Funding</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 ml-6">
              <Link
                href="/dashboard/financial-planning"
                className="flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors font-semibold"
              >
                <Calculator className="w-5 h-5" />
                Esplora i Moduli
              </Link>
              <Link
                href="/dashboard/financial-planning/business-plan"
                className="flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-emerald-600 transition-colors font-semibold"
              >
                <FileText className="w-5 h-5" />
                Inizia Subito
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">I Miei Progetti</h2>
                <Link 
                  href="/dashboard/new-idea"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Nuovo Progetto
                </Link>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                          <div>
                            <div className="w-48 h-4 bg-gray-300 rounded mb-2"></div>
                            <div className="w-32 h-3 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                        <div className="w-20 h-6 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getStatusIcon(project.status)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                              {getStatusText(project.status)}
                            </span>
                            {project.score && (
                              <span className="text-sm text-gray-500">Score: {project.score}%</span>
                            )}
                            <span className="text-sm text-gray-500">
                              Aggiornato {new Date(project.lastUpdated).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Inizia il Tuo Percorso</h3>
                  <p className="text-gray-500 mb-6">Dalla validazione dell'idea al funding round!</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link 
                      href="/dashboard/new-idea"
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Analizza Idea
                    </Link>
                    <Link 
                      href="/dashboard/financial-planning"
                      className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      <Calculator className="w-4 h-4" />
                      Financial Planning
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Notifiche</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notification.type === 'success' ? 'bg-green-500' : 
                      notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Planning Quick Access */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Financial Planning</h3>
            <div className="space-y-3">
              <Link 
                href="/dashboard/financial-planning/business-plan"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">Business Plan</div>
                  <div className="text-xs text-gray-500">Generator completo</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link 
                href="/dashboard/financial-planning/projections"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">Proiezioni</div>
                  <div className="text-xs text-gray-500">Revenue & cash flow</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link 
                href="/dashboard/financial-planning/valuation"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">Valuation</div>
                  <div className="text-xs text-gray-500">5 metodologie</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link 
                href="/dashboard/financial-planning/funding"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">Funding</div>
                  <div className="text-xs text-gray-500">Scenarios & dilution</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistiche</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Progetti questo mese</span>
                </div>
                <span className="font-medium text-gray-900">3</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Score miglioramento</span>
                </div>
                <span className="font-medium text-green-600">+15%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Giorni attivo</span>
                </div>
                <span className="font-medium text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Documenti creati</span>
                </div>
                <span className="font-medium text-gray-900">7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}