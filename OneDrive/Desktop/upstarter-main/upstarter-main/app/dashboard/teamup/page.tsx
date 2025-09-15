'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, Search, Filter, MapPin, Clock, Briefcase, 
  Star, TrendingUp, Code, Palette, Target, Award,
  Linkedin, Github, Globe, Mail, MessageSquare,
  ChevronDown, X, Eye, Heart, Share2, Grid3X3,
  List, SlidersHorizontal, ArrowUpDown, Zap,
  Plus, RefreshCw
} from 'lucide-react'

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

interface BrowseFilters {
  search: string
  role_seeking: string[]
  availability: string[]
  location: string
  skills: string[]
  industry_focus: string[]
  experience_years: string
  sort_by: 'recent' | 'experience' | 'name' | 'location'
}

const ROLES = [
  { value: 'co-founder', label: 'Co-Founder', icon: Users, color: 'blue' },
  { value: 'technical', label: 'Technical Lead', icon: Code, color: 'green' },
  { value: 'marketing', label: 'Marketing Lead', icon: TrendingUp, color: 'purple' },
  { value: 'business', label: 'Business Lead', icon: Briefcase, color: 'orange' },
  { value: 'design', label: 'Design Lead', icon: Palette, color: 'pink' },
  { value: 'operations', label: 'Operations Lead', icon: Target, color: 'indigo' }
]

const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full-Time', icon: Clock },
  { value: 'part-time', label: 'Part-Time', icon: Clock },
  { value: 'weekends', label: 'Weekend', icon: Clock },
  { value: 'consulting', label: 'Consulting', icon: Clock }
]

const POPULAR_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Python', 'Node.js',
  'Product Management', 'Digital Marketing', 'UI/UX Design',
  'Business Development', 'Sales', 'Fundraising', 'Strategy'
]

const INDUSTRIES = [
  'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS', 'AI/ML',
  'Blockchain', 'Gaming', 'Social Media', 'CleanTech'
]

