'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  BarChart3, CheckCircle, Clock, Plus, Search, Filter, ArrowRight,
  Edit2, Trash2, Check, X, Calendar, TrendingUp, Users, DollarSign,
  FileText, Upload, RefreshCw, MoreVertical, Star, Brain, Target,
  MessageSquare, Eye, Lightbulb, Award, Activity, Zap
} from 'lucide-react'
import ProjectEditModal from '@/components/ProjectEditModal'

interface Project {
  id: string
  title: string
  description: string
  score: number
  status: 'completed' | 'draft'
  type: 'guided' | 'document' | 'professional'
  source: string
  created_at: string
  updated_at: string
  analysis_id: string
  regenerated_at?: string
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'guided' | 'document' | 'professional'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'title'>('date')
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [session])

  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, statusFilter, typeFilter, sortBy])

  const loadProjects = () => {
    try {
      const storedProjects = localStorage.getItem('projects')
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects)
        setProjects(parsedProjects)
        console.log('Loaded projects:', parsedProjects.length)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = projects

    // Filtro per ricerca
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro per status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter)
    }

    // Filtro per tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(project => project.type === typeFilter)
    }

    // Ordinamento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score
        case 'title':
          return a.title.localeCompare(b.title)
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredProjects(filtered)
  }

  const deleteProject = async (projectId: string) => {
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const updatedProjects = projects.filter((p: any) => p.id !== projectId)
      localStorage.setItem('projects', JSON.stringify(updatedProjects))
      
      // Rimuovi analisi associata
      const project = projects.find((p: any) => p.id === projectId)
      if (project?.analysis_id) {
        localStorage.removeItem(`analysis_${project.analysis_id}`)
        localStorage.removeItem(`analysis_analysis_${project.analysis_id}`)
      }
      
      setProjects(updatedProjects)
      window.dispatchEvent(new Event('projectsUpdated'))
      
    } catch (error) {
      console.error('Errore eliminazione progetto:', error)
    }
  }

  const confirmDelete = (project: Project) => {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare il progetto "${project.title}"?\n\nQuesta azione eliminerà:\n- Il progetto\n- L'analisi associata\n- Tutti i dati correlati\n\nQuesta azione non può essere annullata.`
    )
    if (confirmed) {
      deleteProject(project.id)
    }
  }

  const startEditing = (project: Project) => {
    setEditingProject(project.id)
    setNewTitle(project.title)
  }

  const saveTitle = async (projectId: string) => {
    try {
      if (!newTitle.trim()) {
        alert('Il titolo non può essere vuoto')
        return
      }

      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const updatedProjects = projects.map((p: any) => 
        p.id === projectId ? { ...p, title: newTitle.trim(), updated_at: new Date().toISOString() } : p
      )
      localStorage.setItem('projects', JSON.stringify(updatedProjects))

      // Aggiorna anche l'analisi associata
      const project = projects.find((p: any) => p.id === projectId)
      if (project?.analysis_id) {
        const analysisKey = `analysis_${project.analysis_id}`
        const analysisKeyDouble = `analysis_analysis_${project.analysis_id}`
        
        let analysis = JSON.parse(localStorage.getItem(analysisKey) || '{}')
        if (!analysis.id) {
          analysis = JSON.parse(localStorage.getItem(analysisKeyDouble) || '{}')
        }
        
        if (analysis.id) {
          analysis.title = newTitle.trim()
          localStorage.setItem(analysisKey, JSON.stringify(analysis))
          if (localStorage.getItem(analysisKeyDouble)) {
            localStorage.setItem(analysisKeyDouble, JSON.stringify(analysis))
          }
        }
      }

      setProjects(updatedProjects)
      setEditingProject(null)
      setNewTitle('')
      window.dispatchEvent(new Event('projectsUpdated'))
      
    } catch (error) {
      console.error('Errore rinomina progetto:', error)
    }
  }

  const cancelEditing = () => {
    setEditingProject(null)
    setNewTitle('')
  }

  const openEditModal = (project: Project) => {
    setSelectedProject(project)
    setShowEditModal(true)
  }

  const saveProjectChanges = async (updatedProject: Project) => {
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const updatedProjects = projects.map((p: any) => 
        p.id === updatedProject.id ? updatedProject : p
      )
      localStorage.setItem('projects', JSON.stringify(updatedProjects))

      setProjects(updatedProjects)
      setShowEditModal(false)
      setSelectedProject(null)
      window.dispatchEvent(new Event('projectsUpdated'))
      
    } catch (error) {
      console.error('Errore aggiornamento progetto:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Eccellente', color: 'bg-green-500' }
    if (score >= 70) return { label: 'Molto Buono', color: 'bg-green-400' }
    if (score >= 60) return { label: 'Buono', color: 'bg-yellow-500' }
    if (score >= 50) return { label: 'Sufficiente', color: 'bg-yellow-400' }
    return { label: 'Da Migliorare', color: 'bg-red-500' }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'professional': return 'bg-purple-100 text-purple-600'
      case 'guided': return 'bg-blue-100 text-blue-600'
      case 'document': return 'bg-green-100 text-green-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'professional': return 'Professionale'
      case 'guided': return 'Guidata'
      case 'document': return 'Documento'
      default: return 'Sconosciuto'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'professional': return <Award className="w-4 h-4" />
      case 'guided': return <MessageSquare className="w-4 h-4" />
      case 'document': return <FileText className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-600'
      case 'draft': return 'bg-yellow-100 text-yellow-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completata'
      case 'draft': return 'Bozza'
      default: return 'Sconosciuto'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Data non valida'
    }
  }

  const getProjectActions = (project: Project) => [
    {
      label: 'Visualizza Analisi',
      icon: Eye,
      action: () => router.push(`/dashboard/analysis/${project.analysis_id}`),
      color: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
    },
    {
      label: 'Migliora Progetto',
      icon: Brain,
      action: () => openEditModal(project),
      color: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
    },
    {
      label: 'Elimina',
      icon: Trash2,
      action: () => confirmDelete(project),
      color: 'text-red-600 hover:text-red-800 hover:bg-red-50'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento progetti...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">I Miei Progetti</h1>
            <p className="text-gray-600 mt-1">
              Gestisci e monitora le tue analisi startup
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/dashboard/guided')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Progetto
            </button>
          </div>
        </div>

        {/* Stats Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Progetti Totali</span>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{projects.length}</div>
            <div className="text-sm text-gray-500 mt-1">
              {projects.length === 0 ? 'Nessun progetto' : `${projects.length} analisi create`}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Analisi Complete</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {projects.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {projects.length > 0 ? `${Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100)}% completate` : 'Nessuna analisi'}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">In Bozza</span>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {projects.filter(p => p.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {projects.filter(p => p.status === 'draft').length > 0 ? 'Da completare' : 'Nessuna bozza'}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Score Medio</span>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.score, 0) / projects.length) : 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {projects.length > 0 ? getScoreBadge(Math.round(projects.reduce((sum, p) => sum + p.score, 0) / projects.length)).label : 'Nessun dato'}
            </div>
          </div>
        </div>

        {/* Filters Enhanced */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca progetti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti gli stati</option>
                <option value="completed">Completati</option>
                <option value="draft">Bozze</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti i tipi</option>
                <option value="guided">Guidate</option>
                <option value="document">Documenti</option>
                <option value="professional">Professionali</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Data creazione</option>
                <option value="score">Score</option>
                <option value="title">Nome</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredProjects.length} di {projects.length} progetti
              </span>
              <button
                onClick={loadProjects}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ricarica"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects List Enhanced */}
        <div className="bg-white rounded-xl shadow-lg">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                {projects.length === 0 ? (
                  <Lightbulb className="w-16 h-16 mx-auto" />
                ) : (
                  <Search className="w-16 h-16 mx-auto" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {projects.length === 0 ? 'Nessun progetto ancora' : 'Nessun progetto corrisponde ai filtri'}
              </h3>
              <p className="text-gray-600 mb-6">
                {projects.length === 0 
                  ? 'Inizia analizzando la tua prima idea startup caricando un documento o compilando il questionario'
                  : 'Prova a modificare i filtri di ricerca per trovare i tuoi progetti'
                }
              </p>
              {projects.length === 0 && (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => router.push('/dashboard/guided')}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Questionario Guidato
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Carica Documento
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredProjects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {editingProject === project.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nome progetto"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveTitle(project.id)
                              }
                            }}
                          />
                          <button
                            onClick={() => saveTitle(project.id)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="Salva"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Annulla"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                            <button
                              onClick={() => startEditing(project)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Rinomina progetto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(project.type)}`}>
                              {getTypeIcon(project.type)}
                              <span>{getTypeLabel(project.type)}</span>
                            </div>
                            
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                              {getStatusLabel(project.status)}
                            </span>
                            
                            <span className="text-xs text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(project.created_at)}
                            </span>
                            
                            {project.regenerated_at && (
                              <span className="text-xs text-green-600 flex items-center">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Aggiornato {formatDate(project.regenerated_at)}
                              </span>
                            )}
                          </div>
                          
                          {project.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6 ml-6">
                      {/* Score Display */}
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(project.score)}`}>
                          {project.score}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                        <div className={`w-2 h-2 rounded-full ${getScoreBadge(project.score).color} mt-1 mx-auto`}></div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {getProjectActions(project).map((action, index) => (
                          <button
                            key={index}
                            onClick={action.action}
                            className={`p-2 rounded-lg transition-colors ${action.color}`}
                            title={action.label}
                          >
                            <action.icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedProject && (
        <ProjectEditModal
          project={selectedProject}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedProject(null)
          }}
          onSave={saveProjectChanges}
          onAnalysisRegenerated={() => {
            loadProjects()
          }}
        />
      )}
    </div>
  )
}