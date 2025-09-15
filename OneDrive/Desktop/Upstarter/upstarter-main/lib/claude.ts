import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface IdeaAnalysisInput {
  title: string
  description: string
  questionnaire: {
    target_market: string
    value_proposition: string
    business_model: string
    competitive_advantage: string
    team_experience: string
    funding_needed: string
    timeline: string
    main_challenges: string
  }
}

export interface IdeaAnalysisResult {
  overall_score: number
  swot_analysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  detailed_feedback: {
    market_analysis: {
      score: number
      feedback: string
      recommendations: string[]
    }
    business_model: {
      score: number
      feedback: string
      recommendations: string[]
    }
    team_assessment: {
      score: number
      feedback: string
      missing_roles: string[]
    }
    financial_viability: {
      score: number
      feedback: string
      recommendations: string[]
    }
  }
  next_steps: string[]
}

export async function analyzeIdea(input: IdeaAnalysisInput): Promise<IdeaAnalysisResult> {
  try {
    const prompt = `
Analizza questa idea startup e fornisci un feedback strutturato in formato JSON.

IDEA STARTUP:
Titolo: ${input.title}
Descrizione: ${input.description}

DETTAGLI BUSINESS:
- Mercato target: ${input.questionnaire.target_market}
- Value proposition: ${input.questionnaire.value_proposition}
- Business model: ${input.questionnaire.business_model}
- Vantaggio competitivo: ${input.questionnaire.competitive_advantage}
- Esperienza team: ${input.questionnaire.team_experience}
- Funding richiesto: ${input.questionnaire.funding_needed}
- Timeline: ${input.questionnaire.timeline}
- Sfide principali: ${input.questionnaire.main_challenges}

Fornisci una risposta SOLO in formato JSON valido con questa struttura:

{
  "overall_score": 75,
  "swot_analysis": {
    "strengths": ["punto di forza 1", "punto di forza 2"],
    "weaknesses": ["debolezza 1", "debolezza 2"],
    "opportunities": ["opportunità 1", "opportunità 2"],
    "threats": ["minaccia 1", "minaccia 2"]
  },
  "detailed_feedback": {
    "market_analysis": {
      "score": 80,
      "feedback": "Analisi del mercato dettagliata...",
      "recommendations": ["raccomandazione 1", "raccomandazione 2"]
    },
    "business_model": {
      "score": 70,
      "feedback": "Analisi del business model...",
      "recommendations": ["raccomandazione 1", "raccomandazione 2"]
    },
    "team_assessment": {
      "score": 65,
      "feedback": "Valutazione del team...",
      "missing_roles": ["ruolo mancante 1", "ruolo mancante 2"]
    },
    "financial_viability": {
      "score": 75,
      "feedback": "Analisi finanziaria...",
      "recommendations": ["raccomandazione 1", "raccomandazione 2"]
    }
  },
  "next_steps": ["passo 1", "passo 2", "passo 3"]
}

IMPORTANTE: Rispondi SOLO con il JSON, senza testo aggiuntivo.
`

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    try {
      const analysis = JSON.parse(responseText) as IdeaAnalysisResult
      
      // Validate that we have all required fields
      if (!analysis.overall_score || !analysis.swot_analysis || !analysis.detailed_feedback || !analysis.next_steps) {
        throw new Error('Invalid analysis structure')
      }
      
      return analysis
    } catch {
      console.error('Failed to parse Claude response:', responseText)
      
      // Return a fallback analysis if parsing fails
      return {
        overall_score: 50,
        swot_analysis: {
          strengths: ['Idea con potenziale interessante'],
          weaknesses: ['Necessita ulteriore definizione'],
          opportunities: ['Mercato in crescita'],
          threats: ['Competizione esistente']
        },
        detailed_feedback: {
          market_analysis: {
            score: 50,
            feedback: 'L\'idea presenta aspetti interessanti ma necessita di un\'analisi più approfondita del mercato target.',
            recommendations: ['Conduci ricerche di mercato più dettagliate', 'Identifica chiaramente i competitor']
          },
          business_model: {
            score: 50,
            feedback: 'Il business model ha potenziale ma richiede maggiore chiarezza sui flussi di ricavo.',
            recommendations: ['Definisci meglio le fonti di ricavo', 'Analizza i costi operativi']
          },
          team_assessment: {
            score: 50,
            feedback: 'Il team mostra competenze di base ma potrebbe beneficiare di ulteriori expertise.',
            missing_roles: ['Marketing specialist', 'Technical lead']
          },
          financial_viability: {
            score: 50,
            feedback: 'La sostenibilità finanziaria richiede una pianificazione più dettagliata.',
            recommendations: ['Sviluppa un piano finanziario a 3 anni', 'Identifica KPI di crescita']
          }
        },
        next_steps: [
          'Approfondisci la ricerca di mercato',
          'Sviluppa un MVP (Minimum Viable Product)',
          'Cerca feedback da potenziali clienti',
          'Completa il team con le competenze mancanti'
        ]
      }
    }

  } catch (error) {
    console.error('Error calling Claude API:', error)
    
    // Return a basic fallback if the API call fails
    return {
      overall_score: 40,
      swot_analysis: {
        strengths: ['Idea imprenditoriale'],
        weaknesses: ['Analisi incompleta'],
        opportunities: ['Potenziale di mercato'],
        threats: ['Incertezza del mercato']
      },
      detailed_feedback: {
        market_analysis: {
          score: 40,
          feedback: 'Non è stato possibile completare l\'analisi di mercato. Riprova più tardi.',
          recommendations: ['Riprova l\'analisi', 'Contatta il supporto se il problema persiste']
        },
        business_model: {
          score: 40,
          feedback: 'Analisi del business model non disponibile.',
          recommendations: ['Riprova l\'analisi']
        },
        team_assessment: {
          score: 40,
          feedback: 'Valutazione del team non disponibile.',
          missing_roles: ['Da definire']
        },
        financial_viability: {
          score: 40,
          feedback: 'Analisi finanziaria non disponibile.',
          recommendations: ['Riprova l\'analisi']
        }
      },
      next_steps: [
        'Riprova l\'analisi quando il servizio AI è disponibile',
        'Contatta il supporto se il problema persiste'
      ]
    }
  }
}