export default function DashboardTeamUpPage() {
  const { data: session } = useSession()
  const [profiles, setProfiles] = useState<TeamProfile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<TeamProfile[]>([])
  const [filters, setFilters] = useState<BrowseFilters>({
    search: '',
    role_seeking: [],
    availability: [],
    location: '',
    skills: [],
    industry_focus: [],
    experience_years: '',
    sort_by: 'recent'
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<string[]>([])
  const [showProfileModal, setShowProfileModal] = useState<TeamProfile | null>(null)

  useEffect(() => {
    loadProfiles()
    loadFavorites()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [profiles, filters])

  const loadProfiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/team-profile/browse')
      if (response.ok) {
        const data = await response.json()
        const profilesData = data.profiles.map((p: any) => ({
          ...p,
          skills: typeof p.skills === 'string' ? p.skills.split(', ').filter(Boolean) : p.skills || [],
          industry_focus: typeof p.industry_focus === 'string' ? p.industry_focus.split(', ').filter(Boolean) : p.industry_focus || []
        }))
        setProfiles(profilesData)
      }
    } catch (error) {
      console.error('Failed to load profiles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadFavorites = () => {
    const saved = localStorage.getItem(`team_favorites_${session?.user?.email}`)
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch (error) {
        console.warn('Failed to load favorites')
      }
    }
  }

  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites)
    localStorage.setItem(`team_favorites_${session?.user?.email}`, JSON.stringify(newFavorites))
  }

  const toggleFavorite = (profileId: string) => {
    const newFavorites = favorites.includes(profileId)
      ? favorites.filter(id => id !== profileId)
      : [...favorites, profileId]
    saveFavorites(newFavorites)
  }

  const applyFilters = () => {
    let filtered = [...profiles]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(profile =>
        profile.full_name.toLowerCase().includes(searchLower) ||
        profile.professional_title.toLowerCase().includes(searchLower) ||
        profile.bio.toLowerCase().includes(searchLower) ||
        profile.skills.some(skill => skill.toLowerCase().includes(searchLower)) ||
        profile.industry_focus.some(industry => industry.toLowerCase().includes(searchLower))
      )
    }

    // Role filter
    if (filters.role_seeking.length > 0) {
      filtered = filtered.filter(profile =>
        filters.role_seeking.includes(profile.role_seeking)
      )
    }

    // Availability filter
    if (filters.availability.length > 0) {
      filtered = filtered.filter(profile =>
        filters.availability.includes(profile.availability)
      )
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(profile =>
        profile.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Skills filter
    if (filters.skills.length > 0) {
      filtered = filtered.filter(profile =>
        filters.skills.some(skill =>
          profile.skills.some(profileSkill =>
            profileSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      )
    }

    // Industry filter
    if (filters.industry_focus.length > 0) {
      filtered = filtered.filter(profile =>
        filters.industry_focus.some(industry =>
          profile.industry_focus.some(profileIndustry =>
            profileIndustry.toLowerCase().includes(industry.toLowerCase())
          )
        )
      )
    }

    // Experience filter
    if (filters.experience_years) {
      filtered = filtered.filter(profile => {
        const exp = profile.experience_years
        switch (filters.experience_years) {
          case '0-2': return exp <= 2
          case '3-5': return exp >= 3 && exp <= 5
          case '6-10': return exp >= 6 && exp <= 10
          case '10+': return exp > 10
          default: return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sort_by) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'experience':
          return b.experience_years - a.experience_years
        case 'name':
          return a.full_name.localeCompare(b.full_name)
        case 'location':
          return a.location.localeCompare(b.location)
        default:
          return 0
      }
    })

    setFilteredProfiles(filtered)
  }

  const updateFilter = (key: keyof BrowseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleArrayFilter = (key: 'role_seeking' | 'availability' | 'skills' | 'industry_focus', value: string) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    updateFilter(key, newArray)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      role_seeking: [],
      availability: [],
      location: '',
      skills: [],
      industry_focus: [],
      experience_years: '',
      sort_by: 'recent'
    })
  }

  const getRoleInfo = (role: string) => {
    return ROLES.find(r => r.value === role) || ROLES[0]
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const shareProfile = async (profile: TeamProfile) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name} - ${profile.professional_title}`,
          text: profile.bio.slice(0, 100) + '...',
          url: window.location.href + `#profile-${profile.id}`
        })
      } catch (error) {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      const url = window.location.href + `#profile-${profile.id}`
      navigator.clipboard.writeText(url)
      alert('Link copiato negli appunti!')
    }
  }

  const openProfileModal = (profile: TeamProfile) => {
    setShowProfileModal(profile)
  }

  const contactProfile = (profile: TeamProfile) => {
    // Placeholder for contact functionality
    alert(`Contattando ${profile.full_name}...`)
  }

  const activeFiltersCount = [
    filters.role_seeking.length,
    filters.availability.length,
    filters.location ? 1 : 0,
    filters.skills.length,
    filters.industry_focus.length,
    filters.experience_years ? 1 : 0
  ].reduce((sum, count) => sum + count, 0)

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">TeamUp - Trova Co-founder</h1>
          <p className="text-gray-600 text-lg">
            Connettiti con sviluppatori, designer, marketer e altri imprenditori
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento profili co-founder...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Dashboard Style */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <Users className="w-8 h-8 mr-3 text-blue-600" />
          TeamUp - Trova Co-founder
        </h1>
        <p className="text-gray-600 text-lg">
          Connettiti con sviluppatori, designer, marketer e altri imprenditori per completare il tuo team startup
        </p>
        <div className="mt-4 flex items-center justify-center space-x-4">
          <span className="text-sm text-gray-500">
            {filteredProfiles.length} di {profiles.length} profili disponibili
          </span>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cerca per nome, skills, industria..."
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtri
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <select
              value={filters.sort_by}
              onChange={(e) => updateFilter('sort_by', e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Più recenti</option>
              <option value="experience">Più esperienza</option>
              <option value="name">Nome A-Z</option>
              <option value="location">Posizione</option>
            </select>

            <button
              onClick={loadProfiles}
              className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Aggiorna profili"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="p-6 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ruolo Cercato
                </label>
                <div className="space-y-2">
                  {ROLES.map(role => (
                    <label key={role.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.role_seeking.includes(role.value)}
                        onChange={() => toggleArrayFilter('role_seeking', role.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <role.icon className="w-4 h-4 ml-2 mr-1" />
                      <span className="text-sm">{role.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Disponibilità
                </label>
                <div className="space-y-2">
                  {AVAILABILITY_OPTIONS.map(availability => (
                    <label key={availability.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.availability.includes(availability.value)}
                        onChange={() => toggleArrayFilter('availability', availability.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <availability.icon className="w-4 h-4 ml-2 mr-1" />
                      <span className="text-sm">{availability.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Anni di Esperienza
                </label>
                <select
                  value={filters.experience_years}
                  onChange={(e) => updateFilter('experience_years', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tutti</option>
                  <option value="0-2">0-2 anni</option>
                  <option value="3-5">3-5 anni</option>
                  <option value="6-10">6-10 anni</option>
                  <option value="10+">10+ anni</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Posizione
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="es. Milano, Roma..."
                />
              </div>

              {/* Skills Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Skills Popolari
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SKILLS.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleArrayFilter('skills', skill)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        filters.skills.includes(skill)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Settori
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(industry => (
                    <button
                      key={industry}
                      onClick={() => toggleArrayFilter('industry_focus', industry)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        filters.industry_focus.includes(industry)
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Rimuovi tutti i filtri
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun profilo trovato
          </h3>
          <p className="text-gray-600 mb-4">
            Prova a modificare i filtri per vedere più risultati
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Rimuovi filtri
            </button>
            <button
              onClick={() => window.open('/team-up', '_blank')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crea il tuo profilo
            </button>
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredProfiles.map((profile) => {
            const roleInfo = getRoleInfo(profile.role_seeking)
            const isFavorite = favorites.includes(profile.id)
            
            if (viewMode === 'list') {
              return (
                <div key={profile.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-r from-${roleInfo.color}-500 to-${roleInfo.color}-600 rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                        {getInitials(profile.full_name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{profile.full_name}</h3>
                          <div className={`flex items-center px-3 py-1 bg-${roleInfo.color}-100 text-${roleInfo.color}-700 rounded-full text-sm`}>
                            <roleInfo.icon className="w-4 h-4 mr-1" />
                            {roleInfo.label}
                          </div>
                        </div>
                        <p className="text-gray-600 font-medium mb-2">{profile.professional_title}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {profile.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {profile.availability}
                          </div>
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            {profile.experience_years} anni exp.
                          </div>
                        </div>
                        <p className="text-gray-700 line-clamp-2">{profile.bio}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFavorite(profile.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isFavorite 
                            ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => shareProfile(profile)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openProfileModal(profile)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2 inline" />
                        Profilo
                      </button>
                      <button
                        onClick={() => contactProfile(profile)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 mr-2 inline" />
                        Contatta
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            // Grid view
            return (
              <div key={profile.id} className="bg-white rounded-xl shadow-sm border hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-r from-${roleInfo.color}-500 to-${roleInfo.color}-600 rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                      {getInitials(profile.full_name)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFavorite(profile.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isFavorite 
                            ? 'text-red-600 bg-red-50' 
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => shareProfile(profile)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Name and Title */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{profile.full_name}</h3>
                    <p className="text-gray-600 font-medium text-sm">{profile.professional_title}</p>
                  </div>

                  {/* Role Badge */}
                  <div className={`inline-flex items-center px-3 py-1 bg-${roleInfo.color}-100 text-${roleInfo.color}-700 rounded-full text-sm font-medium mb-4`}>
                    <roleInfo.icon className="w-4 h-4 mr-2" />
                    {roleInfo.label}
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      {profile.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      {profile.availability.replace('-', ' ')}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Award className="w-4 h-4 mr-2" />
                      {profile.experience_years} anni esperienza
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                    {profile.bio}
                  </p>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {profile.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {profile.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{profile.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="flex items-center space-x-3 mb-4">
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                         className="text-blue-600 hover:text-blue-700">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {profile.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                         className="text-gray-700 hover:text-gray-900">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {profile.portfolio_url && (
                      <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                         className="text-purple-600 hover:text-purple-700">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openProfileModal(profile)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4 mr-2 inline" />
                      Vedi Profilo
                    </button>
                    <button
                      onClick={() => contactProfile(profile)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Profile Modal Placeholder */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{showProfileModal.full_name}</h2>
                <button
                  onClick={() => setShowProfileModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">{showProfileModal.professional_title}</p>
                <p className="text-gray-700">{showProfileModal.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {showProfileModal.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => contactProfile(showProfileModal)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-2 inline" />
                    Contatta
                  </button>
                  <button
                    onClick={() => shareProfile(showProfileModal)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4 mr-2 inline" />
                    Condividi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}