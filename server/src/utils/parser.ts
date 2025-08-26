// server/src/utils/parser.ts - Statement data parser utility
import { ParsedStatement } from "./pdfTextParser.js"
import { categorizeTransaction } from "./categorizer.js"
import logger from "./logger.js"

export interface ProcessedAccountInfo {
  account_name: string
  account_number: string
  bank_name: string
  account_type: string
  currency: string
  statement_period: {
    start_date: string
    end_date: string
  }
  opening_balance?: number
  closing_balance?: number
  wallet_balance?: number
  total_debits?: number
  total_credits?: number
}

export interface ProcessedTransaction {
  date: Date | string
  time?: string
  description: string
  type: "credit" | "debit"
  amount: number
  balance_after?: number | null
  category: string
  transaction_reference?: string
  channel?: string
  counterparty?: string | null
}

export interface ParsedData {
  accountInfo?: ProcessedAccountInfo
  transactions: ProcessedTransaction[]
}

export function parseStatementData(parsedStatement: ParsedStatement): ParsedData {
  logger.info("Processing parsed statement data", {
    bankType: parsedStatement.bankType,
    hasAccountInfo: !!parsedStatement.accountInfo,
    transactionCount: parsedStatement.transactions?.length || 0
  })

  let processedAccountInfo: ProcessedAccountInfo | undefined
  let processedTransactions: ProcessedTransaction[] = []

  // Process account information
  if (parsedStatement.accountInfo) {
    try {
      processedAccountInfo = {
        account_name: parsedStatement.accountInfo.account_name || "Unknown Account",
        account_number: parsedStatement.accountInfo.account_number || "Unknown",
        bank_name: parsedStatement.accountInfo.bank_name || "Unknown Bank",
        account_type: parsedStatement.accountInfo.account_type || "Account",
        currency: parsedStatement.accountInfo.currency || "NGN",
        statement_period: {
          start_date: parsedStatement.accountInfo.statement_period?.start_date || new Date().toISOString().slice(0, 10),
          end_date: parsedStatement.accountInfo.statement_period?.end_date || new Date().toISOString().slice(0, 10)
        },
        opening_balance: parsedStatement.accountInfo.opening_balance,
        closing_balance: parsedStatement.accountInfo.closing_balance,
        wallet_balance: parsedStatement.accountInfo.wallet_balance,
        total_debits: parsedStatement.accountInfo.total_debits,
        total_credits: parsedStatement.accountInfo.total_credits
      }

      logger.info("Account info processed", {
        bankName: processedAccountInfo.bank_name,
        accountType: processedAccountInfo.account_type,
        hasBalance: !!(processedAccountInfo.closing_balance || processedAccountInfo.wallet_balance)
      })

    } catch (error: any) {
      logger.error("Error processing account info", { error: error.message })
      processedAccountInfo = undefined
    }
  }

  // Process transactions
  if (parsedStatement.transactions && Array.isArray(parsedStatement.transactions)) {
    for (const txn of parsedStatement.transactions) {
      try {
        // Validate required fields
        if (!txn.description || !txn.amount || !txn.date) {
          logger.warn("Skipping transaction with missing required fields", {
            hasDescription: !!txn.description,
            hasAmount: !!txn.amount,
            hasDate: !!txn.date
          })
          continue
        }

        // Parse and validate amount
        const amount = typeof txn.amount === 'string' 
          ? parseFloat(txn.amount.replace(/[₦,]/g, '')) 
          : Number(txn.amount)

        if (isNaN(amount) || amount <= 0) {
          logger.warn("Skipping transaction with invalid amount", { 
            originalAmount: txn.amount,
            parsedAmount: amount
          })
          continue
        }

        // Parse date
        let transactionDate: Date
        if (txn.date instanceof Date) {
          transactionDate = txn.date
        } else {
          transactionDate = new Date(txn.date)
          if (isNaN(transactionDate.getTime())) {
            logger.warn("Skipping transaction with invalid date", { date: txn.date })
            continue
          }
        }

        // Normalize transaction type
        const normalizedType = normalizeTransactionType(txn.type)

        // Process description
        const description = String(txn.description).trim()
        if (description.length === 0) {
          logger.warn("Transaction has empty description, using default")
        }

        // Categorize transaction
        const category = txn.category || categorizeTransaction(description)

        // Generate transaction reference if not provided
        const transactionReference = txn.transaction_reference || 
          generateTransactionReference(parsedStatement.bankType || 'traditional')

        // Parse balance after transaction
        let balanceAfter: number | null = null
        if (txn.balance_after !== null && txn.balance_after !== undefined) {
          const balance = typeof txn.balance_after === 'string' 
            ? parseFloat(txn.balance_after.replace(/[₦,]/g, ''))
            : Number(txn.balance_after)
          
          if (!isNaN(balance)) {
            balanceAfter = balance
          }
        }

        const processedTransaction: ProcessedTransaction = {
          date: transactionDate,
          time: txn.time || new Date().toTimeString().slice(0, 8),
          description: description || "Bank Transaction",
          type: normalizedType,
          amount: Math.abs(amount), // Ensure amount is positive
          balance_after: balanceAfter,
          category,
          transaction_reference: transactionReference,
          channel: txn.channel || getDefaultChannel(parsedStatement.bankType),
          counterparty: txn.counterparty || null
        }

        processedTransactions.push(processedTransaction)

      } catch (error: any) {
        logger.error("Error processing transaction", {
          error: error.message,
          transaction: {
            description: txn.description,
            amount: txn.amount,
            date: txn.date,
            type: txn.type
          }
        })
      }
    }
  }

  // Sort transactions by date (newest first)
  processedTransactions.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateB - dateA
  })

  logger.info("Statement data processing completed", {
    accountInfoProcessed: !!processedAccountInfo,
    transactionsProcessed: processedTransactions.length,
    originalTransactionCount: parsedStatement.transactions?.length || 0
  })

  return {
    accountInfo: processedAccountInfo,
    transactions: processedTransactions
  }
}

