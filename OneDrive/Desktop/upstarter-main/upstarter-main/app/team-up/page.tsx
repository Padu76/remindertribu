'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, UserPlus, Search, Settings, 
  ArrowLeft, CheckCircle, AlertCircle,
  Loader2, Star, TrendingUp, Sparkles,
  ArrowRight
} from 'lucide-react'
import TeamProfileSetup from '@/components/TeamProfileSetup'
import TeamBrowse from '@/components/TeamBrowse'

interface TeamProfile {
  id: string
  user_id: string
  user_email: string
  full_name: string
  professional_title: string
  bio: string
  location: string
  role_seeking: string
  availability: string
  skills: string[]
  experience_years: number
  industry_focus: string[]
  equity_expectations: string
  portfolio_url?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  status: string
  created_at: string
}

type TabType = 'setup' | 'browse' | 'profile'

export default function TeamUpPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('browse')
  const [userProfile, setUserProfile] = useState<TeamProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      checkUserProfile()
    }
  }, [status, router])

  const checkUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/team-profile')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.profile) {
          setUserProfile(data.profile)
          setHasProfile(true)
          setActiveTab('browse') // Default to browse if has profile
        } else {
          setHasProfile(false)
          setActiveTab('browse') // ALWAYS default to browse - show CTA if no profile
        }
      }
    } catch (error) {
      console.error('Failed to check user profile:', error)
      setHasProfile(false)
      setActiveTab('browse') // ALWAYS default to browse - show CTA if no profile
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileComplete = (profileData: any) => {
    // Convert TeamProfileData to TeamProfile format
    const newProfile: TeamProfile = {
      id: Date.now().toString(), // Temporary ID
      user_id: session?.user?.email || '',
      user_email: session?.user?.email || '',
      full_name: profileData.full_name,
      professional_title: profileData.professional_title,
      bio: profileData.bio,
      location: profileData.location,
      role_seeking: profileData.role_seeking,
      availability: profileData.availability,
      skills: profileData.skills,
      experience_years: profileData.experience_years,
      industry_focus: profileData.industry_focus,
      equity_expectations: profileData.equity_expectations,
      portfolio_url: profileData.portfolio_url,
      linkedin_url: profileData.linkedin_url,
      github_url: profileData.github_url,
      website_url: profileData.website_url,
      status: 'active',
      created_at: new Date().toISOString()
    }
    
    setUserProfile(newProfile)
    setHasProfile(true)
    setActiveTab('browse')
  }

  const handleViewProfile = (profile: TeamProfile) => {
    // Could open a modal or navigate to profile detail page
    console.log('Viewing profile:', profile)
    // For now, just log - you can implement a profile modal later
  }

  const handleContactProfile = (profile: TeamProfile) => {
    // Could open chat or contact modal
    console.log('Contacting profile:', profile)
    // For now, just log - you can implement messaging later
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Caricamento Team-Up...
          </h2>
          <p className="text-gray-600">
            Stiamo preparando la tua esperienza di networking
          </p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
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
                <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-2 rounded-lg mr-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Team-Up</h1>
                  <p className="text-sm text-gray-600">Trova il tuo co-founder perfetto</p>
                </div>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              {hasProfile && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Profilo Attivo
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {hasProfile ? 'Co-founder Ready' : 'Setup Required'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {/* Browse Tab - Always visible */}
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Trova Co-founder
              </div>
            </button>

            {/* Setup Tab - Always show */}
            <button
              onClick={() => setActiveTab('setup')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'setup'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                {hasProfile ? 'Modifica Profilo' : 'Crea Profilo'}
                {!hasProfile && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    Richiesto
                  </span>
                )}
              </div>
            </button>

            {/* Profile Tab - Show if has profile */}
            {hasProfile && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Il Mio Profilo
                </div>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* No Profile CTA Banner - Enhanced */}
        {!hasProfile && activeTab === 'browse' && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-3 rounded-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Unisciti alla Community di Co-founder
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Crea il tuo profilo per contattare e essere contattato da altri founder. È gratuito e richiede solo 5 minuti.
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-6">
                  <button
                    onClick={() => setActiveTab('setup')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-all transform hover:scale-105"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Crea Profilo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restricted Access Warning for Browse */}
        {!hasProfile && activeTab === 'browse' && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Accesso Limitato
                  </h3>
                  <p className="mt-1 text-sm text-amber-700">
                    Per proteggere la privacy della community, puoi vedere i profili ma non contattare altri founder senza aver creato il tuo profilo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'setup' && (
          <div className="py-6">
            <TeamProfileSetup
              onComplete={handleProfileComplete}
            />
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="py-6">
            <TeamBrowse
              onViewProfile={handleViewProfile}
              onContactProfile={hasProfile ? handleContactProfile : undefined}
            />
          </div>
        )}

        {activeTab === 'profile' && hasProfile && userProfile && (
          <div className="py-6">
            <div className="mx-4 sm:mx-6 lg:mx-8">
              {/* Profile Summary Card */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {userProfile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="ml-4 text-white">
                      <h2 className="text-2xl font-bold">{userProfile.full_name}</h2>
                      <p className="text-blue-100">{userProfile.professional_title}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Ruolo Cercato</h3>
                      <p className="text-gray-600">{userProfile.role_seeking}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Disponibilità</h3>
                      <p className="text-gray-600">{userProfile.availability}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Esperienza</h3>
                      <p className="text-gray-600">{userProfile.experience_years} anni</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                    <p className="text-gray-600">{userProfile.bio}</p>
                  </div>

                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Profilo creato il {new Date(userProfile.created_at).toLocaleDateString('it-IT')}
                    </div>
                    <button
                      onClick={() => setActiveTab('setup')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Modifica Profilo
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {userProfile.skills?.length || 0}
                      </p>
                      <p className="text-gray-600">Skills Attive</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {userProfile.industry_focus?.length || 0}
                      </p>
                      <p className="text-gray-600">Settori Focus</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">Active</p>
                      <p className="text-gray-600">Status Profilo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}