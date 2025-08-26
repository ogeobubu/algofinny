import logger from "./logger.js"

let pdfParserAvailable = false
let pdfParse: any = null
let PDFDocument: any = null

export function isPDFParserAvailable(): boolean {
  return pdfParserAvailable
}

export async function initializePDFParser(): Promise<boolean> {
  try {
    // Try to import pdf-lib
    try {
      const pdfLib = await import("pdf-lib")
      PDFDocument = pdfLib.PDFDocument
      logger.info("pdf-lib loaded successfully")
    } catch (pdfLibError) {
      logger.warn("pdf-lib not available", { error: String(pdfLibError) })
    }

    // Try to import pdf-parse
    try {
      pdfParse = (await import("pdf-parse")).default
      logger.info("pdf-parse loaded successfully")
    } catch (pdfParseError) {
      logger.warn("pdf-parse not available", { error: String(pdfParseError) })
    }

    // Check if at least one PDF library is available
    pdfParserAvailable = !!PDFDocument || !!pdfParse
    
    if (pdfParserAvailable) {
      logger.info("PDF parser initialized successfully")
    } else {
      logger.warn("No PDF parsing libraries available")
    }
    
    return pdfParserAvailable
    
  } catch (error) {
    logger.error("Error initializing PDF parser", { error: String(error) })
    pdfParserAvailable = false
    return false
  }
}

export async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  try {
    if (pdfParse) {
      // Use pdf-parse for text extraction
      const data = await pdfParse(buffer)
      return data.text
    } else if (PDFDocument) {
      // Fallback: Try to use pdf-lib (though it's not ideal for text extraction)
      const pdfDoc = await PDFDocument.load(buffer)
      let textContent = ""
      
      // This is a very basic text extraction that won't work for most PDFs
      // but it's better than nothing
      const pages = pdfDoc.getPages()
      for (let i = 0; i < pages.length; i++) {
        textContent += `Page ${i + 1}: [Text extraction limited with current library]\n`
      }
      
      return textContent
    } else {
      throw new Error("No PDF parsing libraries available")
    }
  } catch (error) {
    logger.error("Error parsing PDF buffer", { error: String(error) })
    throw new Error(`Failed to parse PDF: ${error}`)
  }
}

// Simple function to check if buffer is a PDF
export function isPDFBuffer(buffer: Buffer): boolean {
  // Check PDF magic number
  return buffer.length > 4 && 
         buffer[0] === 0x25 && // %
         buffer[1] === 0x50 && // P
         buffer[2] === 0x44 && // D
         buffer[3] === 0x46 && // F
         buffer[4] === 0x2D     // -
}