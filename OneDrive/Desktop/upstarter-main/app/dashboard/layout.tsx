'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { 
  Rocket, 
  BarChart3, 
  Lightbulb, 
  Users, 
  TrendingUp, 
  Settings, 
  LogOut, 
  User,
  Presentation,
  Calculator
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      current: pathname === '/dashboard',
      badge: null
    },
    {
      name: 'Nuova Analisi',
      href: '/dashboard/new-idea',
      icon: Lightbulb,
      current: pathname === '/dashboard/new-idea',
      badge: null
    },
    {
      name: 'I Miei Progetti',
      href: '/dashboard/projects',
      icon: TrendingUp,
      current: pathname === '/dashboard/projects',
      badge: null
    },
    {
      name: 'TeamUp',
      href: '/dashboard/teamup',
      icon: Users,
      current: pathname === '/dashboard/teamup',
      badge: null
    },
    {
      name: 'Pitch Deck Builder',
      href: '/dashboard/pitch-builder',
      icon: Presentation,
      current: pathname === '/dashboard/pitch-builder',
      badge: { text: 'NEW', color: 'bg-orange-500' }
    },
    {
      name: 'Financial Planning',
      href: '/dashboard/financial-planning',
      icon: Calculator,
      current: pathname.startsWith('/dashboard/financial-planning'),
      badge: { text: 'NEW', color: 'bg-gradient-to-r from-purple-500 to-pink-500' }
    }
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">UpStarter</span>
              </Link>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item) => {
                  const isActive = item.current
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="flex-1">{item.name}</span>
                      
                      {item.badge && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${item.badge.color}`}>
                          {item.badge.text}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* User Profile */}
              <div className="px-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">Free Plan</div>
                  </div>
                </div>
                
                <div className="mt-2 space-y-1">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Impostazioni
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              {/* Mobile Logo */}
              <div className="flex items-center flex-shrink-0 px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">UpStarter</span>
                </Link>
              </div>

              {/* Mobile Navigation */}
              <div className="mt-8 flex-grow flex flex-col">
                <nav className="flex-1 px-4 space-y-2">
                  {navigation.map((item) => {
                    const isActive = item.current
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="flex-1">{item.name}</span>
                        
                        {item.badge && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${item.badge.color}`}>
                            {item.badge.text}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>

                {/* Mobile User Profile */}
                <div className="px-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3 p-3 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-gray-500">Free Plan</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Impostazioni
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">UpStarter</span>
            </Link>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}