// Helper function to normalize transaction type
function normalizeTransactionType(type: any): "credit" | "debit" {
  if (!type) return "debit"
  
  const typeStr = String(type).toLowerCase().trim()
  
  // Handle various formats
  if (typeStr === 'credit' || typeStr === 'cr' || typeStr === 'income') {
    return "credit"
  }
  
  if (typeStr === 'debit' || typeStr === 'dr' || typeStr === 'expense') {
    return "debit"
  }
  
  // Default to debit for unknown types
  logger.warn("Unknown transaction type, defaulting to debit", { originalType: type })
  return "debit"
}

// Helper function to generate transaction reference
function generateTransactionReference(bankType: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  
  let prefix = "TXN"
  
  if (bankType === "opay") {
    prefix = "OP"
  } else if (bankType === "traditional") {
    prefix = "BNK"
  }
  
  return `${prefix}${timestamp}${random}`
}

// Helper function to get default channel based on bank type
function getDefaultChannel(bankType?: string): string {
  switch (bankType) {
    case "opay":
      return "OPay Mobile App"
    case "traditional":
      return "Bank Statement Import"
    default:
      return "Statement Import"
  }
}

// Helper function to validate parsed statement structure
export function validateParsedStatement(parsedStatement: any): parsedStatement is ParsedStatement {
  if (!parsedStatement || typeof parsedStatement !== 'object') {
    return false
  }

  // Check if it has either transactions or account info
  if (!parsedStatement.transactions && !parsedStatement.accountInfo) {
    return false
  }

  // Validate transactions array if present
  if (parsedStatement.transactions) {
    if (!Array.isArray(parsedStatement.transactions)) {
      return false
    }

    // Check if transactions have required fields
    for (const txn of parsedStatement.transactions) {
      if (!txn.date || !txn.description || (txn.amount === null || txn.amount === undefined)) {
        return false
      }
    }
  }

  // Validate account info if present
  if (parsedStatement.accountInfo) {
    if (typeof parsedStatement.accountInfo !== 'object') {
      return false
    }

    const accountInfo = parsedStatement.accountInfo
    if (!accountInfo.account_name || !accountInfo.bank_name) {
      return false
    }
  }

  return true
}

// Helper function to sanitize parsed data for security
export function sanitizeParsedStatement(parsedStatement: ParsedStatement): ParsedStatement {
  const sanitized: ParsedStatement = {
    bankType: parsedStatement.bankType
  }

  // Sanitize account info
  if (parsedStatement.accountInfo) {
    sanitized.accountInfo = {
      account_name: String(parsedStatement.accountInfo.account_name).trim().slice(0, 100),
      account_number: String(parsedStatement.accountInfo.account_number).trim().slice(0, 50),
      bank_name: String(parsedStatement.accountInfo.bank_name).trim().slice(0, 100),
      account_type: String(parsedStatement.accountInfo.account_type).trim().slice(0, 50),
      currency: String(parsedStatement.accountInfo.currency || 'NGN').trim().slice(0, 10),
      statement_period: {
        start_date: String(parsedStatement.accountInfo.statement_period?.start_date || '').trim().slice(0, 20),
        end_date: String(parsedStatement.accountInfo.statement_period?.end_date || '').trim().slice(0, 20)
      },
      opening_balance: parsedStatement.accountInfo.opening_balance,
      closing_balance: parsedStatement.accountInfo.closing_balance,
      wallet_balance: parsedStatement.accountInfo.wallet_balance,
      total_debits: parsedStatement.accountInfo.total_debits,
      total_credits: parsedStatement.accountInfo.total_credits
    }
  }

  // Sanitize transactions
  if (parsedStatement.transactions) {
    sanitized.transactions = parsedStatement.transactions.map(txn => ({
      date: txn.date,
      time: txn.time ? String(txn.time).trim().slice(0, 20) : undefined,
      description: String(txn.description).trim().slice(0, 500), // Limit description length
      type: txn.type,
      amount: txn.amount,
      balance_after: txn.balance_after,
      category: txn.category ? String(txn.category).trim().slice(0, 50) : undefined,
      transaction_reference: txn.transaction_reference ? String(txn.transaction_reference).trim().slice(0, 100) : undefined,
      channel: txn.channel ? String(txn.channel).trim().slice(0, 100) : undefined,
      counterparty: txn.counterparty ? String(txn.counterparty).trim().slice(0, 200) : null
    }))
  }

  return sanitized
}