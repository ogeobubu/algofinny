// server/src/utils/pdfParser.ts - Fixed version
import logger from "./logger.js";
let pdfParserAvailable = false;
export function isPDFParserAvailable() {
    return pdfParserAvailable;
}
export function isPDFBuffer(buffer) {
    // Check PDF header (should start with %PDF-)
    return buffer.length > 4 && buffer.toString('ascii', 0, 4) === '%PDF';
}
export async function initializePDFParser() {
    try {
        // Try to import pdf-parse only (more reliable for text extraction)
        const pdfParse = await import("pdf-parse");
        // Test with a minimal PDF buffer to verify the library works
        const minimalPDF = Buffer.from([
            0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
            0x0a, 0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, // newline + "1 0 obj"
            0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, // <</Type/
            0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x3e, // Catalog>
            0x3e, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a // >endobj
        ]);
        try {
            await pdfParse.default(minimalPDF);
        }
        catch (e) {
            // This is expected to fail with minimal PDF, but we just want to test module loading
            logger.info("PDF parser module test completed (expected error is normal)");
        }
        pdfParserAvailable = true;
        logger.info("PDF parser initialized successfully");
        return true;
    }
    catch (error) {
        logger.warn("PDF parser not available", {
            error: error.message,
            suggestion: "Install pdf-parse: npm install pdf-parse @types/pdf-parse"
        });
        pdfParserAvailable = false;
        return false;
    }
}
export async function parsePDFBuffer(buffer) {
    if (!pdfParserAvailable) {
        throw new Error("PDF parser not available. Please install pdf-parse library.");
    }
    if (!isPDFBuffer(buffer)) {
        throw new Error("Invalid PDF file - file does not have PDF header");
    }
    try {
        const pdfParse = await import("pdf-parse");
        // Enhanced parsing options for better text extraction
        const options = {
            max: 0, // Parse all pages
            normalizeWhitespace: true,
            disableCombineTextItems: false
        };
        logger.info("Starting PDF parsing", { bufferSize: buffer.length });
        const data = await pdfParse.default(buffer, options);
        if (!data.text || data.text.trim().length === 0) {
            throw new Error("No text content extracted from PDF");
        }
        logger.info("PDF parsed successfully", {
            pages: data.numpages,
            textLength: data.text.length,
            info: data.info
        });
        return data.text;
    }
    catch (error) {
        logger.error("Error parsing PDF buffer", {
            error: error.message,
            bufferSize: buffer.length,
            isPDF: isPDFBuffer(buffer)
        });
        if (error.message.includes('Invalid PDF')) {
            throw new Error("Invalid or corrupted PDF file");
        }
        if (error.message.includes('encrypted')) {
            throw new Error("Encrypted PDF files are not supported. Please provide an unencrypted statement.");
        }
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}
//# sourceMappingURL=pdfParser.js.map