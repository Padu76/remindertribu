import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import airtableService from '@/lib/airtable'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Loading projects from Airtable...')
    
    // Verifica autenticazione
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email
    console.log('✅ User authenticated:', userEmail)

    // STEP 1: Carica progetti da Airtable
    console.log('📦 Step 1: Loading projects from Airtable...')
    
    let airtableProjects: any[] = []
    let airtableStats: any = null
    let airtableError: any = null

    try {
      // Carica progetti dell'utente
      const rawProjects = await airtableService.getProjectsByUser(userEmail)
      console.log('✅ Raw projects loaded:', rawProjects.length)

      // Trasforma dati Airtable in formato compatibile
      airtableProjects = rawProjects.map(record => ({
        id: record.id,
        title: record.fields.title,
        description: record.fields.description,
        score: record.fields.score || 0,
        status: record.fields.status,
        type: record.fields.type,
        source: record.fields.source,
        source_file: record.fields.source_file,
        created_at: record.fields.created_at,
        updated_at: record.fields.updated_at,
        user_email: userEmail
      }))

      // Carica statistiche
      airtableStats = await airtableService.getProjectStats(userEmail)
      console.log('✅ Stats loaded:', airtableStats)

    } catch (error) {
      console.error('⚠️ Airtable load failed:', error)
      airtableError = error
    }

    // STEP 2: Fallback a localStorage se Airtable fallisce
    let localStorageProjects: any[] = []
    
    if (airtableProjects.length === 0) {
      console.log('📱 Step 2: Airtable empty, checking localStorage fallback...')
      
      try {
        // Restituisci istruzioni per localStorage (client-side)
        localStorageProjects = []
        console.log('ℹ️ Client should check localStorage for fallback data')
      } catch (error) {
        console.error('⚠️ LocalStorage fallback failed:', error)
      }
    }

    // STEP 3: Combina risultati
    const allProjects = [...airtableProjects, ...localStorageProjects]
    
    // Ordina per data di creazione (più recenti prima)
    allProjects.sort((a, b) => {
      const dateA = new Date(a.created_at || '').getTime()
      const dateB = new Date(b.created_at || '').getTime()
      return dateB - dateA
    })

    console.log('📊 Final projects count:', allProjects.length)

    // STEP 4: Calcola statistiche finali
    const finalStats = airtableStats || {
      total: allProjects.length,
      analyzed: allProjects.filter(p => p.status === 'analyzed').length,
      draft: allProjects.filter(p => p.status === 'draft').length,
      archived: allProjects.filter(p => p.status === 'archived').length,
      avgScore: allProjects.length > 0 ? 
        Math.round(allProjects.reduce((acc, p) => acc + p.score, 0) / allProjects.length) : 0
    }

    console.log('🎉 Projects loaded successfully!')

    return NextResponse.json({
      success: true,
      projects: allProjects,
      stats: finalStats,
      data_source: {
        airtable: airtableProjects.length,
        localStorage: localStorageProjects.length,
        error: airtableError ? airtableError.message : null
      },
      user: {
        email: userEmail,
        name: session.user.name
      }
    })

  } catch (error) {
    console.error('❌ Error in projects API:', error)
    
    return NextResponse.json({ 
      error: 'Errore durante il caricamento dei progetti',
      details: error instanceof Error ? error.message : 'Unknown error',
      projects: [],
      stats: { total: 0, analyzed: 0, draft: 0, archived: 0, avgScore: 0 }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🆕 Creating new project...')
    
    // Verifica autenticazione
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email
    const { title, description, source, type = 'standard' } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Crea progetto in Airtable
    try {
      const savedProject = await airtableService.createProject({
        title,
        description,
        source: source || 'form',
        status: 'draft',
        score: 0,
        type
      }, userEmail)

      console.log('✅ Project created in Airtable:', savedProject.id)

      const projectData = {
        id: savedProject.id,
        title: savedProject.fields.title,
        description: savedProject.fields.description,
        score: savedProject.fields.score,
        status: savedProject.fields.status,
        type: savedProject.fields.type,
        source: savedProject.fields.source,
        created_at: savedProject.fields.created_at,
        updated_at: savedProject.fields.updated_at,
        user_email: userEmail
      }

      return NextResponse.json({
        success: true,
        project: projectData,
        saved_to_airtable: true
      })

    } catch (airtableError) {
      console.error('⚠️ Airtable save failed:', airtableError)
      
      // Fallback: restituisci progetto con ID temporaneo
      const tempProject = {
        id: `proj_${Date.now()}`,
        title,
        description,
        score: 0,
        status: 'draft',
        type,
        source: source || 'form',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_email: userEmail
      }

      return NextResponse.json({
        success: true,
        project: tempProject,
        saved_to_airtable: false,
        error: 'Saved locally, sync to Airtable failed'
      })
    }

  } catch (error) {
    console.error('❌ Error creating project:', error)
    return NextResponse.json({ 
      error: 'Errore durante la creazione del progetto',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting project...')
    
    // Verifica autenticazione
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Elimina da Airtable
    try {
      const deleted = await airtableService.deleteProject(projectId)
      
      if (deleted) {
        console.log('✅ Project deleted from Airtable:', projectId)
        return NextResponse.json({
          success: true,
          message: 'Project deleted successfully',
          deleted_from_airtable: true
        })
      } else {
        throw new Error('Deletion failed')
      }

    } catch (airtableError) {
      console.error('⚠️ Airtable delete failed:', airtableError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to delete from Airtable',
        details: airtableError instanceof Error ? airtableError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error deleting project:', error)
    return NextResponse.json({ 
      error: 'Errore durante l\'eliminazione del progetto',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('📝 Updating project...')
    
    // Verifica autenticazione
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Aggiorna in Airtable
    try {
      const updatedProject = await airtableService.updateProject(id, updates)
      
      console.log('✅ Project updated in Airtable:', id)

      const projectData = {
        id: updatedProject.id,
        title: updatedProject.fields.title,
        description: updatedProject.fields.description,
        score: updatedProject.fields.score,
        status: updatedProject.fields.status,
        type: updatedProject.fields.type,
        source: updatedProject.fields.source,
        created_at: updatedProject.fields.created_at,
        updated_at: updatedProject.fields.updated_at,
        user_email: session.user.email
      }

      return NextResponse.json({
        success: true,
        project: projectData,
        updated_in_airtable: true
      })

    } catch (airtableError) {
      console.error('⚠️ Airtable update failed:', airtableError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to update in Airtable',
        details: airtableError instanceof Error ? airtableError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error updating project:', error)
    return NextResponse.json({ 
      error: 'Errore durante l\'aggiornamento del progetto',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}