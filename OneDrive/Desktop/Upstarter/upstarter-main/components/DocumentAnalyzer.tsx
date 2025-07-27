'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, AlertCircle, CheckCircle, BarChart3, Download, File } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface DocumentAnalyzerProps {
  onAnalysisComplete?: (analysis: any) => void
}

export default function DocumentAnalyzer({ onAnalysisComplete }: DocumentAnalyzerProps = {}) {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: session } = useSession()
  const router = useRouter()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFiles = (fileList: File[]) => {
    const validFiles = fileList.filter(file => {
      const isValidType = file.type === 'text/plain' ||
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         file.type === 'application/msword' ||
                         file.name.toLowerCase().endsWith('.doc') ||
                         file.name.toLowerCase().endsWith('.docx') ||
                         file.name.toLowerCase().endsWith('.txt')
      
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      return isValidType && isValidSize
    })

    if (validFiles.length !== fileList.length) {
      setError('Alcuni file non sono supportati. Usa DOC, DOCX o TXT (max 10MB). PDF supporto in arrivo!')
    } else {
      setError(null)
    }

    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop()
    switch (extension) {
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-600" />
      case 'txt':
        return <FileText className="w-5 h-5 text-gray-600" />
      default:
        return <File className="w-5 h-5 text-gray-600" />
    }
  }

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.toLowerCase().split('.').pop()
      
      if (fileExtension === 'txt') {
        // Handle plain text files
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve(e.target?.result as string)
        }
        reader.onerror = () => reject(new Error('Errore nella lettura del file TXT'))
        reader.readAsText(file)
      } else if (fileExtension === 'doc' || fileExtension === 'docx') {
        // Handle Word documents using mammoth.js
        setProcessingStatus('Elaborazione documento Word in corso...')
        
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            // Dynamically import mammoth.js
            const mammoth = await import('mammoth')
            
            const arrayBuffer = e.target?.result as ArrayBuffer
            const result = await mammoth.extractRawText({ arrayBuffer })
            
            if (result.value.trim().length === 0) {
              reject(new Error('Il documento Word sembra essere vuoto'))
            }
            
            resolve(result.value)
          } catch (error) {
            console.error('Word processing error:', error)
            reject(new Error('Errore nell\'elaborazione del documento Word'))
          }
        }
        reader.onerror = () => reject(new Error('Errore nella lettura del file Word'))
        reader.readAsArrayBuffer(file)
      } else {
        reject(new Error('Formato file non supportato'))
      }
    })
  }

  const analyzeDocument = async () => {
    if (files.length === 0) {
      setError('Seleziona almeno un documento')
      return
    }

    if (!session?.user?.email) {
      setError('Devi essere autenticato per analizzare documenti')
      return
    }

    setAnalyzing(true)
    setError(null)
    setProcessingStatus('Inizializzazione analisi...')

    try {
      const file = files[0] // Analizza il primo file
      console.log('📄 Analyzing file:', file.name, 'Type:', file.type)

      // Extract text from file based on type
      setProcessingStatus('Estrazione contenuto documento...')
      const fileContent = await extractTextFromFile(file)
      
      console.log('📄 Extracted content length:', fileContent.length)

      if (fileContent.length < 100) {
        throw new Error('Il documento contiene troppo poco testo per essere analizzato efficacemente')
      }

      setProcessingStatus('Avvio analisi AI professionale...')

      // Chiamata API per analisi professionale
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          text: fileContent,
          fileType: file.type || 'unknown'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'analisi del documento')
      }

      const result = await response.json()
      console.log('✅ Analysis result:', result)

      if (result.success) {
        setProcessingStatus('Salvataggio risultati...')
        
        // 🎯 FIX: Estrai l'ID pulito senza doppio prefisso
        const cleanAnalysisId = result.analysis.id.replace(/^analysis_/, '')
        const analysisStorageKey = `analysis_${cleanAnalysisId}`
        
        console.log('🔧 ID Fixing:', {
          originalId: result.analysis.id,
          cleanId: cleanAnalysisId,
          storageKey: analysisStorageKey
        })

        // IMPORTANTE: Salva TUTTI i dati inclusi professional_analysis
        const completeAnalysisData = {
          id: cleanAnalysisId, // ID pulito senza prefisso
          project_id: result.project.id,
          title: result.project.title,
          description: result.project.description,
          score: result.project.score,
          overall_score: result.analysis.overall_score,
          analysis_data: result.analysis.analysis_data,
          professional_analysis: result.professional_analysis, // 🎯 CHIAVE!
          missing_areas: result.analysis.missing_areas,
          completeness_score: result.analysis.completeness_score,
          extracted_info: result.extracted_info,
          valuation_summary: result.valuation_summary,
          saved_to_airtable: result.saved_to_airtable,
          created_at: result.analysis.created_at,
          updated_at: result.project.updated_at,
          source: 'document_professional',
          type: 'professional',
          file_info: {
            name: file.name,
            type: file.type,
            size: file.size,
            processed_at: new Date().toISOString()
          }
        }

        // 🎯 FIX: Usa chiave corretta per il salvataggio
        localStorage.setItem(analysisStorageKey, JSON.stringify(completeAnalysisData))
        
        // Salva anche nella lista progetti
        const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]')
        const newProject = {
          id: result.project.id,
          title: result.project.title,
          description: result.project.description,
          score: result.project.score,
          status: result.project.status,
          type: result.project.type,
          source: result.project.source,
          created_at: result.project.created_at,
          analysis_id: cleanAnalysisId, // 🎯 FIX: ID pulito
          file_info: {
            name: file.name,
            type: file.type
          }
        }
        
        const updatedProjects = [newProject, ...existingProjects]
        localStorage.setItem('projects', JSON.stringify(updatedProjects))

        console.log('💾 Data saved to localStorage:', {
          analysisKey: analysisStorageKey,
          projectAnalysisId: cleanAnalysisId,
          hasProfessionalAnalysis: !!completeAnalysisData.professional_analysis,
          overallScore: completeAnalysisData.overall_score,
          valuationRange: completeAnalysisData.professional_analysis?.valuation_range,
          fileType: file.type
        })

        setProcessingStatus('Analisi completata con successo!')
        setAnalysisResult(completeAnalysisData)

        // Chiama il callback se fornito
        if (onAnalysisComplete) {
          onAnalysisComplete(completeAnalysisData)
        }

        // 🎯 FIX: Redirect con ID pulito
        setTimeout(() => {
          router.push(`/dashboard/analysis/${cleanAnalysisId}`)
        }, 2000)

      } else {
        throw new Error(result.error || 'Analisi fallita')
      }

    } catch (error) {
      console.error('❌ Analysis error:', error)
      setError(error instanceof Error ? error.message : 'Errore sconosciuto durante l\'analisi')
      setProcessingStatus('')
    } finally {
      if (!analysisResult) {
        setAnalyzing(false)
        setProcessingStatus('')
      }
    }
  }

  if (analysisResult) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analisi Professionale Completata</h2>
            <p className="text-gray-600">Il tuo documento è stato analizzato con successo</p>
            {analysisResult.file_info && (
              <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-gray-500">
                {getFileIcon(analysisResult.file_info.name)}
                <span>{analysisResult.file_info.name}</span>
                <span>({(analysisResult.file_info.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {analysisResult.overall_score}/100
              </div>
              <div className="text-sm text-blue-700">Score Complessivo</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analysisResult.professional_analysis?.valuation_range?.recommended 
                  ? `€${(analysisResult.professional_analysis.valuation_range.recommended / 1000000).toFixed(1)}M`
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-green-700">Valutazione Raccomandata</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {analysisResult.valuation_summary?.confidence_level || 'Medium'}
              </div>
              <div className="text-sm text-purple-700">Livello di Confidenza</div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Punti Salienti</h3>
            
            {analysisResult.professional_analysis?.recommendations?.slice(0, 3).map((rec: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push(`/dashboard/analysis/${analysisResult.id}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Visualizza Analisi Completa
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Analisi Professionale Business Plan</h2>
        <p className="text-lg text-gray-600">
          Carica il tuo business plan per un'analisi dettagliata stile venture capital
        </p>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>DOC/DOCX</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span>TXT</span>
          </div>
          <div className="flex items-center space-x-2 text-orange-500">
            <File className="w-4 h-4" />
            <span>PDF (presto disponibile)</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Carica il tuo Business Plan
          </h3>
          <p className="text-gray-600 mb-4">
            Trascina i file qui o clicca per selezionare
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Seleziona File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".doc,.docx,.txt"
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-2">
            Supporta DOC, DOCX, TXT (max 10MB) - PDF in arrivo!
          </p>
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">File selezionati:</h4>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getFileIcon(file.name)}
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={analyzing}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={analyzeDocument}
          disabled={files.length === 0 || analyzing}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            files.length === 0 || analyzing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {analyzing ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Analizzando... Questo può richiedere alcuni minuti
            </div>
          ) : (
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Avvia Analisi Professionale
            </div>
          )}
        </button>
      </div>

      {analyzing && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <h4 className="font-semibold text-blue-900">Analisi in corso...</h4>
          </div>
          {processingStatus && (
            <div className="mb-4">
              <p className="text-sm text-blue-800 font-medium">{processingStatus}</p>
            </div>
          )}
          <div className="space-y-2 text-sm text-blue-800">
            <p>✅ Estrazione del contenuto dal documento</p>
            <p>🔍 Analisi di mercato e competitività</p>
            <p>💰 Valutazione con metodi VC professionali</p>
            <p>📊 Calcolo score e raccomandazioni</p>
            <p>💾 Salvataggio risultati...</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-3">Consigli per un'analisi ottimale:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Carica documenti con almeno 2-3 pagine di contenuto strutturato</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Includi sezioni su mercato, competitor, team, prodotto e finanze</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Supporto PDF disponibile nella prossima versione</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Massimo 10MB per file - documenti più grandi verranno elaborati più lentamente</span>
          </li>
        </ul>
      </div>
    </div>
  )
}