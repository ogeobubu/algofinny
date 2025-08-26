import logger from "./logger.js"

let pdfParserAvailable = false

export function isPDFParserAvailable(): boolean {
  return pdfParserAvailable
}

export async function initializePDFParser(): Promise<boolean> {
  try {
    // Test both pdf-lib and pdf-parse
    const { PDFDocument } = await import("pdf-lib")
    const pdfParse = await import("pdf-parse")
    
    // Test pdf-lib with simple creation
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 400])
    page.drawText("Test PDF for initialization", {
      x: 50,
      y: 350,
      size: 12,
    })
    
    const pdfBytes = await pdfDoc.save()
    
    // Test pdf-parse with simple buffer
    const testBuffer = Buffer.from("%PDF-test")
    try {
      await pdfParse.default(testBuffer)
    } catch (e) {
      // Expected to fail, but we just want to check if module loads
    }
    
    pdfParserAvailable = pdfBytes.length > 0
    logger.info("PDF parser libraries loaded successfully")
    return pdfParserAvailable
    
  } catch (error) {
    logger.error("Error initializing PDF parser", { error: String(error) })
    return false
  }
}

export async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import("pdf-parse")
    const data = await pdfParse.default(buffer)
    return data.text
  } catch (error) {
    logger.error("Error parsing PDF buffer", { error: String(error) })
    throw new Error(`Failed to parse PDF: ${error}`)
  }
}