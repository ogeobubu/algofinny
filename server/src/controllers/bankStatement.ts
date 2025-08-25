import { Request, Response } from "express"
import formidable, { File } from "formidable"
import fs from "fs/promises"
import AccountInfo from "../models/AccountInfo.js"
import Transaction from "../models/Transaction.js"
import logger from "../utils/logger.js"
import { categorizeTransaction } from "../utils/categorizer.js"
import { parseStatementData } from "../utils/parser.js"
import { parsePDFBuffer, isPDFParserAvailable } from "../utils/pdfParser.js"

// ---- Types ---- //
interface ParsedStatement {
  accountInfo?: {
    account_name: string
    account_number: string
    bank_name: string
    account_type: string
    currency?: string
    statement_period: { start_date: string; end_date: string }
    opening_balance?: number
    closing_balance?: number
    total_debits?: number
    total_credits?: number
  }
  transactions: Array<{
    date: string
    time?: string
    description?: string
    type?: "credit" | "debit"
    amount: number
    balance_after?: number
    channel?: string
    transaction_reference?: string
    counterparty?: string
    category?: string
  }>
}

export const handleFileUpload = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    // Create uploads directory if it doesn't exist
    try {
      await fs.access('./uploads')
    } catch {
      await fs.mkdir('./uploads', { recursive: true })
    }

    // Parse the form with formidable
    const form = formidable({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      uploadDir: './uploads',
      keepExtensions: true,
      filename: (name, ext) => {
        return `statement_${Date.now()}${ext}`
      }
    })

    // Parse the form
    form.parse(req, async (err, fields, files) => {
      if (err) {
        logger.error("Form parsing error:", err)
        return res.status(400).json({ error: "Failed to parse form data", details: err.message })
      }

      try {
        const file = files.statement?.[0] as File | undefined
        if (!file) {
          return res.status(400).json({ error: "No file uploaded" })
        }

        const userId = (req as any).userId
        if (!userId) {
          return res.status(401).json({ error: "User not authenticated" })
        }

        const filePath = file.filepath
        if (!filePath) {
          return res.status(400).json({ error: "Uploaded file is missing path" })
        }

        const buffer = await fs.readFile(filePath)

        logger.info("Processing bank statement", {
          userId,
          filename: file.originalFilename,
          size: file.size,
        })

        let parsedData: ParsedStatement

        // ---- Handle file formats ---- //
        if (file.originalFilename?.endsWith(".json")) {
          try {
            parsedData = JSON.parse(buffer.toString("utf8")) as ParsedStatement
          } catch (parseError) {
            return res.status(400).json({ error: "Invalid JSON file format" })
          }
        } else if (file.originalFilename?.endsWith(".csv")) {
          return res.status(400).json({ error: "CSV parsing not yet implemented" })
        } else if (file.originalFilename?.endsWith(".pdf")) {
          // Check if PDF parsing is available
          if (!isPDFParserAvailable()) {
            const available = await initializePDFParser()
            if (!available) {
              return res.status(400).json({ error: "PDF parsing is not available in this environment" })
            }
          }
          
          try {
            const pdfText = await parsePDFBuffer(buffer)
            // For now, return raw text until you implement PDF parsing logic
            return res.status(400).json({ 
              error: "PDF parsing is implemented but text extraction needs processing logic",
              extractedText: pdfText.substring(0, 200) + "..." 
            })
          } catch (pdfError) {
            return res.status(400).json({ error: "Failed to parse PDF", details: String(pdfError) })
          }
        } else {
          return res.status(400).json({
            error: "Unsupported file format. Please upload JSON, CSV, or PDF files.",
          })
        }

        // ---- Parse structured data ---- //
        const { accountInfo, transactions } = parseStatementData(parsedData)

        let savedTransactions = 0
        let updatedAccountInfo = null

        // ---- Save account info ---- //
        if (accountInfo) {
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
            { upsert: true, new: true }
          )

          logger.info("Account info saved", {
            userId,
            accountNumber: accountInfo.account_number,
          })
        }

        // ---- Save transactions ---- //
        for (const txn of transactions) {
          try {
            // Skip duplicates
            if (txn.transaction_reference) {
              const existing = await Transaction.findOne({
                userId,
                transaction_reference: txn.transaction_reference,
              })
              if (existing) {
                logger.debug("Skipping duplicate transaction", {
                  reference: txn.transaction_reference,
                })
                continue
              }
            }

            const transactionData = {
              userId,
              date: new Date(txn.date),
              time: txn.time ?? new Date().toTimeString().slice(0, 8),
              description: txn.description ?? "Bank Statement Transaction",
              type:
                txn.type === "credit" || txn.type === "debit"
                  ? txn.type
                  : txn.amount > 0
                  ? "credit"
                  : "debit",
              amount: Math.abs(Number(txn.amount)),
              balance_after: txn.balance_after ?? null,
              channel: txn.channel ?? "Bank Statement Import",
              transaction_reference:
                txn.transaction_reference ??
                `IMP${Date.now()}${Math.random()
                  .toString(36)
                  .slice(2, 8)
                  .toUpperCase()}`,
              counterparty: txn.counterparty ?? null,
              category: txn.category ?? categorizeTransaction(txn.description ?? ""),
            }

            await Transaction.create(transactionData)
            savedTransactions++
          } catch (txnError: unknown) {
            const errMsg =
              txnError instanceof Error ? txnError.message : String(txnError)
            logger.warn("Failed to save transaction", {
              error: errMsg,
              transaction: txn,
            })
          }
        }

        // ---- Clean up ---- //
        try {
          await fs.unlink(filePath)
        } catch (unlinkError: unknown) {
          logger.warn("Failed to delete uploaded file", {
            error: String(unlinkError),
          })
        }

        logger.info("Bank statement processing completed", {
          userId,
          totalTransactions: transactions.length,
          savedTransactions,
          hasAccountInfo: !!accountInfo,
        })

        return res.json({
          success: true,
          message: "Bank statement processed successfully",
          filename: file.originalFilename,
          size: file.size,
          processed: {
            total_transactions: transactions.length,
            saved_transactions: savedTransactions,
            skipped_transactions: transactions.length - savedTransactions,
            account_info_updated: !!updatedAccountInfo,
          },
        })

      } catch (processingError: unknown) {
        const errMsg =
          processingError instanceof Error
            ? processingError.message
            : String(processingError)

        logger.error("Error processing bank statement", {
          error: errMsg,
        })

        // Clean up uploaded file if it exists
        const file = files.statement?.[0] as File | undefined
        if (file?.filepath) {
          try {
            await fs.unlink(file.filepath)
          } catch (unlinkError) {
            logger.warn("Failed to delete uploaded file after error", {
              error: String(unlinkError),
            })
          }
        }

        return res.status(500).json({
          error: "Failed to process bank statement",
          details: errMsg,
        })
      }
    })

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    logger.error("Unexpected error in handleFileUpload", {
      error: errMsg,
    })

    return res.status(500).json({
      error: "Internal server error",
      details: errMsg,
    })
  }
}

// Initialize PDF parser on startup (but don't block the server)
import('../utils/pdfParser.js').then(({ initializePDFParser }) => {
  initializePDFParser().then(available => {
    if (available) {
      logger.info("PDF parser initialized successfully")
    } else {
      logger.warn("PDF parser not available - PDF uploads will be disabled")
    }
  })
})
async function initializePDFParser(): Promise<boolean> {
  try {
    // Simulate initialization logic for a PDF parser library
    const isInitialized = await import("pdf-lib").then(() => true).catch(() => false);

    if (isInitialized) {
      logger.info("PDF parser library loaded successfully");
      return true;
    } else {
      logger.warn("Failed to load PDF parser library");
      return false;
    }
  } catch (error) {
    logger.error("Error initializing PDF parser", { error: String(error) });
    return false;
  }
}
