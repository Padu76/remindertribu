import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import airtableService from '@/lib/airtable'
import { ProfessionalStartupAnalyzer } from '@/lib/professional-startup-analyzer'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting professional document analysis...')
    
    // Verifica autenticazione
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email
    const userName = session.user.name || userEmail.split('@')[0]
    
    console.log('✅ User authenticated:', userEmail)

    // Parse request body
    const { fileName, text } = await request.json()
    
    if (!fileName || !text) {
      console.log('❌ Missing fileName or text')
      return NextResponse.json({ error: 'fileName e text sono richiesti' }, { status: 400 })
    }

    console.log('📄 Processing document:', { fileName, textLength: text.length })

    // STEP 1: Estrazione informazioni dal testo
    console.log('🔍 Step 1: Extracting information from text...')
    const extractedInfo = await extractTextInfo(text)
    console.log('✅ Information extracted:', extractedInfo)

    // STEP 2: Analisi professionale completa
    console.log('🤖 Step 2: Professional VC-level analysis...')
    const analyzer = new ProfessionalStartupAnalyzer()
    const professionalAnalysis = await analyzer.analyzeStartup(extractedInfo.title, text)
    console.log('✅ Professional analysis completed:', professionalAnalysis.overall_score)

    // STEP 3: Genera ID univoco per il progetto
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    console.log('🔢 Generated IDs:', { projectId, analysisId })

    // STEP 4: Salvataggio in Airtable
    console.log('💾 Step 4: Saving to Airtable...')
    
    let savedProject = null
    let savedAnalysis = null

    try {
      // Crea progetto in Airtable
      savedProject = await airtableService.createProject({
        title: extractedInfo.title,
        description: extractedInfo.description,
        source: 'document_professional',
        source_file: fileName,
        status: 'analyzed',
        score: professionalAnalysis.overall_score,
        type: 'professional'
      }, userEmail)

      console.log('✅ Project saved to Airtable:', savedProject.id)

      // Crea analisi in Airtable
      savedAnalysis = await airtableService.createAnalysis({
        overall_score: professionalAnalysis.overall_score,
        analysis_data: JSON.stringify(professionalAnalysis),
        missing_areas: JSON.stringify(professionalAnalysis.missing_areas),
        completeness_score: Math.round(professionalAnalysis.overall_score * 0.8) // Completeness leggermente inferiore al score
      }, savedProject.id)

      console.log('✅ Analysis saved to Airtable:', savedAnalysis.id)

      // Salva raccomandazioni come informazioni aggiuntive
      for (const [index, recommendation] of professionalAnalysis.recommendations.slice(0, 5).entries()) {
        await airtableService.createAdditionalInfo({
          category: 'strategic_recommendation',
          content: recommendation,
          priority: index < 2 ? 'critical' : 'important',
          step_required: index < 2 ? 'pitch' : 'business_plan'
        }, savedProject.id)
      }

      // Salva aree mancanti
      for (const [index, missingArea] of professionalAnalysis.missing_areas.slice(0, 5).entries()) {
        await airtableService.createAdditionalInfo({
          category: 'missing_area',
          content: missingArea,
          priority: index < 2 ? 'critical' : 'important',
          step_required: 'business_plan'
        }, savedProject.id)
      }

      console.log('✅ Recommendations and missing areas saved to Airtable')

    } catch (airtableError) {
      console.error('⚠️ Airtable save failed, continuing with localStorage fallback:', airtableError)
      // Continua anche se Airtable fallisce
    }

    // STEP 5: Prepara risposta con analisi completa
    const responseData = {
      success: true,
      project: {
        id: savedProject?.id || projectId,
        title: extractedInfo.title,
        description: extractedInfo.description,
        score: professionalAnalysis.overall_score,
        status: 'analyzed',
        type: 'professional',
        source: 'document_professional',
        source_file: fileName,
        user_email: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      analysis: {
        id: savedAnalysis?.id || analysisId,
        project_id: savedProject?.id || projectId,
        overall_score: professionalAnalysis.overall_score,
        analysis_data: professionalAnalysis,
        missing_areas: professionalAnalysis.missing_areas,
        completeness_score: Math.round(professionalAnalysis.overall_score * 0.8),
        created_at: new Date().toISOString()
      },
      professional_analysis: professionalAnalysis,
      extracted_info: extractedInfo,
      saved_to_airtable: !!savedProject,
      valuation_summary: {
        range: professionalAnalysis.valuation_range,
        method_used: ['Berkus Method', 'Scorecard Method', 'Risk Factor Analysis'],
        confidence_level: professionalAnalysis.overall_score > 70 ? 'High' : professionalAnalysis.overall_score > 50 ? 'Medium' : 'Low'
      }
    }

    console.log('🎉 Professional analysis completed successfully!')
    console.log('📊 Final Score:', professionalAnalysis.overall_score)
    console.log('💰 Valuation Range:', professionalAnalysis.valuation_range)

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ Error in professional document analysis:', error)
    return NextResponse.json({ 
      error: 'Errore durante l\'analisi professionale del documento.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Funzione per estrarre informazioni dal testo
async function extractTextInfo(text: string): Promise<any> {
  try {
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    
    // Cerca titolo più sofisticato
    let title = 'Startup Business Plan'
    const titleKeywords = ['startup', 'business', 'company', 'project', 'idea', 'venture', 'plan', 'proposal']
    
    // Cerca nelle prime 15 linee
    for (const line of lines.slice(0, 15)) {
      const cleanLine = line.trim()
      if (cleanLine.length > 5 && cleanLine.length < 150) {
        // Priorità alle linee che contengono keywords
        const hasKeyword = titleKeywords.some(keyword => 
          cleanLine.toLowerCase().includes(keyword)
        )
        
        // Priorità alle linee che sembrano titoli (maiuscole, brevi)
        const isTitle = cleanLine.match(/^[A-Z][^.]*$/) && cleanLine.length < 80
        
        if (hasKeyword || isTitle) {
          title = cleanLine
          break
        }
      }
    }
    
    // Se non trova un titolo valido, usa la prima linea significativa
    if (title === 'Startup Business Plan') {
      const firstSignificantLine = lines.find(line => 
        line.trim().length > 10 && line.trim().length < 120
      )
      if (firstSignificantLine) {
        title = firstSignificantLine.trim()
      }
    }

    // Genera descrizione più intelligente
    const meaningfulLines = lines.filter(line => 
      line.trim().length > 30 && 
      line.trim().length < 200 &&
      !line.trim().match(/^[A-Z\s]+$/) // Evita linee tutto maiuscole
    )
    
    const description = meaningfulLines.slice(0, 3).join(' ').substring(0, 400) + '...'

    // Identifica sezioni chiave
    const sections = identifyBusinessPlanSections(text)
    
    return {
      title: title.length > 100 ? title.substring(0, 100) + '...' : title,
      description: description || 'Analisi professionale del documento di business plan caricato',
      content: text,
      sections: sections,
      word_count: text.split(/\s+/).length,
      char_count: text.length,
      extractedAt: new Date().toISOString(),
      document_type: identifyDocumentType(text)
    }

  } catch (error) {
    console.error('Error extracting text info:', error)
    return {
      title: 'Business Plan Analysis',
      description: 'Analisi professionale del documento caricato',
      content: text,
      sections: [],
      word_count: text.split(/\s+/).length,
      char_count: text.length,
      extractedAt: new Date().toISOString(),
      document_type: 'business_plan'
    }
  }
}

function identifyBusinessPlanSections(text: string): string[] {
  const sections = []
  const lines = text.split('\n')
  
  const sectionKeywords = [
    'executive summary', 'sommario esecutivo',
    'market analysis', 'analisi mercato', 'analisi di mercato',
    'competitive analysis', 'analisi competitiva',
    'business model', 'modello di business',
    'financial projections', 'proiezioni finanziarie',
    'team', 'management', 'organizzazione',
    'product', 'prodotto', 'servizio',
    'marketing', 'vendite', 'sales',
    'technology', 'tecnologia',
    'operations', 'operazioni',
    'risk', 'rischi', 'risk analysis',
    'funding', 'finanziamento', 'investimento'
  ]
  
  for (const line of lines) {
    const cleanLine = line.trim().toLowerCase()
    if (cleanLine.length > 5 && cleanLine.length < 100) {
      for (const keyword of sectionKeywords) {
        if (cleanLine.includes(keyword)) {
          sections.push(line.trim())
          break
        }
      }
    }
  }
  
  return [...new Set(sections)].slice(0, 15) // Rimuove duplicati e limita a 15
}

function identifyDocumentType(text: string): string {
  const textLower = text.toLowerCase()
  
  if (textLower.includes('pitch deck') || textLower.includes('pitch')) {
    return 'pitch_deck'
  } else if (textLower.includes('business plan') || textLower.includes('piano aziendale')) {
    return 'business_plan'
  } else if (textLower.includes('executive summary') || textLower.includes('sommario esecutivo')) {
    return 'executive_summary'
  } else if (textLower.includes('market research') || textLower.includes('ricerca mercato')) {
    return 'market_research'
  } else if (textLower.includes('financial') || textLower.includes('finanziario')) {
    return 'financial_document'
  } else {
    return 'business_document'
  }
}