import { NextRequest, NextResponse } from 'next/server'
import * as mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let extractedText = ''

    try {
      if (fileName.endsWith('.pdf')) {
        // Per ora, chiediamo di convertire PDF in testo o DOCX
        return NextResponse.json({ 
          error: 'Per file PDF, ti consigliamo di:\n1. Copiare il testo e incollarlo in un file .txt\n2. Convertire il PDF in formato .docx\n3. Usare il form manuale per inserire le informazioni' 
        }, { status: 400 })
        
      } else if (fileName.endsWith('.docx')) {
        // Estrai testo da DOCX
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
        
      } else if (fileName.endsWith('.doc')) {
        // Per i file .doc, proviamo con mammoth (supporto limitato)
        try {
          const result = await mammoth.extractRawText({ buffer })
          extractedText = result.value
        } catch (docError) {
          return NextResponse.json({ 
            error: 'Formato .doc non supportato completamente. Prova a salvare come .docx' 
          }, { status: 400 })
        }
        
      } else if (fileName.endsWith('.txt')) {
        // Estrai testo da file di testo
        extractedText = buffer.toString('utf-8')
        
      } else {
        return NextResponse.json({ 
          error: 'Formato file supportato: .DOCX, .TXT. Per PDF convertire in DOCX o copiare il testo.' 
        }, { status: 400 })
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json({ 
          error: 'Nessun testo trovato nel documento' 
        }, { status: 400 })
      }

      // Pulisci il testo estratto
      const cleanedText = extractedText
        .replace(/\s+/g, ' ') // Sostituisci spazi multipli con uno singolo
        .replace(/\n\s*\n/g, '\n') // Rimuovi righe vuote multiple
        .trim()

      return NextResponse.json({
        success: true,
        text: cleanedText,
        fileName: file.name,
        fileSize: file.size,
        textLength: cleanedText.length
      })

    } catch (extractionError) {
      console.error('Errore durante l\'estrazione:', extractionError)
      
      return NextResponse.json({ 
        error: 'Errore durante l\'estrazione del testo. Verifica che il file non sia corrotto.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Errore generale:', error)
    return NextResponse.json({ 
      error: 'Errore interno del server' 
    }, { status: 500 })
  }
}