import type { Request, Response } from "express"
import formidable from "formidable"
import fs from "fs/promises"
import path from "path"
import winston from "winston"
import Transaction from "../models/Transaction.js"
import AccountInfo from "../models/AccountInfo.js"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
})

function getUserId(req: Request): string | null {
  const header = req.headers.authorization
  if (!header) return null
  const [, token] = header.split(" ")
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return payload.sub as string
  } catch {
    return null
  }
}

// Category mapping for automatic categorization
const CATEGORY_MAPPING: Record<string, string> = {
  // Mobile and Data
  'mobile data': 'Utilities - Mobile',
  'airtime': 'Utilities - Mobile', 
  'data bundle': 'Utilities - Mobile',
  'mtn': 'Utilities - Mobile',
  'glo': 'Utilities - Mobile',
  'airtel': 'Utilities - Mobile',
  '9mobile': 'Utilities - Mobile',
  
  // Food and Restaurants
  'restaurant': 'Food & Dining',
  'food': 'Food & Dining',
  'pizza': 'Food & Dining',
  'kfc': 'Food & Dining',
  'dominos': 'Food & Dining',
  'chicken republic': 'Food & Dining',
  
  // Transportation
  'uber': 'Transportation',
  'bolt': 'Transportation',
  'okada': 'Transportation',
  'bus fare': 'Transportation',
  'fuel': 'Transportation',
  'petrol': 'Transportation',
  
  // Shopping
  'jumia': 'Shopping',
  'konga': 'Shopping',
  'supermarket': 'Shopping',
  'market': 'Shopping',
  'shoprite': 'Shopping',
  
  // Utilities
  'electricity': 'Utilities - Power',
  'nepa': 'Utilities - Power',
  'phcn': 'Utilities - Power',
  'water bill': 'Utilities - Water',
  'internet': 'Utilities - Internet',
  
  // Transfer
  'transfer to': 'Transfer - Outgoing',
  'transfer from': 'Transfer - Incoming',
  'self transfer': 'Transfer - Self',
  
  // Default
  'other': 'Other'
}

function categorizeTransaction(description: string): string {
  const lowerDesc = description.toLowerCase()
  
  for (const [keyword, category] of Object.entries(CATEGORY_MAPPING)) {
    if (lowerDesc.includes(keyword)) {
      return category
    }
  }
  
  return 'Other'
}

function parseStatementData(data: any): { accountInfo: any; transactions: any[] } {
  // Handle the exact format you specified
  if (data.account_info && data.transactions) {
    return {
      accountInfo: data.account_info,
      transactions: data.transactions
    }
  }
  
  // Handle other possible formats
  if (Array.isArray(data)) {
    // If it's just an array of transactions
    return {
      accountInfo: null,
      transactions: data
    }
  }
  
  // If it's a single object that might be a transaction
  if (data.date && data.amount !== undefined) {
    return {
      accountInfo: null,
      transactions: [data]
    }
  }
  
  throw new Error('Unsupported data format')
}

