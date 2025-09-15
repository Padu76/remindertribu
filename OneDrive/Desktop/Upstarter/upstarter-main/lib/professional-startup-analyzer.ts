// Analizzatore professionale startup - Versione corretta con metodi multipli
export interface StartupAnalysisResult {
  overall_score: number
  valuation_range: {
    min: number
    max: number
    recommended: number
  }
  berkus_analysis: any
  scorecard_analysis: any
  risk_factor_analysis: any
  market_analysis: any
  competitive_analysis: any
  financial_analysis: any
  team_analysis: any
  product_analysis: any
  investment_readiness: any
  recommendations: string[]
  missing_areas: string[]
  next_steps: any
  executive_summary: string
}

// Interfaccia per dati questionario strutturato
export interface QuestionnaireData {
  project_name: string
  project_description: string
  problem_solution: string
  team_size: string
  team_experience: string
  team_advisors?: string
  target_market: string
  market_size?: string
  market_validation: string
  product_stage: string
  unique_value: string
  customer_feedback?: string
  competitors: string
  competitive_advantage: string
  business_model: string
  revenue_projections?: string
  funding_needs: string
  current_revenue?: string
}

export class ProfessionalStartupAnalyzer {
  
  // Metodo per analisi da questionario guidato
  async analyzeFromQuestionnaire(data: QuestionnaireData): Promise<StartupAnalysisResult> {
    console.log('🧠 AI Analyzer: Starting questionnaire-based analysis...')
    
    try {
      // Converte i dati del questionario in formato per l'analisi
      const analysisData = this.convertQuestionnaireToAnalysisData(data)
      
      // Esegue tutte le analisi professionali
      const berkusAnalysis = this.performBerkusAnalysis(analysisData)
      const scorecardAnalysis = this.performScorecardAnalysis(analysisData)
      const riskFactorAnalysis = this.performRiskFactorAnalysis(analysisData)
      const marketAnalysis = this.performMarketAnalysis(analysisData)
      const competitiveAnalysis = this.performCompetitiveAnalysis(analysisData)
      const financialAnalysis = this.performFinancialAnalysis(analysisData)
      const teamAnalysis = this.performTeamAnalysis(analysisData)
      const productAnalysis = this.performProductAnalysis(analysisData)
      const investmentReadiness = this.assessInvestmentReadiness(analysisData)
      
      // Calcola score complessivo
      const overallScore = this.calculateOverallScore({
        berkus: berkusAnalysis.total_valuation,
        scorecard: scorecardAnalysis.weighted_score,
        market: marketAnalysis.som_analysis.confidence,
        team: teamAnalysis.founder_market_fit.score,
        product: productAnalysis.product_market_fit.score,
        financial: financialAnalysis.revenue_model.clarity
      })
      
      // Calcola range di valutazione
      const valuationRange = this.calculateValuationRange(berkusAnalysis, scorecardAnalysis, riskFactorAnalysis)
      
      // Genera raccomandazioni e next steps
      const recommendations = this.generateRecommendations(analysisData, overallScore)
      const missingAreas = this.identifyMissingAreas(analysisData)
      const nextSteps = this.generateNextSteps(overallScore, investmentReadiness)
      
      // Genera Executive Summary dettagliato
      const executiveSummary = this.generateExecutiveSummary(analysisData, overallScore, valuationRange)
      
      console.log('✅ AI Analyzer: Questionnaire analysis completed successfully')
      
      return {
        overall_score: overallScore,
        valuation_range: valuationRange,
        berkus_analysis: berkusAnalysis,
        scorecard_analysis: scorecardAnalysis,
        risk_factor_analysis: riskFactorAnalysis,
        market_analysis: marketAnalysis,
        competitive_analysis: competitiveAnalysis,
        financial_analysis: financialAnalysis,
        team_analysis: teamAnalysis,
        product_analysis: productAnalysis,
        investment_readiness: investmentReadiness,
        recommendations,
        missing_areas: missingAreas,
        next_steps: nextSteps,
        executive_summary: executiveSummary
      }
      
    } catch (error) {
      console.error('❌ AI Analyzer: Error in questionnaire analysis:', error)
      throw new Error('Errore durante l\'analisi del questionario')
    }
  }
  
  // Metodo per analisi da documento (manteniamo compatibilità)
  async analyzeStartup(title: string, content: string): Promise<StartupAnalysisResult> {
    console.log('🔍 Starting professional startup analysis from document...')
    
    try {
      // Analizza il contenuto per estrarre informazioni chiave
      const extractedData = this.extractKeyInformation(content)
      
      // Esegue tutte le analisi professionali
      const berkusAnalysis = this.performBerkusAnalysis(extractedData)
      const scorecardAnalysis = this.performScorecardAnalysis(extractedData)
      const riskFactorAnalysis = this.performRiskFactorAnalysis(extractedData)
      const marketAnalysis = this.performMarketAnalysis(extractedData)
      const competitiveAnalysis = this.performCompetitiveAnalysis(extractedData)
      const financialAnalysis = this.performFinancialAnalysis(extractedData)
      const teamAnalysis = this.performTeamAnalysis(extractedData)
      const productAnalysis = this.performProductAnalysis(extractedData)
      const investmentReadiness = this.assessInvestmentReadiness(extractedData)
      
      // Calcola score complessivo
      const overallScore = this.calculateOverallScore({
        berkus: berkusAnalysis.total_valuation,
        scorecard: scorecardAnalysis.weighted_score,
        market: marketAnalysis.som_analysis.confidence,
        team: teamAnalysis.founder_market_fit.score,
        product: productAnalysis.product_market_fit.score,
        financial: financialAnalysis.revenue_model.clarity
      })
      
      // Calcola range di valutazione
      const valuationRange = this.calculateValuationRange(berkusAnalysis, scorecardAnalysis, riskFactorAnalysis)
      
      // Genera raccomandazioni e next steps
      const recommendations = this.generateRecommendations(extractedData, overallScore)
      const missingAreas = this.identifyMissingAreas(extractedData)
      const nextSteps = this.generateNextSteps(overallScore, investmentReadiness)
      
      // Genera Executive Summary dettagliato
      const executiveSummary = this.generateExecutiveSummary(extractedData, overallScore, valuationRange)
      
      return {
        overall_score: overallScore,
        valuation_range: valuationRange,
        berkus_analysis: berkusAnalysis,
        scorecard_analysis: scorecardAnalysis,
        risk_factor_analysis: riskFactorAnalysis,
        market_analysis: marketAnalysis,
        competitive_analysis: competitiveAnalysis,
        financial_analysis: financialAnalysis,
        team_analysis: teamAnalysis,
        product_analysis: productAnalysis,
        investment_readiness: investmentReadiness,
        recommendations,
        missing_areas: missingAreas,
        next_steps: nextSteps,
        executive_summary: executiveSummary
      }
      
    } catch (error) {
      console.error('❌ AI Analyzer: Error in document analysis:', error)
      throw new Error('Errore durante l\'analisi del documento')
    }
  }
  
  // Converte dati questionario in formato per analisi
  private convertQuestionnaireToAnalysisData(data: QuestionnaireData): any {
    return {
      content: `${data.project_name} - ${data.project_description} - ${data.problem_solution}`,
      contentLength: (data.project_description + data.problem_solution).length,
      hasMarketAnalysis: !!(data.target_market && data.market_validation),
      hasCompetitiveAnalysis: !!(data.competitors && data.competitive_advantage),
      hasFinancialProjections: !!(data.revenue_projections && data.funding_needs),
      hasTeamInfo: !!(data.team_size && data.team_experience),
      hasProductInfo: !!(data.product_stage && data.unique_value),
      hasBusinessModel: !!data.business_model,
      hasTechnology: data.product_stage.includes('MVP') || data.product_stage.includes('Prototipo'),
      hasInvestmentInfo: !!data.funding_needs,
      wordCount: Object.values(data).join(' ').split(/\s+/).length,
      sections: Object.keys(data).filter(key => data[key as keyof QuestionnaireData]),
      // Dati specifici del questionario
      questionnaire: {
        teamSize: data.team_size,
        teamExperience: data.team_experience,
        teamAdvisors: data.team_advisors,
        targetMarket: data.target_market,
        marketSize: data.market_size,
        marketValidation: data.market_validation,
        productStage: data.product_stage,
        uniqueValue: data.unique_value,
        customerFeedback: data.customer_feedback,
        competitors: data.competitors,
        competitiveAdvantage: data.competitive_advantage,
        businessModel: data.business_model,
        revenueProjections: data.revenue_projections,
        fundingNeeds: data.funding_needs,
        currentRevenue: data.current_revenue
      }
    }
  }
  
  private extractKeyInformation(content: string) {
    const contentLower = content.toLowerCase()
    
    // Estrae indicatori chiave dal contenuto
    const hasMarketAnalysis = this.checkForKeywords(contentLower, ['mercato', 'market', 'tam', 'sam', 'som', 'target'])
    const hasCompetitiveAnalysis = this.checkForKeywords(contentLower, ['competitor', 'concorrenza', 'competitivo', 'vantaggio'])
    const hasFinancialProjections = this.checkForKeywords(contentLower, ['ricavi', 'revenue', 'fatturato', 'proiezioni', 'budget'])
    const hasTeamInfo = this.checkForKeywords(contentLower, ['team', 'founder', 'fondatore', 'ceo', 'cto', 'esperienza'])
    const hasProductInfo = this.checkForKeywords(contentLower, ['prodotto', 'product', 'servizio', 'mvp', 'prototipo'])
    const hasBusinessModel = this.checkForKeywords(contentLower, ['business model', 'modello', 'monetizzazione', 'ricavi'])
    const hasTechnology = this.checkForKeywords(contentLower, ['tecnologia', 'technology', 'piattaforma', 'software', 'ai', 'ml'])
    const hasInvestmentInfo = this.checkForKeywords(contentLower, ['investimento', 'finanziamento', 'funding', 'capitale'])
    
    return {
      content,
      contentLength: content.length,
      hasMarketAnalysis,
      hasCompetitiveAnalysis,
      hasFinancialProjections,
      hasTeamInfo,
      hasProductInfo,
      hasBusinessModel,
      hasTechnology,
      hasInvestmentInfo,
      wordCount: content.split(/\s+/).length,
      sections: this.identifySections(content)
    }
  }
  
