import { Buffer } from 'buffer'

let pdfParse: any = null

export const initializePDFParser = async (): Promise<boolean> => {
  try {
    // Dynamic import to avoid the test file issue at startup
    const pdfModule = await import('pdf-parse')
    pdfParse = pdfModule.default
    return true
  } catch (error) {
    console.warn('PDF parser not available:', error instanceof Error ? error.message : String(error))
    return false
  }
}

export const parsePDFBuffer = async (buffer: Buffer): Promise<string> => {
  if (!pdfParse) {
    const initialized = await initializePDFParser()
    if (!initialized) {
      throw new Error('PDF parsing is not available')
    }
  }
  
  try {
    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const isPDFParserAvailable = (): boolean => {
  return pdfParse !== null
}