// Utility: parse uploaded file
export async function handleBankStatementUpload(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const uploadDir = path.join(process.cwd(), "uploads")
    await fs.mkdir(uploadDir, { recursive: true })
    
    const form = formidable({ 
      multiples: false, 
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024 // 10MB
    })
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        logger.error("Upload parsing error", { error: err.message })
        return res.status(400).json({ error: "Upload failed" })
      }
      
      const file = Array.isArray(files.statement) ? files.statement[0] : files.statement
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" })
      }
      
      try {
        const filePath = file.filepath || (file as any).path
        const buffer = await fs.readFile(filePath)
        
        logger.info("Processing bank statement", { 
          userId, 
          filename: file.originalFilename,
          size: file.size 
        })
        
        let parsedData: any
        
        // Handle different file types
        if (file.originalFilename?.endsWith('.json')) {
          // Parse JSON file
          const jsonContent = buffer.toString('utf8')
          parsedData = JSON.parse(jsonContent)
        } else if (file.originalFilename?.endsWith('.csv')) {
          // TODO: Implement CSV parsing
          return res.status(400).json({ error: "CSV parsing not yet implemented" })
        } else if (file.originalFilename?.endsWith('.pdf')) {
          // TODO: Implement PDF parsing
          return res.status(400).json({ error: "PDF parsing not yet implemented" })
        } else {
          return res.status(400).json({ error: "Unsupported file format. Please upload JSON, CSV, or PDF files." })
        }
        
        // Parse the statement data
        const { accountInfo, transactions } = parseStatementData(parsedData)
        
        let savedTransactions = 0
        let updatedAccountInfo = null
        
        // Save account info if provided
        if (accountInfo) {
          const accountData = {
            userId,
            account_name: accountInfo.account_name,
            account_number: accountInfo.account_number,
            bank_name: accountInfo.bank_name,
            account_type: accountInfo.account_type,
            currency: accountInfo.currency || 'NGN',
            statement_period: {
              start_date: new Date(accountInfo.statement_period.start_date),
              end_date: new Date(accountInfo.statement_period.end_date)
            },
            opening_balance: accountInfo.opening_balance || 0,
            closing_balance: accountInfo.closing_balance || 0,
            total_debits: accountInfo.total_debits || 0,
            total_credits: accountInfo.total_credits || 0,
            last_updated: new Date()
          }
          
          updatedAccountInfo = await AccountInfo.findOneAndUpdate(
            { userId },
            accountData,
            { upsert: true, new: true }
          )
          
          logger.info("Account info saved", { userId, accountNumber: accountInfo.account_number })
        }
        
        // Process transactions
        for (const txn of transactions) {
          try {
            // Skip if transaction already exists (check by reference if available)
            if (txn.transaction_reference) {
              const existing = await Transaction.findOne({
                userId,
                transaction_reference: txn.transaction_reference
              })
              if (existing) {
                logger.debug("Skipping duplicate transaction", { 
                  reference: txn.transaction_reference 
                })
                continue
              }
            }
            
            // Prepare transaction data
            const transactionData = {
              userId,
              date: new Date(txn.date),
              time: txn.time || new Date().toTimeString().slice(0, 8),
              description: txn.description || 'Bank Statement Transaction',
              type: txn.type === 'credit' || txn.type === 'debit' ? txn.type : 
                    (txn.amount > 0 ? 'credit' : 'debit'),
              amount: Math.abs(Number(txn.amount)),
              balance_after: txn.balance_after || null,
              channel: txn.channel || 'Bank Statement Import',
              transaction_reference: txn.transaction_reference || 
                `IMP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
              counterparty: txn.counterparty || null,
              category: txn.category || categorizeTransaction(txn.description || '')
            }
            
            await Transaction.create(transactionData)
            savedTransactions++
            
          } catch (txnError: any) {
            logger.warn("Failed to save transaction", { 
              error: txnError.message,
              transaction: txn 
            })
          }
        }
        
        // Clean up uploaded file
        try {
          await fs.unlink(filePath)
        } catch (unlinkError) {
          logger.warn("Failed to delete uploaded file", { error: unlinkError })
        }
        
        logger.info("Bank statement processing completed", {
          userId,
          totalTransactions: transactions.length,
          savedTransactions,
          hasAccountInfo: !!accountInfo
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
            account_info_updated: !!updatedAccountInfo
          }
        })
        
      } catch (processingError: any) {
        logger.error("Error processing bank statement", { 
          error: processingError.message,
          stack: processingError.stack,
          userId 
        })
        
        // Clean up file on error
        try {
          const filePath = file.filepath || (file as any).path
          await fs.unlink(filePath)
        } catch (unlinkError) {
          logger.warn("Failed to delete uploaded file after error", { error: unlinkError })
        }
        
        return res.status(500).json({ 
          error: "Failed to process bank statement",
          details: processingError.message 
        })
      }
    })
    
  } catch (err: any) {
    logger.error("Bank statement upload error", { 
      error: err.message,
      stack: err.stack 
    })
    return res.status(500).json({ error: "Internal server error" })
  }
}