  private checkForKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword))
  }
  
  private identifySections(content: string): string[] {
    const sections = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      if (line.length > 0 && line.length < 100 && 
          (line.includes(':') || line.match(/^[A-Z][a-z]/))) {
        sections.push(line.trim())
      }
    }
    
    return sections.slice(0, 20)
  }
  
  private performBerkusAnalysis(data: any): any {
    // Migliora l'analisi se abbiamo dati del questionario
    const hasQuestionnaire = !!data.questionnaire
    
    const baseValue = {
      score: data.hasProductInfo ? 
        (hasQuestionnaire && data.questionnaire.productStage === 'MVP' ? 90000 : 
         data.contentLength > 5000 ? 80000 : 50000) : 20000,
      max: 100000,
      reasoning: hasQuestionnaire ? 
        `Stadio prodotto: ${data.questionnaire.productStage}. ${data.questionnaire.productStage === 'MVP' ? 'MVP funzionante con validazione iniziale' : 'Prodotto in fase di sviluppo, necessaria validazione mercato'}` :
        (data.hasProductInfo ? 'Prodotto ben descritto con dettagli tecnici, necessaria validazione mercato' : 'Informazioni sul prodotto limitate, necessario approfondimento significativo')
    }
    
    const technology = {
      score: hasQuestionnaire ? 
        (data.questionnaire.productStage.includes('completo') ? 85000 :
         data.questionnaire.productStage.includes('MVP') ? 70000 : 45000) :
        (data.hasTechnology ? (data.sections.length > 10 ? 70000 : 45000) : 15000),
      max: 100000,
      reasoning: hasQuestionnaire ? 
        `Valore unico: ${data.questionnaire.uniqueValue ? 'Definito chiaramente' : 'Da approfondire'}. Necessaria valutazione scalabilità tecnica` :
        (data.hasTechnology ? 'Stack tecnologico identificato, necessaria valutazione scalabilità e IP protection' : 'Aspetti tecnologici poco chiari, servono specifiche tecniche dettagliate')
    }
    
    const execution = {
      score: hasQuestionnaire ? 
        (data.questionnaire.teamSize === '5+ persone' ? 80000 :
         data.questionnaire.teamSize === '3-4 persone' ? 65000 : 40000) :
        (data.hasTeamInfo ? (data.hasFinancialProjections ? 65000 : 40000) : 25000),
      max: 100000,
      reasoning: hasQuestionnaire ? 
        `Team di ${data.questionnaire.teamSize} con esperienza: ${data.questionnaire.teamExperience ? 'Documentata' : 'Da validare'}` :
        (data.hasTeamInfo ? 'Team presente con esperienza, capacità esecutiva da validare con track record' : 'Informazioni sul team insufficienti per valutare capacità di esecuzione')
    }
    
    const marketRelationships = {
      score: hasQuestionnaire ? 
        (data.questionnaire.marketValidation && data.questionnaire.targetMarket ? 75000 : 35000) :
        (data.hasMarketAnalysis ? (data.hasCompetitiveAnalysis ? 60000 : 35000) : 20000),
      max: 100000,
      reasoning: hasQuestionnaire ? 
        `Validazione mercato: ${data.questionnaire.marketValidation ? 'Effettuata' : 'Mancante'}. Target: ${data.questionnaire.targetMarket ? 'Definito' : 'Da specificare'}` :
        (data.hasMarketAnalysis ? 'Comprensione del mercato dimostrata, partnership strategiche da sviluppare' : 'Analisi di mercato carente, relazioni strategiche e canali non evidenti')
    }
    
    const productionSales = {
      score: hasQuestionnaire ? 
        (data.questionnaire.businessModel && data.questionnaire.revenueProjections ? 70000 : 
         data.questionnaire.businessModel ? 50000 : 30000) :
        (data.hasInvestmentInfo ? (data.hasBusinessModel ? 55000 : 30000) : 15000),
      max: 100000,
      reasoning: hasQuestionnaire ? 
        `Business Model: ${data.questionnaire.businessModel}. Proiezioni: ${data.questionnaire.revenueProjections ? 'Presenti' : 'Mancanti'}` :
        (data.hasBusinessModel ? 'Modello di business delineato, metriche di vendita e produzione da implementare' : 'Strategia di produzione e vendita non sufficientemente dettagliata')
    }
    
    const totalValuation = baseValue.score + technology.score + execution.score + marketRelationships.score + productionSales.score
    
    return {
      base_value: baseValue,
      technology,
      execution,
      market_relationships: marketRelationships,
      production_sales: productionSales,
      total_valuation: totalValuation,
      summary: `Valutazione Berkus: ${Math.round(totalValuation / 1000)}K EUR`
    }
  }
  
  private performScorecardAnalysis(data: any): any {
    const hasQuestionnaire = !!data.questionnaire
    
    const managementStrength = {
      score: hasQuestionnaire ? 
        (data.questionnaire.teamSize === '5+ persone' ? 90 :
         data.questionnaire.teamSize === '3-4 persone' ? 75 :
         data.questionnaire.teamSize === '2 persone' ? 60 : 40) :
        (data.hasTeamInfo ? (data.wordCount > 3000 ? 85 : 65) : 40),
      weight: 30,
      reasoning: hasQuestionnaire ? 
        `Team ${data.questionnaire.teamSize}. Esperienza: ${data.questionnaire.teamExperience ? 'Documentata' : 'Da validare'}. Advisor: ${data.questionnaire.teamAdvisors ? 'Presenti' : 'Mancanti'}` :
        (data.hasTeamInfo ? 'Management identificato, necessaria valutazione track record e competenze settoriali' : 'Informazioni sul management insufficienti per valutazione approfondita')
    }
    
    const marketSize = {
      score: hasQuestionnaire ? 
        (data.questionnaire.marketSize ? 85 :
         data.questionnaire.targetMarket && data.questionnaire.marketValidation ? 70 : 45) :
        (data.hasMarketAnalysis ? (data.sections.length > 8 ? 80 : 60) : 35),
      weight: 25,
      reasoning: hasQuestionnaire ? 
        `Target Market: ${data.questionnaire.targetMarket ? 'Definito' : 'Generico'}. Dimensioni: ${data.questionnaire.marketSize ? 'Quantificate' : 'Stimate'}. Validazione: ${data.questionnaire.marketValidation ? 'Effettuata' : 'Mancante'}` :
        (data.hasMarketAnalysis ? 'Dimensioni di mercato accennate, necessaria quantificazione TAM/SAM/SOM con fonti' : 'Analisi dimensioni mercato completamente mancante')
    }
    
    const productTechnology = {
      score: hasQuestionnaire ? 
        (data.questionnaire.productStage === 'Prodotto completo' ? 90 :
         data.questionnaire.productStage === 'MVP' ? 80 :
         data.questionnaire.productStage === 'Prototipo' ? 65 : 45) :
        (data.hasProductInfo ? (data.hasTechnology ? 75 : 55) : 30),
      weight: 15,
      reasoning: hasQuestionnaire ? 
        `Stadio: ${data.questionnaire.productStage}. Valore unico: ${data.questionnaire.uniqueValue ? 'Chiaramente definito' : 'Da approfondire'}. Feedback: ${data.questionnaire.customerFeedback ? 'Raccolto' : 'Mancante'}` :
        (data.hasProductInfo ? 'Prodotto/tecnologia descritti, necessaria valutazione differenziazione competitiva' : 'Specifiche prodotto/tecnologia insufficienti per valutazione')
    }
    
    const partnershipsMarketing = {
      score: hasQuestionnaire ? 
        (data.questionnaire.businessModel && data.questionnaire.targetMarket ? 80 : 55) :
        (data.hasBusinessModel ? 70 : 45),
      weight: 10,
      reasoning: hasQuestionnaire ? 
        `Business Model: ${data.questionnaire.businessModel}. Go-to-market strategy basata su target definito: ${data.questionnaire.targetMarket ? 'Sì' : 'No'}` :
        (data.hasBusinessModel ? 'Strategia commerciale accennata, partnership strategiche da definire' : 'Canali di marketing, vendita e partnership strategiche non chiari')
    }
    
    const competitiveEnvironment = {
      score: hasQuestionnaire ? 
        (data.questionnaire.competitors && data.questionnaire.competitiveAdvantage ? 85 : 50) :
        (data.hasCompetitiveAnalysis ? 75 : 40),
      weight: 10,
      reasoning: hasQuestionnaire ? 
        `Competitor identificati: ${data.questionnaire.competitors ? 'Sì' : 'No'}. Vantaggio competitivo: ${data.questionnaire.competitiveAdvantage ? 'Definito chiaramente' : 'Generico'}` :
        (data.hasCompetitiveAnalysis ? 'Ambiente competitivo analizzato, vantaggio competitivo sostenibile da consolidare' : 'Analisi competitiva carente, positioning non chiaro')
    }
    
    const additionalInvestmentNeeds = {
      score: hasQuestionnaire ? 
        (data.questionnaire.fundingNeeds && data.questionnaire.revenueProjections ? 90 : 65) :
        (data.hasInvestmentInfo ? 80 : 50),
      weight: 5,
      reasoning: hasQuestionnaire ? 
        `Fabbisogni definiti: ${data.questionnaire.fundingNeeds}. Proiezioni: ${data.questionnaire.revenueProjections ? 'Dettagliate' : 'Generiche'}. Ricavi attuali: ${data.questionnaire.currentRevenue || 'Pre-revenue'}` :
        (data.hasInvestmentInfo ? 'Fabbisogni finanziari indicati, necessario business plan dettagliato con milestone' : 'Necessità di investimento aggiuntivo non quantificate')
    }
    
    const others = {
      score: hasQuestionnaire ? 75 : (data.contentLength > 8000 ? 70 : 50),
      weight: 5,
      reasoning: hasQuestionnaire ? 
        'Questionario completo fornisce base solida, necessari approfondimenti legali e regolatori' :
        (data.contentLength > 8000 ? 'Documentazione completa, alcuni aspetti regolatori e legali da approfondire' : 'Documentazione incompleta, necessari approfondimenti in multiple aree')
    }
    
    const weightedScore = Math.round(
      (managementStrength.score * managementStrength.weight +
       marketSize.score * marketSize.weight +
       productTechnology.score * productTechnology.weight +
       partnershipsMarketing.score * partnershipsMarketing.weight +
       competitiveEnvironment.score * competitiveEnvironment.weight +
       additionalInvestmentNeeds.score * additionalInvestmentNeeds.weight +
       others.score * others.weight) / 100
    )
    
    return {
      management_strength: managementStrength,
      market_size: marketSize,
      product_technology: productTechnology,
      partnerships_marketing: partnershipsMarketing,
      competitive_environment: competitiveEnvironment,
      additional_investment_needs: additionalInvestmentNeeds,
      others,
      weighted_score: weightedScore,
      summary: `Score Scorecard: ${weightedScore}/100 - ${weightedScore > 80 ? 'Eccellente' : weightedScore > 65 ? 'Molto Buono' : weightedScore > 50 ? 'Buono' : 'Da migliorare'}`
    }
  }
  
  private performRiskFactorAnalysis(data: any): any {
    const hasQuestionnaire = !!data.questionnaire
    
    const managementRisk = {
      level: hasQuestionnaire ? 
        (data.questionnaire.teamSize === '5+ persone' && data.questionnaire.teamExperience ? 'low' :
         data.questionnaire.teamSize !== 'Solo io' ? 'medium' : 'high') :
        (data.hasTeamInfo ? (data.wordCount > 5000 ? 'low' : 'medium') : 'high'),
      impact: hasQuestionnaire ? 
        (data.questionnaire.teamSize === '5+ persone' ? 10 :
         data.questionnaire.teamSize !== 'Solo io' ? 0 : -20) :
        (data.hasTeamInfo ? (data.wordCount > 5000 ? 5 : -10) : -25),
      description: hasQuestionnaire ? 
        `Team ${data.questionnaire.teamSize} con esperienza ${data.questionnaire.teamExperience ? 'documentata' : 'da validare'}. Advisor: ${data.questionnaire.teamAdvisors ? 'presenti' : 'assenti'}` :
        (data.hasTeamInfo ? 'Team descritto ma necessaria valutazione competenze specifiche e track record' : 'Informazioni sul team insufficienti, alto rischio esecutivo per il progetto')
    }
    
    const marketRisk = {
      level: hasQuestionnaire ? 
        (data.questionnaire.marketValidation && data.questionnaire.targetMarket ? 'low' : 'medium') :
        (data.hasMarketAnalysis ? (data.hasCompetitiveAnalysis ? 'low' : 'medium') : 'high'),
      impact: hasQuestionnaire ? 
        (data.questionnaire.marketValidation ? 15 : -10) :
        (data.hasMarketAnalysis ? (data.hasCompetitiveAnalysis ? 10 : -5) : -20),
      description: hasQuestionnaire ? 
        `Validazione mercato: ${data.questionnaire.marketValidation ? 'effettuata' : 'mancante'}. Target: ${data.questionnaire.targetMarket ? 'definito' : 'generico'}` :
        (data.hasMarketAnalysis ? 'Mercato analizzato, necessaria validazione domanda e customer acquisition' : 'Analisi di mercato carente, alto rischio di product-market fit')
    }
    
    const technologyRisk = {
      level: hasQuestionnaire ? 
        (data.questionnaire.productStage === 'Prodotto completo' ? 'low' :
         data.questionnaire.productStage === 'MVP' ? 'medium' : 'high') :
        (data.hasTechnology ? (data.hasProductInfo ? 'low' : 'medium') : 'high'),
      impact: hasQuestionnaire ? 
        (data.questionnaire.productStage === 'Prodotto completo' ? 10 :
         data.questionnaire.productStage === 'MVP' ? 0 : -15) :
        (data.hasTechnology ? (data.hasProductInfo ? 5 : -10) : -15),
      description: hasQuestionnaire ? 
        `Stadio prodotto: ${data.questionnaire.productStage}. Feedback clienti: ${data.questionnaire.customerFeedback ? 'raccolto' : 'mancante'}` :
        (data.hasTechnology ? 'Tecnologia descritta, necessaria valutazione scalabilità e implementazione' : 'Aspetti tecnologici poco chiari, rischio significativo di implementazione')
    }
    
    const competitiveRisk = {
      level: hasQuestionnaire ? 
        (data.questionnaire.competitors && data.questionnaire.competitiveAdvantage ? 'medium' : 'high') :
        (data.hasCompetitiveAnalysis ? 'medium' : 'high'),
      impact: hasQuestionnaire ? 
        (data.questionnaire.competitiveAdvantage ? 5 : -15) :
        (data.hasCompetitiveAnalysis ? -5 : -15),
      description: hasQuestionnaire ? 
        `Competitor: ${data.questionnaire.competitors ? 'identificati' : 'non analizzati'}. Vantaggio: ${data.questionnaire.competitiveAdvantage ? 'definito' : 'generico'}` :
        (data.hasCompetitiveAnalysis ? 'Concorrenza analizzata, necessario monitoraggio continuo e differenziazione' : 'Analisi competitiva insufficiente, rischio di essere superati da competitor')
    }
    
    const financialRisk = {
      level: hasQuestionnaire ? 
        (data.questionnaire.revenueProjections && data.questionnaire.currentRevenue ? 'low' :
         data.questionnaire.businessModel ? 'medium' : 'high') :
        (data.hasFinancialProjections ? (data.hasBusinessModel ? 'medium' : 'high') : 'high'),
      impact: hasQuestionnaire ? 
        (data.questionnaire.revenueProjections ? 5 :
         data.questionnaire.businessModel ? -5 : -20) :
        (data.hasFinancialProjections ? (data.hasBusinessModel ? -5 : -15) : -20),
      description: hasQuestionnaire ? 
        `Business model: ${data.questionnaire.businessModel}. Proiezioni: ${data.questionnaire.revenueProjections ? 'presenti' : 'mancanti'}. Ricavi: ${data.questionnaire.currentRevenue || 'pre-revenue'}` :
        (data.hasFinancialProjections ? 'Proiezioni finanziarie presenti, necessaria validazione modello e assumzioni' : 'Piano finanziario carente, rischio significativo di sostenibilità economica')
    }
    
    const regulatoryRisk = {
      level: 'medium',
      impact: -5,
      description: 'Aspetti regolatori e compliance da valutare approfonditamente in base al settore'
    }
    
    const totalRiskAdjustment = managementRisk.impact + marketRisk.impact + technologyRisk.impact + competitiveRisk.impact + financialRisk.impact + regulatoryRisk.impact
    
    return {
      management_risk: managementRisk,
      market_risk: marketRisk,
      technology_risk: technologyRisk,
      competitive_risk: competitiveRisk,
      financial_risk: financialRisk,
      regulatory_risk: regulatoryRisk,
      total_risk_adjustment: totalRiskAdjustment,
      summary: `Aggiustamento rischio: ${totalRiskAdjustment > 0 ? '+' : ''}${totalRiskAdjustment}% - ${totalRiskAdjustment > 10 ? 'Profilo molto favorevole' : totalRiskAdjustment > 0 ? 'Profilo favorevole' : 'Rischi da mitigare'}`
    }
  }
  
  private performMarketAnalysis(data: any): any {
    const hasQuestionnaire = !!data.questionnaire
    
    const tamAnalysis = {
      size: hasQuestionnaire && data.questionnaire.marketSize ? 
        this.parseMarketSize(data.questionnaire.marketSize) :
        (data.hasMarketAnalysis ? (data.wordCount > 4000 ? 1000000000 : 500000000) : 100000000),
      confidence: hasQuestionnaire ? 
        (data.questionnaire.marketSize ? 85 : 
         data.questionnaire.targetMarket ? 65 : 45) :
        (data.hasMarketAnalysis ? (data.sections.length > 10 ? 70 : 50) : 30),
      reasoning: hasQuestionnaire ? 
        `Target market: ${data.questionnaire.targetMarket || 'Non specificato'}. Dimensioni quantificate: ${data.questionnaire.marketSize ? 'Sì' : 'No'}` :
        (data.hasMarketAnalysis ? 'Mercato totale identificato, necessaria quantificazione precisa con fonti autorevoli' : 'Dimensioni del mercato totale da definire con ricerca di mercato strutturata')
    }
    
    const samAnalysis = {
      size: Math.round(tamAnalysis.size * 0.1),
      confidence: tamAnalysis.confidence - 10,
      reasoning: hasQuestionnaire ? 
        `Mercato servibile stimato in base a target: ${data.questionnaire.targetMarket}` :
        (data.hasMarketAnalysis ? 'Mercato servibile stimato, necessaria segmentazione dettagliata per target' : 'Mercato servibile da definire in base a geografia, segmenti e capacità')
    }
    
    const somAnalysis = {
      size: Math.round(samAnalysis.size * 0.05),
      confidence: samAnalysis.confidence - 10,
      reasoning: hasQuestionnaire ? 
        `Mercato ottenibile basato su capacità team (${data.questionnaire.teamSize}) e stadio prodotto (${data.questionnaire.productStage})` :
        (data.hasMarketAnalysis ? 'Mercato ottenibile stimato, necessaria validazione con strategia go-to-market' : 'Mercato ottenibile da calcolare in base a capacità operative e strategia')
    }
    
    return {
      tam_analysis: tamAnalysis,
      sam_analysis: samAnalysis,
      som_analysis: somAnalysis,
      market_growth: {
        rate: hasQuestionnaire ? 
          (data.questionnaire.marketValidation ? 18 : 12) :
          (data.hasMarketAnalysis ? 15 : 10),
        sustainability: hasQuestionnaire ? 
          (data.questionnaire.targetMarket && data.questionnaire.marketValidation ? 80 : 60) :
          (data.hasMarketAnalysis ? 70 : 50),
        reasoning: hasQuestionnaire ? 
          `Crescita stimata in base a validazione mercato effettuata: ${data.questionnaire.marketValidation ? 'Sì' : 'No'}` :
          'Crescita di mercato da validare con dati di settore e trend analysis'
      },
      market_maturity: {
        stage: hasQuestionnaire ? 
          (data.questionnaire.competitors ? 'Growing' : 'Emerging') :
          (data.hasMarketAnalysis ? 'Growing' : 'Undefined'),
        score: hasQuestionnaire ? 
          (data.questionnaire.competitors && data.questionnaire.marketValidation ? 75 : 55) :
          (data.hasMarketAnalysis ? 65 : 40),
        reasoning: hasQuestionnaire ? 
          `Maturità basata su presenza competitor (${data.questionnaire.competitors ? 'identificati' : 'non analizzati'}) e validazione market` :
          'Maturità del mercato da analizzare con lifecycle analysis dettagliata'
      },
      customer_validation: {
        score: hasQuestionnaire ? 
          (data.questionnaire.marketValidation && data.questionnaire.customerFeedback ? 85 :
           data.questionnaire.marketValidation ? 70 : 35) :
          (data.hasMarketAnalysis ? 55 : 30),
        evidence: hasQuestionnaire ? 
          [data.questionnaire.marketValidation || 'Validazione non effettuata',
           data.questionnaire.customerFeedback || 'Feedback clienti non raccolto'].filter(Boolean) :
          (data.hasMarketAnalysis ? ['Ricerca di mercato menzionata'] : ['Validazione cliente mancante'])
      },
      summary: `TAM: ${Math.round(tamAnalysis.size / 1000000)}M EUR - SAM: ${Math.round(samAnalysis.size / 1000000)}M EUR - SOM: ${Math.round(somAnalysis.size / 1000000)}M EUR`
    }
  }
  
  private parseMarketSize(marketSizeText: string): number {
    // Prova a estrarre numeri dal testo delle dimensioni di mercato
    const numbers = marketSizeText.match(/(\d+(?:[\.,]\d+)?)\s*([kmbt]?)/gi)
    if (numbers && numbers.length > 0) {
      const match = numbers[0].match(/(\d+(?:[\.,]\d+)?)\s*([kmbt]?)/i)
      if (match) {
        let value = parseFloat(match[1].replace(',', '.'))
        const multiplier = match[2]?.toLowerCase()
        
        switch (multiplier) {
          case 'k': value *= 1000; break
          case 'm': value *= 1000000; break
          case 'b': value *= 1000000000; break
          case 't': value *= 1000000000000; break
        }
        
        return value
      }
    }
    // Default se non riesco a parsare
    return 500000000
  }
  
  private performCompetitiveAnalysis(data: any): any {
    const hasQuestionnaire = !!data.questionnaire
    
    return {
      competitive_position: {
        score: hasQuestionnaire ? 
          (data.questionnaire.competitors && data.questionnaire.competitiveAdvantage ? 80 : 45) :
          (data.hasCompetitiveAnalysis ? 65 : 35),
        reasoning: hasQuestionnaire ? 
          `Competitor identificati: ${data.questionnaire.competitors || 'Non specificati'}. Vantaggio competitivo: ${data.questionnaire.competitiveAdvantage || 'Da definire'}` :
          (data.hasCompetitiveAnalysis ? 'Posizionamento competitivo identificato, necessaria mappatura dettagliata dei competitor' : 'Posizionamento competitivo da definire con analisi strutturata del mercato')
      },
      differentiation: {
        score: hasQuestionnaire ? 
          (data.questionnaire.uniqueValue && data.questionnaire.competitiveAdvantage ? 85 : 
           data.questionnaire.uniqueValue ? 65 : 40) :
          (data.hasProductInfo ? (data.hasTechnology ? 70 : 50) : 35),
        unique_factors: hasQuestionnaire ? 
          [data.questionnaire.uniqueValue || 'Valore unico da definire chiaramente'] :
          (data.hasProductInfo ? ['Caratteristiche prodotto innovative identificate'] : ['Fattori differenzianti da identificare e sviluppare'])
      },
      barriers_to_entry: {
        score: hasQuestionnaire ? 
          (data.questionnaire.productStage === 'Prodotto completo' ? 75 :
           data.questionnaire.productStage === 'MVP' ? 60 : 45) :
          (data.hasTechnology ? 60 : 40),
        barriers: hasQuestionnaire ? 
          [`Stadio sviluppo: ${data.questionnaire.productStage}`, 'Know-how specifico del team'] :
          (data.hasTechnology ? ['Barriere tecnologiche potenziali'] : ['Barriere all\'ingresso da sviluppare strategicamente'])
      },
      competitive_advantages: {
        sustainable: hasQuestionnaire ? 
          !!(data.questionnaire.competitiveAdvantage && data.questionnaire.uniqueValue) :
          (data.hasCompetitiveAnalysis && data.hasTechnology),
        advantages: hasQuestionnaire ? 
          [data.questionnaire.competitiveAdvantage || 'Vantaggio competitivo da consolidare'] :
          (data.hasCompetitiveAnalysis ? ['Vantaggio competitivo identificato'] : ['Vantaggi competitivi da consolidare e proteggere'])
      },
      threat_level: {
        score: hasQuestionnaire ? 
          (data.questionnaire.competitors && data.questionnaire.competitiveAdvantage ? 70 : 45) :
          (data.hasCompetitiveAnalysis ? 60 : 40),
        threats: ['Nuovi entranti nel mercato', 'Tecnologie disruptive', 'Cambiamenti regolatori', 'Competitor consolidati']
      },
      summary: hasQuestionnaire ? 
        `Positioning: ${data.questionnaire.competitiveAdvantage ? 'Definito' : 'Da sviluppare'} - Differenziazione: ${data.questionnaire.uniqueValue ? 'Chiara' : 'Da rafforzare'}` :
        `Posizione competitiva: ${data.hasCompetitiveAnalysis ? 'Identificata' : 'Da definire'} - Differenziazione: ${data.hasProductInfo ? 'Presente' : 'Mancante'}`
    }
  }
  
  private performFinancialAnalysis(data: any): any {
    const hasQuestionnaire = !!data.questionnaire
    
    return {
      revenue_model: {
        clarity: hasQuestionnaire ? 
          (data.questionnaire.businessModel && data.questionnaire.revenueProjections ? 85 :
           data.questionnaire.businessModel ? 70 : 40) :
          (data.hasBusinessModel ? (data.hasFinancialProjections ? 75 : 55) : 35),
        scalability: hasQuestionnaire ? 
          this.assessBusinessModelScalability(data.questionnaire.businessModel) :
          (data.hasBusinessModel ? 65 : 40),
        reasoning: hasQuestionnaire ? 
          `Modello: ${data.questionnaire.businessModel}. Proiezioni: ${data.questionnaire.revenueProjections ? 'Dettagliate' : 'Mancanti'}. Ricavi attuali: ${data.questionnaire.currentRevenue || 'Pre-revenue'}` :
          (data.hasBusinessModel ? 'Modello di ricavi identificato, necessaria quantificazione unit economics dettagliata' : 'Modello di ricavi da definire con chiarezza e sostenibilità economica')
      },
      unit_economics: {
        ltv_cac_ratio: hasQuestionnaire ? 
          (data.questionnaire.currentRevenue ? 4.2 :
           data.questionnaire.revenueProjections ? 3.8 : 2.5) :
          (data.hasFinancialProjections ? 3.5 : 2.0),
        payback_period: hasQuestionnaire ? 
          (data.questionnaire.businessModel?.includes('Abbonamento') ? 8 : 
           data.questionnaire.currentRevenue ? 10 : 15) :
          (data.hasFinancialProjections ? 12 : 18),
        reasoning: hasQuestionnaire ? 
          `Unit economics stimate basate su modello ${data.questionnaire.businessModel} e ricavi ${data.questionnaire.currentRevenue || 'futuri'}` :
          (data.hasFinancialProjections ? 'Metriche economiche stimate, necessaria validazione con dati reali' : 'Unit economics da calcolare con precisione per sostenibilità')
      },
      financial_projections: {
        realism: hasQuestionnaire ? 
          (data.questionnaire.revenueProjections && data.questionnaire.currentRevenue ? 85 :
           data.questionnaire.revenueProjections ? 70 : 45) :
          (data.hasFinancialProjections ? 65 : 30),
        growth_rate: hasQuestionnaire ? 
          (data.questionnaire.currentRevenue ? 120 :
           data.questionnaire.productStage === 'MVP' ? 180 : 200) :
          (data.hasFinancialProjections ? 150 : 100),
        reasoning: hasQuestionnaire ? 
          `Proiezioni basate su stadio ${data.questionnaire.productStage} e ricavi ${data.questionnaire.currentRevenue || 'pianificati'}` :
          (data.hasFinancialProjections ? 'Proiezioni finanziarie presenti, necessaria validazione ipotesi e scenari' : 'Proiezioni finanziarie da sviluppare con modello dettagliato e realistico')
      },
      funding_requirements: {
        amount: hasQuestionnaire ? 
          this.parseFundingAmount(data.questionnaire.fundingNeeds) :
          (data.hasInvestmentInfo ? 500000 : 300000),
        runway: hasQuestionnaire ? 
          (data.questionnaire.teamSize === '5+ persone' ? 15 :
           data.questionnaire.teamSize === '3-4 persone' ? 18 : 24) :
          (data.hasInvestmentInfo ? 18 : 12),
        milestones: hasQuestionnaire ? 
          this.generateMilestones(data.questionnaire) :
          (data.hasInvestmentInfo ? ['Milestone identificate nel piano'] : ['Milestone da definire per round'])
      },
      path_to_profitability: {
        timeline: hasQuestionnaire ? 
          (data.questionnaire.currentRevenue ? 18 :
           data.questionnaire.productStage === 'MVP' ? 24 : 30) :
          (data.hasFinancialProjections ? 24 : 36),
        probability: hasQuestionnaire ? 
          (data.questionnaire.revenueProjections && data.questionnaire.businessModel ? 75 :
           data.questionnaire.businessModel ? 60 : 45) :
          (data.hasFinancialProjections ? 65 : 45),
        reasoning: hasQuestionnaire ? 
          `Timeline basata su stadio ${data.questionnaire.productStage} e modello ${data.questionnaire.businessModel}` :
          (data.hasFinancialProjections ? 'Percorso verso profittabilità delineato con assumzioni' : 'Percorso verso profittabilità da pianificare dettagliatamente')
      },
      summary: hasQuestionnaire ? 
        `Modello: ${data.questionnaire.businessModel} - Funding: ${data.questionnaire.fundingNeeds} - Ricavi: ${data.questionnaire.currentRevenue || 'Pre-revenue'}` :
        `Modello ricavi: ${data.hasBusinessModel ? 'Definito' : 'Da sviluppare'} - Proiezioni: ${data.hasFinancialProjections ? 'Presenti' : 'Mancanti'}`
    }
  }
  
  private assessBusinessModelScalability(businessModel: string): number {
    if (!businessModel) return 40
    
    const scalableModels = ['Abbonamento mensile', 'Licenza annuale', 'Freemium']
    const moderateModels = ['Commissione per transazione']
    const limitedModels = ['Vendita una tantum']
    
    if (scalableModels.some(model => businessModel.includes(model))) return 85
    if (moderateModels.some(model => businessModel.includes(model))) return 70
    if (limitedModels.some(model => businessModel.includes(model))) return 55
    
    return 60 // Default per "Altro"
  }
  
  private parseFundingAmount(fundingText: string): number {
    if (!fundingText) return 300000
    
    const numbers = fundingText.match(/(\d+(?:[\.,]\d+)?)\s*([kmbt]?)/gi)
    if (numbers && numbers.length > 0) {
      const match = numbers[0].match(/(\d+(?:[\.,]\d+)?)\s*([kmbt]?)/i)
      if (match) {
        let value = parseFloat(match[1].replace(',', '.'))
        const multiplier = match[2]?.toLowerCase()
        
        switch (multiplier) {
          case 'k': value *= 1000; break
          case 'm': value *= 1000000; break
          case 'b': value *= 1000000000; break
        }
        
        return value
      }
    }
    
    return 500000 // Default
  }
  
  private generateMilestones(questionnaire: any): string[] {
    const milestones = []
    
    if (questionnaire.productStage === 'Idea/Concept') {
      milestones.push('Sviluppo MVP entro 6 mesi')
    } else if (questionnaire.productStage === 'Prototipo') {
      milestones.push('Lancio MVP entro 3 mesi')
    } else if (questionnaire.productStage === 'MVP') {
      milestones.push('Product-market fit validation entro 4 mesi')
    }
    
    if (!questionnaire.currentRevenue) {
      milestones.push('Primi ricavi entro 8 mesi')
    } else {
      milestones.push('Crescita ricavi 10x entro 12 mesi')
    }
    
    if (questionnaire.teamSize === 'Solo io') {
      milestones.push('Espansione team con CTO/CMO entro 6 mesi')
    }
    
    milestones.push('Serie A readiness entro 18 mesi')
    
    return milestones
  }
  
  private performTeamAnalysis(data: any): any {
    const hasQuestionnaire = !!data.questionnaire
    
    return {
      founder_market_fit: {
        score: hasQuestionnaire ? 
          (data.questionnaire.teamExperience && data.questionnaire.marketValidation ? 85 :
           data.questionnaire.teamExperience ? 70 : 50) :
          (data.hasTeamInfo ? (data.hasMarketAnalysis ? 70 : 55) : 35),
        reasoning: hasQuestionnaire ? 
          `Esperienza team: ${data.questionnaire.teamExperience ? 'Documentata' : 'Non specificata'}. Validazione mercato: ${data.questionnaire.marketValidation ? 'Effettuata' : 'Mancante'}` :
          (data.hasTeamInfo ? 'Team identificato, necessaria valutazione esperienza settoriale specifica' : 'Informazioni sul team insufficienti per valutare founder-market fit')
      },
      team_completeness: {
        score: hasQuestionnaire ? 
          this.assessTeamCompleteness(data.questionnaire.teamSize, data.questionnaire.teamExperience) :
          (data.hasTeamInfo ? 60 : 30),
        missing_roles: hasQuestionnaire ? 
          this.identifyMissingRoles(data.questionnaire.teamSize) :
          (data.hasTeamInfo ? ['Ruoli specialistici da definire'] : ['CEO', 'CTO', 'CMO', 'Head of Sales', 'CFO'])
      },
      experience_relevance: {
        score: hasQuestionnaire ? 
          (data.questionnaire.teamExperience ? 80 : 40) :
          (data.hasTeamInfo ? 65 : 35),
        key_experiences: hasQuestionnaire ? 
          [data.questionnaire.teamExperience || 'Esperienza da documentare'] :
          (data.hasTeamInfo ? ['Esperienza settoriale presente'] : ['Esperienza rilevante da documentare'])
      },
      track_record: {
        score: hasQuestionnaire ? 
          (data.questionnaire.teamExperience?.includes('startup') || 
           data.questionnaire.teamExperience?.includes('manager') ? 75 : 55) :
          (data.hasTeamInfo ? 55 : 30),
        previous_successes: hasQuestionnaire ? 
          [data.questionnaire.teamExperience || 'Track record da documentare con evidenze'] :
          (data.hasTeamInfo ? ['Successi precedenti accennati'] : ['Track record da dimostrare con evidenze'])
      },
      advisors_board: {
        score: hasQuestionnaire ? 
          (data.questionnaire.teamAdvisors ? 75 : 35) :
          (data.hasTeamInfo ? 50 : 25),
        advisory_strength: hasQuestionnaire ? 
          (data.questionnaire.teamAdvisors ? 
           `Advisory board presente: ${data.questionnaire.teamAdvisors}` : 
           'Advisory board assente, necessario per credibilità') :
          (data.hasTeamInfo ? 'Advisory board da sviluppare con expertise settoriale' : 'Advisory board non presente, necessario per credibilità')
      },
      summary: hasQuestionnaire ? 
        `Team: ${data.questionnaire.teamSize} - Esperienza: ${data.questionnaire.teamExperience ? 'Documentata' : 'Mancante'} - Advisory: ${data.questionnaire.teamAdvisors ? 'Presente' : 'Assente'}` :
        `Team: ${data.hasTeamInfo ? 'Identificato' : 'Da definire'} - Esperienza: ${data.hasTeamInfo ? 'Presente' : 'Mancante'} - Advisory: ${data.hasTeamInfo ? 'Da sviluppare' : 'Assente'}`
    }
  }
  
  private assessTeamCompleteness(teamSize: string, teamExperience: string): number {
    if (!teamSize) return 30
    
    switch (teamSize) {
      case 'Solo io': return teamExperience ? 45 : 30
      case '2 persone': return teamExperience ? 65 : 50
      case '3-4 persone': return teamExperience ? 80 : 65
      case '5+ persone': return teamExperience ? 90 : 75
      default: return 40
    }
  }
  
  private identifyMissingRoles(teamSize: string): string[] {
    if (!teamSize) return ['Team completo da definire']
    
    switch (teamSize) {
      case 'Solo io': 
        return ['Co-founder tecnico', 'Head of Sales', 'Marketing Manager', 'Advisory Board']
      case '2 persone': 
        return ['Head of Sales', 'Marketing Specialist', 'Advisory Board']
      case '3-4 persone': 
        return ['Sales Manager', 'Advisory Board settoriale']
      case '5+ persone': 
        return ['Advisory Board settoriale', 'Board of Directors']
      default: 
        return ['Composizione team da definire']
    }
  }
  
  private performProductAnalysis(data: any): any {
    const hasQuestionnaire = !!data.questionnaire
    
    return {
      product_market_fit: {
        score: hasQuestionnaire ? 
          (data.questionnaire.customerFeedback && data.questionnaire.marketValidation ? 85 :
           data.questionnaire.marketValidation ? 70 :
           data.questionnaire.productStage === 'MVP' ? 60 : 40) :
          (data.hasProductInfo ? (data.hasMarketAnalysis ? 65 : 45) : 30),
        evidence: hasQuestionnaire ? 
          [data.questionnaire.customerFeedback || 'Feedback clienti da raccogliere',
           data.questionnaire.marketValidation || 'Validazione mercato da effettuare'] :
          (data.hasProductInfo ? ['Prodotto descritto con caratteristiche'] : ['Evidenze product-market fit completamente mancanti'])
      },
      development_stage: {
        stage: hasQuestionnaire ? 
          data.questionnaire.productStage :
          (data.hasProductInfo ? (data.hasTechnology ? 'Prototype' : 'Concept') : 'Idea'),
        score: hasQuestionnaire ? 
          this.getProductStageScore(data.questionnaire.productStage) :
          (data.hasProductInfo ? (data.hasTechnology ? 60 : 40) : 20),
        reasoning: hasQuestionnaire ? 
          `Stadio ${data.questionnaire.productStage}. Valore unico: ${data.questionnaire.uniqueValue ? 'Definito' : 'Da chiarire'}` :
          (data.hasProductInfo ? 'Stadio di sviluppo identificato, necessaria roadmap dettagliata' : 'Stadio di sviluppo da definire con timeline e milestone')
      },
      ip_protection: {
        score: hasQuestionnaire ? 
          (data.questionnaire.productStage === 'Prodotto completo' ? 70 :
           data.questionnaire.uniqueValue ? 60 : 40) :
          (data.hasTechnology ? 50 : 25),
        protections: hasQuestionnaire ? 
          [`Valore unico: ${data.questionnaire.uniqueValue || 'Da definire'}`, 'Strategia IP da sviluppare'] :
          (data.hasTechnology ? ['Proprietà intellettuale da proteggere'] : ['Strategia IP completamente mancante'])
      },
      scalability: {
        technical: hasQuestionnaire ? 
          this.getProductStageScore(data.questionnaire.productStage) :
          (data.hasTechnology ? 65 : 40),
        business: hasQuestionnaire ? 
          this.assessBusinessModelScalability(data.questionnaire.businessModel) :
          (data.hasBusinessModel ? 70 : 45),
        reasoning: hasQuestionnaire ? 
          `Scalabilità basata su stadio ${data.questionnaire.productStage} e modello ${data.questionnaire.businessModel}` :
          (data.hasTechnology ? 'Scalabilità tecnica identificata, necessaria validazione architetturale' : 'Scalabilità tecnica e business da valutare approfonditamente')
      },
      user_traction: {
        score: hasQuestionnaire ? 
          (data.questionnaire.customerFeedback ? 75 :
           data.questionnaire.productStage === 'MVP' ? 55 : 30) :
          (data.hasProductInfo ? 45 : 25),
        metrics: hasQuestionnaire ? 
          [data.questionnaire.customerFeedback || 'Trazione utenti da misurare con KPI'] :
          (data.hasProductInfo ? ['Trazione utenti da misurare con KPI'] : ['Trazione utenti completamente mancante'])
      },
      summary: hasQuestionnaire ? 
        `Stadio: ${data.questionnaire.productStage} - PMF: ${data.questionnaire.customerFeedback ? 'Validato' : 'Da validare'} - Scalabilità: ${data.questionnaire.uniqueValue ? 'Identificata' : 'Da definire'}` :
        `Stadio: ${data.hasProductInfo ? (data.hasTechnology ? 'Prototype' : 'Concept') : 'Idea'} - PMF: ${data.hasProductInfo ? 'Parziale' : 'Mancante'} - Scalabilità: ${data.hasTechnology ? 'Identificata' : 'Da valutare'}`
    }
  }
  
  private getProductStageScore(stage: string): number {
    if (!stage) return 20
    
    switch (stage) {
      case 'Idea/Concept': return 25
      case 'Prototipo': return 50
      case 'MVP': return 75
      case 'Prodotto funzionante': return 90
      case 'Prodotto completo': return 95
      default: return 30
    }
  }
  
  private assessInvestmentReadiness(data: any): any {
    const hasQuestionnaire = !!data.questionnaire
    
    return {
      pitch_deck_quality: {
        score: hasQuestionnaire ? 80 : (data.contentLength > 5000 ? 65 : 40),
        missing_elements: hasQuestionnaire ? 
          this.identifyMissingPitchElements(data.questionnaire) :
          ['Executive Summary coinvolgente', 'Market Size quantificato', 'Financial Projections realistiche', 'Team completo']
      },
      business_plan_completeness: {
        score: hasQuestionnaire ? 85 : (data.wordCount > 3000 ? 70 : 45),
        missing_sections: hasQuestionnaire ? 
          this.identifyMissingBusinessPlanSections(data.questionnaire) :
          ['Market Analysis dettagliata', 'Competitive Analysis strutturata', 'Financial Model completo', 'Risk Analysis approfondita']
      },
      financial_model_quality: {
        score: hasQuestionnaire ? 
          (data.questionnaire.revenueProjections && data.questionnaire.businessModel ? 80 : 55) :
          (data.hasFinancialProjections ? 60 : 30),
        improvements_needed: hasQuestionnaire ? 
          this.identifyFinancialModelImprovements(data.questionnaire) :
          ['Unit Economics validation', 'Cash Flow dettagliato', 'Scenario Analysis multiple', 'Sensitivity Analysis']
      },
      legal_structure: {
        score: 50,
        issues: ['Corporate Structure ottimizzata', 'IP Protection strategy', 'Regulatory Compliance', 'Shareholder Agreement']
      },
      due_diligence_readiness: {
        score: hasQuestionnaire ? 60 : 45,
        missing_documents: hasQuestionnaire ? 
          ['Financial Statements auditati', 'Legal Documents completi', 'Customer Contracts', 'Employment Agreements'] :
          ['Financial Statements auditati', 'Legal Documents completi', 'IP Portfolio documentato', 'Customer Contracts', 'Employment Agreements']
      },
      summary: hasQuestionnaire ? 
        `Investment Readiness: Buona - Due Diligence: ${data.questionnaire.revenueProjections ? 'Preparazione avanzata' : 'Preparazione iniziale'}` :
        `Investment Readiness: ${data.contentLength > 5000 ? 'Parziale' : 'Bassa'} - Due Diligence: ${data.hasFinancialProjections ? 'Preparazione iniziale' : 'Non pronta'}`
    }
  }
  
  private identifyMissingPitchElements(questionnaire: any): string[] {
    const missing = []
    
    if (!questionnaire.marketSize) {
      missing.push('Market Size quantificato con TAM/SAM/SOM')
    }
    if (!questionnaire.revenueProjections) {
      missing.push('Financial Projections dettagliate')
    }
    if (!questionnaire.teamAdvisors) {
      missing.push('Advisory Board qualificato')
    }
    if (!questionnaire.customerFeedback) {
      missing.push('Customer Validation con feedback')
    }
    if (!questionnaire.competitiveAdvantage) {
      missing.push('Competitive Advantage sostenibile')
    }
    
    return missing.length > 0 ? missing : ['Pitch deck foundation completa']
  }
  
  private identifyMissingBusinessPlanSections(questionnaire: any): string[] {
    const missing = []
    
    if (!questionnaire.marketSize) {
      missing.push('Market Analysis con dimensioni quantificate')
    }
    if (!questionnaire.competitors || !questionnaire.competitiveAdvantage) {
      missing.push('Competitive Analysis strutturata')
    }
    if (!questionnaire.revenueProjections) {
      missing.push('Financial Model con proiezioni dettagliate')
    }
    if (!questionnaire.teamAdvisors) {
      missing.push('Team Section con advisory board')
    }
    
    return missing.length > 0 ? missing : ['Business plan foundation solida']
  }
  
  private identifyFinancialModelImprovements(questionnaire: any): string[] {
    const improvements = []
    
    if (!questionnaire.currentRevenue) {
      improvements.push('Unit Economics validation con dati reali')
    }
    if (!questionnaire.revenueProjections) {
      improvements.push('Cash Flow projections dettagliate')
    }
    if (questionnaire.businessModel === 'Altro') {
      improvements.push('Revenue Model chiaramente definito')
    }
    
    improvements.push('Scenario Analysis (best/worst/realistic case)')
    improvements.push('Sensitivity Analysis per variabili chiave')
    
    return improvements
  }
  
  private calculateOverallScore(scores: any): number {
    const weights = {
      market: 0.25,
      team: 0.20,
      product: 0.20,
      financial: 0.15,
      berkus: 0.10,
      scorecard: 0.10
    }
    
    const normalizedScores = {
      market: Math.min(scores.market, 100),
      team: Math.min(scores.team, 100),
      product: Math.min(scores.product, 100),
      financial: Math.min(scores.financial, 100),
      berkus: Math.min((scores.berkus / 500000) * 100, 100),
      scorecard: Math.min(scores.scorecard, 100)
    }
    
    return Math.round(
      normalizedScores.market * weights.market +
      normalizedScores.team * weights.team +
      normalizedScores.product * weights.product +
      normalizedScores.financial * weights.financial +
      normalizedScores.berkus * weights.berkus +
      normalizedScores.scorecard * weights.scorecard
    )
  }
  
  private calculateValuationRange(berkus: any, scorecard: any, risk: any) {
    const baseValuation = (berkus.total_valuation + (scorecard.weighted_score * 10000)) / 2
    const riskAdjustment = 1 + (risk.total_risk_adjustment / 100)
    
    return {
      min: Math.round(baseValuation * 0.7 * riskAdjustment),
      max: Math.round(baseValuation * 1.3 * riskAdjustment),
      recommended: Math.round(baseValuation * riskAdjustment)
    }
  }
  
  private generateRecommendations(data: any, overallScore: number): string[] {
    const recommendations = []
    const hasQuestionnaire = !!data.questionnaire
    
    if (hasQuestionnaire) {
      if (!data.questionnaire.marketSize) {
        recommendations.push('Quantificare dimensioni mercato con ricerca TAM/SAM/SOM dettagliata')
      }
      if (!data.questionnaire.competitors || !data.questionnaire.competitiveAdvantage) {
        recommendations.push('Sviluppare analisi competitiva strutturata con mappatura competitor e positioning')
      }
      if (!data.questionnaire.revenueProjections) {
        recommendations.push('Creare modello finanziario con proiezioni 3-5 anni e unit economics')
      }
      if (!data.questionnaire.teamAdvisors) {
        recommendations.push('Sviluppare advisory board con expertise settoriale e investitori')
      }
      if (!data.questionnaire.customerFeedback) {
        recommendations.push('Raccogliere feedback clienti sistematico per validare product-market fit')
      }
      if (data.questionnaire.teamSize === 'Solo io') {
        recommendations.push('Completare team con co-founder complementari e competenze tecniche/commerciali')
      }
      if (data.questionnaire.productStage === 'Idea/Concept') {
        recommendations.push('Sviluppare MVP funzionale per validazione mercato')
      }
    } else {
      if (!data.hasMarketAnalysis) {
        recommendations.push('Condurre ricerca di mercato dettagliata con quantificazione TAM/SAM/SOM e validazione customer')
      }
      if (!data.hasCompetitiveAnalysis) {
        recommendations.push('Sviluppare analisi competitiva strutturata con mappatura competitor e positioning')
      }
      if (!data.hasFinancialProjections) {
        recommendations.push('Creare modello finanziario con proiezioni 3-5 anni, unit economics e scenario analysis')
      }
      if (!data.hasTeamInfo) {
        recommendations.push('Completare team con competenze complementari e sviluppare advisory board settoriale')
      }
      if (!data.hasBusinessModel) {
        recommendations.push('Definire chiaramente modello di business, revenue streams e strategia monetizzazione')
      }
    }
    
    if (overallScore < 60) {
      recommendations.push('Sviluppare MVP funzionale e validare product-market fit con clienti target')
    }
    
    recommendations.push('Preparare pitch deck investor-ready con storytelling compelling e demo prodotto')
    recommendations.push('Implementare sistema di metriche KPI per monitoraggio performance e crescita')
    
    return recommendations
  }
  
  private identifyMissingAreas(data: any): string[] {
    const missing = []
    const hasQuestionnaire = !!data.questionnaire
    
    if (hasQuestionnaire) {
      if (!data.questionnaire.marketSize) missing.push('Analisi di mercato quantitativa con TAM/SAM/SOM')
      if (!data.questionnaire.competitors || !data.questionnaire.competitiveAdvantage) missing.push('Analisi competitiva strutturata con positioning')
      if (!data.questionnaire.revenueProjections) missing.push('Proiezioni finanziarie dettagliate con unit economics')
      if (!data.questionnaire.teamAdvisors) missing.push('Advisory board qualificato con expertise settoriale')
      if (!data.questionnaire.customerFeedback) missing.push('Validazione cliente con feedback sistematico')
      if (data.questionnaire.productStage === 'Idea/Concept') missing.push('Sviluppo MVP per validazione mercato')
      if (data.questionnaire.teamSize === 'Solo io') missing.push('Espansione team con competenze complementari')
    } else {
      if (!data.hasMarketAnalysis) missing.push('Analisi di mercato quantitativa con TAM/SAM/SOM')
      if (!data.hasCompetitiveAnalysis) missing.push('Analisi competitiva strutturata con positioning')
      if (!data.hasFinancialProjections) missing.push('Proiezioni finanziarie dettagliate con unit economics')
      if (!data.hasTeamInfo) missing.push('Informazioni complete sul team e advisory board')
      if (!data.hasBusinessModel) missing.push('Modello di business definito con revenue streams')
      if (!data.hasTechnology) missing.push('Specifiche tecniche dettagliate e architettura')
      if (!data.hasProductInfo) missing.push('Descrizione prodotto/servizio completa con roadmap')
      if (!data.hasInvestmentInfo) missing.push('Piano di investimento e utilizzo fondi con milestone')
    }
    
    return missing
  }
  
  private generateNextSteps(overallScore: number, investmentReadiness: any): any {
    const immediateActions = []
    
    if (overallScore < 50) {
      immediateActions.push({
        action: 'Completare business plan con tutte le sezioni critiche mancanti',
        priority: 'high',
        timeline: '2-4 settimane'
      })
    }
    
    if (investmentReadiness.pitch_deck_quality.score < 70) {
      immediateActions.push({
        action: 'Creare pitch deck professionale con storytelling e demo',
        priority: 'high',
        timeline: '1-2 settimane'
      })
    }
    
    immediateActions.push({
      action: 'Validare product-market fit con clienti target e raccogliere feedback',
      priority: 'medium',
      timeline: '4-6 settimane'
    })
    
    return {
      immediate_actions: immediateActions,
      pitch_preparation: {
        tasks: ['Sviluppare storytelling compelling', 'Preparare demo prodotto funzionale', 'Praticare presentazione con timing'],
        timeline: '2-3 settimane'
      },
      business_plan_completion: {
        tasks: ['Completare ricerca mercato con dati', 'Finalizzare proiezioni finanziarie', 'Definire go-to-market strategy'],
        timeline: '4-6 settimane'
      },
      investment_readiness: {
        tasks: ['Preparare due diligence materials', 'Strutturare round di finanziamento', 'Identificare e contattare investitori target'],
        timeline: '6-8 settimane'
      }
    }
  }

  private generateExecutiveSummary(data: any, overallScore: number, valuationRange: any): string {
    const hasQuestionnaire = !!data.questionnaire
    const projectType = this.identifyProjectType(data, hasQuestionnaire)
    const keyStrengths = this.identifyKeyStrengths(data, overallScore, hasQuestionnaire)
    const criticalWeaknesses = this.identifyCriticalWeaknesses(data, overallScore, hasQuestionnaire)
    const marketPotential = this.assessMarketPotential(data, hasQuestionnaire)
    
    let summary = `## Executive Summary - Analisi Professionale\n\n`
    
    // Apertura e contesto
    summary += `Il progetto analizzato rappresenta ${projectType} con un potenziale ${this.getMarketPotentialText(marketPotential)} nel settore di riferimento. `
    summary += `Attraverso un'analisi approfondita utilizzando metodologie VC professionali (Berkus Method, Scorecard Analysis, Risk Factor Assessment), `
    summary += `la startup ha conseguito un punteggio complessivo di ${overallScore}/100, posizionandosi nella categoria ${this.getScoreCategory(overallScore)}.\n\n`
    
    // Valutazione economica
    summary += `### Valutazione Economica\n`
    summary += `L'analisi di valutazione indica un range di ${this.formatCurrency(valuationRange.min)} - ${this.formatCurrency(valuationRange.max)}, `
    summary += `con una valutazione raccomandata di ${this.formatCurrency(valuationRange.recommended)}. `
    summary += `Questa stima si basa su una combinazione di fattori qualitativi e quantitativi, includendo il potenziale di mercato, `
    summary += `la forza del team, l'innovazione del prodotto e la sostenibilità del modello di business.\n\n`
    
    // Punti di forza
    summary += `### Punti di Forza Identificati\n`
    keyStrengths.forEach(strength => {
      summary += `• ${strength}\n`
    })
    summary += `\n`
    
    // Aree di miglioramento
    summary += `### Aree Critiche di Miglioramento\n`
    criticalWeaknesses.forEach(weakness => {
      summary += `• ${weakness}\n`
    })
    summary += `\n`
    
    // Analisi di mercato
    summary += `### Contesto di Mercato\n`
    summary += `L'analisi di mercato rivela ${this.getMarketAnalysisText(data, hasQuestionnaire)}. `
    summary += `Il posizionamento competitivo ${this.getCompetitivePositionText(data, hasQuestionnaire)}, `
    summary += `mentre le barriere all'ingresso ${this.getBarriersText(data, hasQuestionnaire)}. `
    summary += `La validazione del product-market fit ${this.getPMFText(data, hasQuestionnaire)}.\n\n`
    
    // Rischi principali
    summary += `### Profilo di Rischio\n`
    summary += `I principali fattori di rischio identificati includono ${this.getRiskAnalysisText(data, hasQuestionnaire)}. `
    summary += `Tuttavia, questi rischi sono ${this.getRiskMitigationText(data, hasQuestionnaire)} attraverso strategie mirate `
    summary += `e un'esecuzione accurata del piano di sviluppo.\n\n`
    
    // Raccomandazioni strategiche
    summary += `### Raccomandazioni Strategiche\n`
    summary += `Per massimizzare il potenziale di successo, si raccomanda di: `
    summary += `${this.getStrategicRecommendationsText(data, overallScore, hasQuestionnaire)}. `
    summary += `Particolare attenzione dovrebbe essere rivolta ${this.getFocusAreasText(data, overallScore, hasQuestionnaire)}.\n\n`
    
    // Conclusioni
    summary += `### Conclusioni\n`
    summary += `${this.getConclusionText(overallScore, data, hasQuestionnaire)} `
    summary += `Con gli opportuni miglioramenti nelle aree identificate, il progetto presenta ${this.getOverallPotentialText(overallScore)} `
    summary += `per attrarre investimenti e raggiungere una crescita sostenibile nel mercato di riferimento.`
    
    return summary
  }
  
  private identifyProjectType(data: any, hasQuestionnaire: boolean): string {
    if (hasQuestionnaire) {
      if (data.questionnaire.productStage === 'Prodotto completo') {
        return "una startup tecnologica matura"
      } else if (data.questionnaire.productStage === 'MVP') {
        return "una startup in fase di validazione"
      } else if (data.questionnaire.productStage === 'Prototipo') {
        return "una startup in fase di sviluppo"
      } else {
        return "un'iniziativa imprenditoriale in fase iniziale"
      }
    } else {
      if (data.hasTechnology && data.hasProductInfo) {
        return "una startup tecnologica innovativa"
      } else if (data.hasBusinessModel && data.hasMarketAnalysis) {
        return "un'iniziativa imprenditoriale strutturata"
      } else if (data.hasProductInfo) {
        return "un progetto di prodotto/servizio"
      } else {
        return "un'idea imprenditoriale in fase di definizione"
      }
    }
  }
  
  private getMarketPotentialText(potential: number): string {
    if (potential > 80) return "straordinario"
    if (potential > 60) return "significativo" 
    if (potential > 40) return "interessante"
    return "da validare"
  }
  
  private getScoreCategory(score: number): string {
    if (score >= 80) return "eccellente con prospettive di investimento immediate"
    if (score >= 70) return "molto promettente con solide fondamenta"
    if (score >= 60) return "promettente con aree di miglioramento identificate"
    if (score >= 50) return "intermedia con necessità di sviluppi significativi"
    return "iniziale richiedente approfondimenti sostanziali"
  }
  
  private identifyKeyStrengths(data: any, score: number, hasQuestionnaire: boolean): string[] {
    const strengths = []
    
    if (hasQuestionnaire) {
      if (data.questionnaire.marketValidation) {
        strengths.push("Validazione di mercato effettuata con evidenze concrete di domanda")
      }
      if (data.questionnaire.productStage === 'MVP' || data.questionnaire.productStage === 'Prodotto completo') {
        strengths.push("Prodotto sviluppato con potenziale di validazione product-market fit")
      }
      if (data.questionnaire.teamSize !== 'Solo io' && data.questionnaire.teamExperience) {
        strengths.push("Team strutturato con esperienza documentata nel settore")
      }
      if (data.questionnaire.competitors && data.questionnaire.competitiveAdvantage) {
        strengths.push("Analisi competitiva consapevole con vantaggio differenziante identificato")
      }
      if (data.questionnaire.revenueProjections) {
        strengths.push("Modello finanziario con proiezioni strutturate per la crescita")
      }
      if (data.questionnaire.customerFeedback) {
        strengths.push("Feedback clienti raccolto per validazione e miglioramento continuo")
      }
    } else {
      if (data.hasMarketAnalysis) {
        strengths.push("Comprensione solida del mercato di riferimento con identificazione chiara del target")
      }
      if (data.hasTechnology) {
        strengths.push("Componente tecnologica innovativa con potenziale di differenziazione competitiva")
      }
      if (data.hasBusinessModel) {
        strengths.push("Modello di business delineato con fonti di ricavo identificate")
      }
      if (data.hasTeamInfo) {
        strengths.push("Presenza di un team con competenze rilevanti per l'esecuzione del progetto")
      }
      if (data.hasCompetitiveAnalysis) {
        strengths.push("Analisi competitiva che dimostra consapevolezza del panorama concorrenziale")
      }
    }
    
    if (score > 70) {
      strengths.push("Punteggio complessivo elevato che indica una preparazione avanzata per il mercato")
    }
    
    if (data.contentLength > 5000 || hasQuestionnaire) {
      strengths.push("Documentazione completa che evidenzia un approccio strutturato alla pianificazione")
    }
    
    return strengths.length > 0 ? strengths : ["Fondamenta del progetto con potenziale di sviluppo"]
  }
  
  private identifyCriticalWeaknesses(data: any, score: number, hasQuestionnaire: boolean): string[] {
    const weaknesses = []
    
    if (hasQuestionnaire) {
      if (!data.questionnaire.marketSize) {
        weaknesses.push("Dimensioni di mercato non quantificate con analisi TAM/SAM/SOM dettagliata")
      }
      if (!data.questionnaire.competitors || !data.questionnaire.competitiveAdvantage) {
        weaknesses.push("Analisi competitiva insufficiente per definire positioning strategico sostenibile")
      }
      if (!data.questionnaire.revenueProjections) {
        weaknesses.push("Proiezioni finanziarie mancanti per validare sostenibilità economica")
      }
      if (!data.questionnaire.teamAdvisors) {
        weaknesses.push("Advisory board assente, necessario per credibilità e supporto strategico")
      }
      if (!data.questionnaire.customerFeedback) {
        weaknesses.push("Feedback clienti non raccolto per validazione product-market fit")
      }
      if (data.questionnaire.teamSize === 'Solo io') {
        weaknesses.push("Team founder singolo con necessità di espansione per competenze complementari")
      }
    } else {
      if (!data.hasMarketAnalysis) {
        weaknesses.push("Mancanza di ricerca di mercato quantitativa per validare le dimensioni del TAM/SAM/SOM")
      }
      if (!data.hasCompetitiveAnalysis) {
        weaknesses.push("Analisi competitiva insufficiente per identificare positioning e vantaggio competitivo sostenibile")
      }
      if (!data.hasFinancialProjections) {
        weaknesses.push("Assenza di proiezioni finanziarie dettagliate e modello di unit economics validato")
      }
      if (!data.hasTeamInfo) {
        weaknesses.push("Informazioni limitate sul team e assenza di advisory board qualificato")
      }
      if (!data.hasBusinessModel) {
        weaknesses.push("Modello di business e strategia di monetizzazione non sufficientemente sviluppati")
      }
    }
    
    if (score < 60) {
      weaknesses.push("Punteggio complessivo che indica necessità di sviluppi significativi prima dell'investment readiness")
    }
    
    return weaknesses.length > 0 ? weaknesses : ["Necessità di approfondimenti per ottimizzare il potenziale del progetto"]
  }
  
  private assessMarketPotential(data: any, hasQuestionnaire: boolean): number {
    let potential = 50 // Base
    
    if (hasQuestionnaire) {
      if (data.questionnaire.marketValidation) potential += 25
      if (data.questionnaire.marketSize) potential += 15
      if (data.questionnaire.targetMarket) potential += 10
    } else {
      if (data.hasMarketAnalysis) potential += 20
      if (data.hasCompetitiveAnalysis) potential += 15
      if (data.contentLength > 3000) potential += 10
      if (data.sections.length > 8) potential += 5
    }
    
    return Math.min(potential, 100)
  }
  
  private getMarketAnalysisText(data: any, hasQuestionnaire: boolean): string {
    if (hasQuestionnaire) {
      if (data.questionnaire.marketValidation && data.questionnaire.marketSize) {
        return "un mercato validato con dimensioni quantificate e opportunità concrete verificate"
      } else if (data.questionnaire.marketValidation) {
        return "un mercato con validazione iniziale effettuata, necessaria quantificazione dimensioni"
      } else {
        return "la necessità di validazione mercato attraverso ricerca strutturata e customer discovery"
      }
    } else {
      if (data.hasMarketAnalysis) {
        return "un mercato con caratteristiche attrattive e dimensioni significative, benché necessiti di quantificazione più precisa"
      }
      return "la necessità di approfondire la ricerca di mercato per validare le opportunità commerciali"
    }
  }
  
  private getCompetitivePositionText(data: any, hasQuestionnaire: boolean): string {
    if (hasQuestionnaire) {
      if (data.questionnaire.competitors && data.questionnaire.competitiveAdvantage) {
        return "mostra differenziazione chiara con vantaggio competitivo identificato e difendibile"
      } else {
        return "necessita di definizione attraverso analisi strutturata dei competitor e positioning"
      }
    } else {
      if (data.hasCompetitiveAnalysis) {
        return "mostra potenziale di differenziazione, richiedendo tuttavia consolidamento del vantaggio competitivo"
      }
      return "necessita di definizione attraverso un'analisi strutturata dei competitor diretti e indiretti"
    }
  }
  
  private getBarriersText(data: any, hasQuestionnaire: boolean): string {
    if (hasQuestionnaire) {
      if (data.questionnaire.productStage === 'Prodotto completo' || data.questionnaire.uniqueValue) {
        return "presentano opportunità di protezione attraverso know-how sviluppato e valore unico"
      } else {
        return "richiedono sviluppo strategico per creare difendibilità sostenibile nel tempo"
      }
    } else {
      if (data.hasTechnology) {
        return "presentano opportunità di protezione attraverso know-how tecnologico e proprietà intellettuale"
      }
      return "richiedono sviluppo strategico per creare difendibilità nel tempo"
    }
  }
  
  private getPMFText(data: any, hasQuestionnaire: boolean): string {
    if (hasQuestionnaire) {
      if (data.questionnaire.customerFeedback && data.questionnaire.marketValidation) {
        return "presenta evidenze concrete di fit con feedback positivi da clienti target"
      } else if (data.questionnaire.marketValidation) {
        return "mostra indicatori di validazione iniziale, necessario feedback sistematico da clienti"
      } else {
        return "rimane da dimostrare attraverso customer discovery e validazione empirica"
      }
    } else {
      if (data.hasProductInfo && data.hasMarketAnalysis) {
        return "presenta indicatori iniziali positivi che necessitano di validazione empirica con clienti target"
      }
      return "rimane da dimostrare attraverso ricerca di mercato e feedback degli utenti"
    }
  }
  
  private getRiskAnalysisText(data: any, hasQuestionnaire: boolean): string {
    const risks = []
    
    if (hasQuestionnaire) {
      if (data.questionnaire.teamSize === 'Solo io') risks.push("rischio esecutivo per composizione team limitata")
      if (!data.questionnaire.marketValidation) risks.push("rischio mercato per validazione domanda insufficiente")
      if (data.questionnaire.productStage === 'Idea/Concept') risks.push("rischio tecnologico per stadio sviluppo iniziale")
      if (!data.questionnaire.revenueProjections) risks.push("rischio finanziario per sostenibilità economica non dimostrata")
    } else {
      if (!data.hasTeamInfo) risks.push("rischio di esecuzione legato alla composizione del team")
      if (!data.hasMarketAnalysis) risks.push("rischio di mercato per validazione insufficiente della domanda")
      if (!data.hasTechnology) risks.push("rischio tecnologico per specifiche implementative non definite")
      if (!data.hasFinancialProjections) risks.push("rischio finanziario per sostenibilità economica non dimostrata")
    }
    
    return risks.length > 0 ? risks.join(", ") : "fattori di rischio gestibili con appropriata pianificazione"
  }
  
  private getRiskMitigationText(data: any, hasQuestionnaire: boolean): string {
    if (hasQuestionnaire) {
      return "mitigabili attraverso l'implementazione delle raccomandazioni specifiche identificate"
    } else {
      if (data.contentLength > 5000) {
        return "mitigabili attraverso la strutturazione già dimostrata nel documento"
      }
      return "affrontabili con sviluppo strutturato delle aree mancanti"
    }
  }
  
  private getStrategicRecommendationsText(data: any, score: number, hasQuestionnaire: boolean): string {
    const priorities = []
    
    if (hasQuestionnaire) {
      if (!data.questionnaire.marketSize) priorities.push("quantificare le dimensioni di mercato con analisi TAM/SAM/SOM")
      if (!data.questionnaire.revenueProjections) priorities.push("sviluppare proiezioni finanziarie e unit economics")
      if (!data.questionnaire.teamAdvisors) priorities.push("costruire advisory board con expertise settoriale")
      if (!data.questionnaire.customerFeedback) priorities.push("raccogliere feedback sistematico dai clienti target")
    } else {
      if (!data.hasMarketAnalysis) priorities.push("completare la ricerca di mercato con analisi TAM/SAM/SOM")
      if (!data.hasFinancialProjections) priorities.push("sviluppare proiezioni finanziarie e unit economics")
      if (!data.hasTeamInfo) priorities.push("rafforzare il team con competenze complementari")
      if (score < 70) priorities.push("implementare un piano di validazione del product-market fit")
    }
    
    return priorities.join(", ")
  }
  
  private getFocusAreasText(data: any, score: number, hasQuestionnaire: boolean): string {
    if (hasQuestionnaire) {
      if (!data.questionnaire.marketValidation) {
        return "alla validazione empirica della domanda attraverso customer discovery strutturato"
      }
      if (!data.questionnaire.revenueProjections) {
        return "allo sviluppo di un modello finanziario robusto con scenario analysis"
      }
      if (data.questionnaire.teamSize === 'Solo io') {
        return "all'espansione del team con competenze tecniche e commerciali complementari"
      }
    } else {
      if (!data.hasMarketAnalysis) {
        return "alla validazione empirica della domanda di mercato attraverso interviste e sondaggi"
      }
      if (!data.hasFinancialProjections) {
        return "allo sviluppo di un modello finanziario robusto con scenario analysis"
      }
      if (score < 60) {
        return "al consolidamento delle fondamenta del business model"
      }
    }
    return "all'ottimizzazione degli elementi di forza già identificati"
  }
  
  private getConclusionText(score: number, data: any, hasQuestionnaire: boolean): string {
    if (score >= 80) {
      return "Il progetto dimostra una maturità eccellente e risulta pronto per approcci di investimento strutturati."
    }
    if (score >= 70) {
      return "Il progetto presenta solide fondamenta con prospettive molto promettenti per il successo commerciale."
    }
    if (score >= 60) {
      return "Il progetto mostra potenziale significativo, richiedendo sviluppi mirati nelle aree identificate."
    }
    if (score >= 50) {
      return "Il progetto ha merito imprenditoriale, necessitando di approfondimenti sostanziali prima dell'investment readiness."
    }
    return "Il progetto presenta spunti interessanti che richiedono sviluppo strutturato per raggiungere la maturità commerciale."
  }
  
  private getOverallPotentialText(score: number): string {
    if (score >= 80) return "eccellenti prospettive"
    if (score >= 70) return "ottime possibilità"
    if (score >= 60) return "buone opportunità"
    if (score >= 50) return "discrete possibilità"
    return "potenziale da sviluppare"
  }
  
  private formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `€${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `€${(amount / 1000).toFixed(0)}K`
    }
    return `€${amount.toLocaleString()}`
  }
}