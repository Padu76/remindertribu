'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, BarChart3, Users, TrendingUp, Settings, 
  FileText, PlusCircle, Lightbulb, Target, LogOut, 
  MessageSquare, Upload, Brain, Star
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [projectCount, setProjectCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [draftCount, setDraftCount] = useState(0)

  useEffect(() => {
    const updateCounts = () => {
      try {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const completed = projects.filter((p: any) => p.status === 'completed').length
        const drafts = projects.filter((p: any) => p.status === 'draft').length
        
        setProjectCount(projects.length)
        setCompletedCount(completed)
        setDraftCount(drafts)
        
        console.log('Sidebar counts updated:', {
          total: projects.length,
          completed,
          drafts
        })
      } catch (error) {
        console.error('Error reading projects count:', error)
        setProjectCount(0)
        setCompletedCount(0)
        setDraftCount(0)
      }
    }
    
    // Aggiorna all'avvio
    updateCounts()
    
    // Listener per aggiornamenti localStorage (da altre tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'projects') {
        updateCounts()
      }
    }
    
    // Listener custom per aggiornamenti interni
    const handleProjectsUpdate = () => {
      updateCounts()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('projectsUpdated', handleProjectsUpdate)
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('projectsUpdated', handleProjectsUpdate)
    }
  }, [])

  const menuItems = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      description: 'Panoramica generale'
    },
    {
      name: 'I Miei Progetti',
      icon: BarChart3,
      path: '/dashboard/projects',
      description: 'Gestisci i tuoi progetti',
      badge: projectCount > 0 ? projectCount : null,
      stats: projectCount > 0 ? `${completedCount} completati, ${draftCount} bozze` : null
    },
    {
      name: 'TeamUp',
      icon: Users,
      path: '/team-up',
      description: 'Trova co-founder'
    },
    {
      name: 'Investitori',
      icon: TrendingUp,
      path: '/dashboard/investors',
      description: 'Database investitori',
      comingSoon: true
    },
    {
      name: 'Impostazioni',
      icon: Settings,
      path: '/dashboard/settings',
      description: 'Configurazioni',
      comingSoon: true
    }
  ]

  const quickActions = [
    {
      name: 'Questionario Guidato',
      icon: MessageSquare,
      path: '/dashboard/guided',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Analisi con 18 domande'
    },
    {
      name: 'Carica Documento',
      icon: Upload,
      path: '/dashboard/document',
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Upload business plan'
    }
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">UpStarter</h1>
            <p className="text-xs text-gray-500">AI Startup Analyzer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Menu Principale
          </p>
          {menuItems.map((item) => (
            <div key={item.name} className="mb-1">
              <button
                onClick={() => {
                  if (!item.comingSoon) {
                    router.push(item.path)
                  }
                }}
                className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : item.comingSoon
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                disabled={item.comingSoon}
              >
                <item.icon className={`mr-3 flex-shrink-0 h-4 w-4 ${
                  isActive(item.path) ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className="flex-1 text-left">{item.name}</span>
                {item.badge && (
                  <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                    {item.badge}
                  </span>
                )}
                {item.comingSoon && (
                  <span className="ml-2 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                    Soon
                  </span>
                )}
              </button>
              {item.stats && isActive(item.path) && (
                <div className="ml-6 mt-1 text-xs text-gray-500">
                  {item.stats}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Crea Analisi
          </p>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.name}
                onClick={() => {
                  if (action.path === '/dashboard/document') {
                    router.push('/dashboard')
                    // Trigger document analyzer
                    setTimeout(() => {
                      const event = new CustomEvent('showDocumentAnalyzer')
                      window.dispatchEvent(event)
                    }, 100)
                  } else {
                    router.push(action.path)
                  }
                }}
                className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-white transition-colors ${action.color}`}
                title={action.description}
              >
                <action.icon className="mr-3 flex-shrink-0 h-4 w-4" />
                <span className="flex-1 text-left">{action.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        {projectCount > 0 && (
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">I Tuoi Progetti</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Totali</span>
                <span className="font-medium text-gray-900">{projectCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Completati</span>
                <span className="font-medium text-green-600">{completedCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">In Bozza</span>
                <span className="font-medium text-yellow-600">{draftCount}</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email || 'Startup Founder'}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick Start Tips */}
        {projectCount === 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Inizia qui!</span>
            </div>
            <p className="text-xs text-blue-800">
              Crea la tua prima analisi con il Questionario Guidato
            </p>
          </div>
        )}
      </div>
    </div>
  )
}