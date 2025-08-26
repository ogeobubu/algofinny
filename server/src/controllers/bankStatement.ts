import { Request, Response } from "express"
import formidable, { File } from "formidable"
import fs from "fs/promises"
import path from "path"
import AccountInfo from "../models/AccountInfo.js"
import Transaction from "../models/Transaction.js"
import logger from "../utils/logger.js"
import { categorizeTransaction } from "../utils/categorizer.js"
import { parseStatementData } from "../utils/parser.js"
import { parsePDFBuffer, isPDFParserAvailable, initializePDFParser, isPDFBuffer } from "../utils/pdfParser.js"
import { parsePDFTextToStructuredData, ParsedStatement } from "../utils/pdfTextParser.js"

// Create uploads directory on startup
async function ensureUploadsDirectory() {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  try {
    await fs.access(uploadsDir)
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true })
    logger.info("Created uploads directory")
  }
}

// Initialize on startup
ensureUploadsDirectory().catch(error => {
  logger.error("Failed to create uploads directory", { error: String(error) })
})

export const handleFileUpload = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = (req as any).userId
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" })
    }

    // Parse the form with formidable
    const form = formidable({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      uploadDir: './uploads',
      keepExtensions: true,
      filename: (name, ext) => {
        return `statement_${Date.now()}_${userId}${ext}`
      }
    })

    // Parse the form
    form.parse(req, async (err, fields, files) => {
      if (err) {
        logger.error("Form parsing error:", { error: err.message, userId })
        return res.status(400).json({ error: "Failed to parse form data", details: err.message })
      }

      let filePath: string | null = null

      try {
        const file = files.statement?.[0] as File | undefined
        if (!file) {
          return res.status(400).json({ error: "No file uploaded" })
        }

        filePath = file.filepath
        if (!filePath) {
          return res.status(400).json({ error: "Uploaded file is missing path" })
        }

        const buffer = await fs.readFile(filePath)
        const originalFilename = file.originalFilename || 'unknown'

        logger.info("Processing bank statement", {
          userId,
          filename: originalFilename,
          size: file.size,
        })

        let parsedData: ParsedStatement

        // ---- Handle file formats ---- //
        if (originalFilename.toLowerCase().endsWith(".json")) {
          try {
            parsedData = JSON.parse(buffer.toString("utf8")) as ParsedStatement
            logger.info("JSON file parsed successfully", { userId, transactions: parsedData.transactions?.length })
          } catch (parseError) {
            return res.status(400).json({ error: "Invalid JSON file format" })
          }
        } else if (originalFilename.toLowerCase().endsWith(".csv")) {
          return res.status(400).json({ 
            error: "CSV parsing not yet implemented",
            suggestion: "Please upload a JSON or PDF file"
          })
        } else if (originalFilename.toLowerCase().endsWith(".pdf")) {
          // Check if this is actually a PDF file
          if (!isPDFBuffer(buffer)) {
            return res.status(400).json({ 
              error: "Invalid PDF file",
              details: "The uploaded file doesn't appear to be a valid PDF"
            })
          }

          // Initialize PDF parser if not already available
          if (!isPDFParserAvailable()) {
            logger.info("PDF parser not available, attempting initialization...", { userId })
            const available = await initializePDFParser()
            
            if (!available) {
              // Create a sample JSON template for the user
              const sampleTemplate = {
                accountInfo: {
                  account_name: "Your Account Name",
                  account_number: "Your Account Number",
                  bank_name: "Your Bank Name",
                  account_type: "Savings",
                  currency: "NGN",
                  statement_period: {
                    start_date: "2024-01-01",
                    end_date: "2024-01-31"
                  }
                },
                transactions: [
                  {
                    date: "2024-01-15",
                    description: "Sample Transaction",
                    type: "debit",
                    amount: 5000.00,
                    category: "Shopping"
                  }
                ]
              }

              return res.status(400).json({ 
                error: "PDF parsing is temporarily unavailable",
                details: "We're working on fixing PDF support. In the meantime:",
                alternatives: [
                  "Upload your statement as JSON using the template below",
                  "Use manual transaction entry",
                  "Contact support for assistance"
                ],
                jsonTemplate: sampleTemplate,
                supportContact: "support@algofinny.com"
              })
            }
          }

          try {
            const pdfText = await parsePDFBuffer(buffer)
            
            if (!pdfText || pdfText.trim().length < 50) {
              logger.warn("PDF text extraction returned little or no content", {
                userId,
                textLength: pdfText?.length
              })
              
              return res.status(400).json({ 
                error: "Could not extract text from PDF",
                details: "The PDF might be scanned or image-based. Please try:",
                suggestions: [
                  "Use a text-based PDF (not scanned)",
                  "Upload as JSON instead",
                  "Use manual transaction entry"
                ]
              })
            }

            parsedData = await parsePDFTextToStructuredData(pdfText)
            
            logger.info("PDF parsed successfully", {
              userId,
              transactionsFound: parsedData.transactions?.length || 0,
              hasAccountInfo: !!parsedData.accountInfo,
              textLength: pdfText.length
            })

          } catch (pdfError: any) {
            logger.error("PDF parsing failed", {
              error: pdfError.message,
              userId,
              stack: pdfError.stack
            })
            
            return res.status(400).json({ 
              error: "Failed to parse PDF bank statement",
              details: "The PDF format may not be supported or the file might be corrupted.",
              suggestion: "Please try uploading a JSON file or use manual entry",
              support: "Contact support@algofinny.com for help with specific bank formats"
            })
          }
        } else {
          return res.status(400).json({
            error: "Unsupported file format",
            supportedFormats: ["JSON (.json)", "PDF (.pdf)"],
            received: originalFilename
          })
        }

        console.log(parsedData)

        // ---- Parse structured data ---- //
        const { accountInfo, transactions } = parseStatementData(parsedData)

        // Validate we have at least some data
        if ((!transactions || transactions.length === 0) && !accountInfo) {
          return res.status(400).json({
            error: "No usable data found in file",
            details: "The file doesn't contain recognizable transaction or account data",
            suggestion: "Please check the file format and try again"
          })
        }

        let savedTransactions = 0
        let updatedAccountInfo = null

        // ---- Save account info ---- //
        if (accountInfo) {
          try {
            const accountData = {
              userId,
              account_name: accountInfo.account_name,
              account_number: accountInfo.account_number,
              bank_name: accountInfo.bank_name,
              account_type: accountInfo.account_type,
              currency: accountInfo.currency ?? "NGN",
              statement_period: {
                start_date: new Date(accountInfo.statement_period.start_date),
                end_date: new Date(accountInfo.statement_period.end_date),
              },
              opening_balance: accountInfo.opening_balance ?? 0,
              closing_balance: accountInfo.closing_balance ?? 0,
              total_debits: accountInfo.total_debits ?? 0,
              total_credits: accountInfo.total_credits ?? 0,
              last_updated: new Date(),
            }

            updatedAccountInfo = await AccountInfo.findOneAndUpdate(
              { userId },
              accountData,
              { upsert: true, new: true, runValidators: true }
            )

            logger.info("Account info saved", {
              userId,
              accountNumber: accountInfo.account_number,
            })
          } catch (accountError: any) {
            logger.error("Failed to save account info", {
              error: accountError.message,
              userId,
              accountInfo
            })
          }
        }

        // ---- Save transactions ---- //
        if (transactions && transactions.length > 0) {
          for (const txn of transactions) {
            try {
              // Skip duplicates based on reference or similar transactions
              const existing = await Transaction.findOne({
                userId,
                $or: [
                  { transaction_reference: txn.transaction_reference },
                  { 
                    date: new Date(txn.date), 
                    amount: Math.abs(Number(txn.amount)),
                    description: txn.description
                  }
                ]
              })

              if (existing) {
                logger.debug("Skipping duplicate transaction", {
                  userId,
                  reference: txn.transaction_reference,
                })
                continue
              }

              const transactionData = {
                userId,
                date: new Date(txn.date),
                time: txn.time ?? new Date().toTimeString().slice(0, 8),
                description: txn.description ?? "Bank Statement Transaction",
                type: txn.type === "credit" ? "credit" : "debit",
                amount: Math.abs(Number(txn.amount)),
                balance_after: txn.balance_after ?? null,
                channel: txn.channel ?? "Bank Statement Import",
                transaction_reference: txn.transaction_reference ?? 
                  `IMP${Date.now()}${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
                counterparty: txn.counterparty ?? null,
                category: txn.category ?? categorizeTransaction(txn.description ?? ""),
              }

              await Transaction.create(transactionData)
              savedTransactions++

            } catch (txnError: any) {
              logger.warn("Failed to save transaction", {
                error: txnError.message,
                userId,
                transaction: txn,
              })
            }
          }
        }

        // ---- Clean up ---- //
        try {
          if (filePath) {
            await fs.unlink(filePath)
          }
        } catch (unlinkError: any) {
          logger.warn("Failed to delete uploaded file", {
            error: unlinkError.message,
            filePath
          })
        }

        logger.info("Bank statement processing completed", {
          userId,
          totalTransactions: transactions?.length || 0,
          savedTransactions,
          hasAccountInfo: !!accountInfo,
        })

        return res.json({
          success: true,
          message: "Bank statement processed successfully",
          filename: file.originalFilename,
          size: file.size,
          processed: {
            total_transactions: transactions?.length || 0,
            saved_transactions: savedTransactions,
            skipped_transactions: (transactions?.length || 0) - savedTransactions,
            account_info_updated: !!updatedAccountInfo,
          },
          ...(savedTransactions === 0 && {
            warning: "No new transactions were saved (may be duplicates or no transactions found)"
          })
        })

      } catch (processingError: any) {
        logger.error("Error processing bank statement", {
          error: processingError.message,
          stack: processingError.stack,
          userId
        })

        // Clean up uploaded file if it exists
        if (filePath) {
          try {
            await fs.unlink(filePath)
          } catch (unlinkError) {
            logger.warn("Failed to delete uploaded file after error", {
              error: String(unlinkError),
              filePath
            })
          }
        }

        return res.status(500).json({
          error: "Failed to process bank statement",
          details: "An internal error occurred. Please try again or contact support.",
          support: "support@algofinny.com"
        })
      }
    })

  } catch (error: any) {
    logger.error("Unexpected error in handleFileUpload", {
      error: error.message,
      stack: error.stack
    })

    return res.status(500).json({
      error: "Internal server error",
      details: "Please try again later"
    })
  }
}

// Initialize PDF parser on startup with retry
async function initializePDFParserWithRetry(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const available = await initializePDFParser()
      if (available) {
        logger.info("PDF parser initialized successfully on attempt " + (i + 1))
        return true
      }
    } catch (error) {
      logger.warn(`PDF parser initialization failed on attempt ${i + 1}`, {
        error: String(error)
      })
    }
    
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  logger.warn("PDF parser initialization failed after all retries")
  return false
}

// Initialize on startup
initializePDFParserWithRetry().then(available => {
  if (available) {
    logger.info("PDF parser ready for use")
  } else {
    logger.warn("PDF parser unavailable - users will need to use JSON uploads")
  }
}).catch(error => {
  logger.error("Failed to initialize PDF parser", { error: String(error) })
})