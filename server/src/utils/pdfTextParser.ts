// server/src/utils/pdfTextParser.ts - Enhanced version
import logger from "./logger.js"
import { categorizeTransaction } from "./categorizer.js"
import { parseOpayPDFText, OpayStatement } from "./opayParser.js"

export interface ParsedStatement {
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
    wallet_balance?: number
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
  bankType?: "opay" | "traditional"
}

export async function parsePDFTextToStructuredData(text: string): Promise<ParsedStatement> {
  try {
    // Detect bank type
    const bankType = detectBankType(text)
    
    logger.info("Detected bank type", { bankType })
    
    if (bankType === "opay") {
      // Use Opay-specific parser
      const opayResult = parseOpayPDFText(text)
      
      // Convert to standard format
      return {
        accountInfo: opayResult.accountInfo,
        transactions: opayResult.transactions,
        bankType: "opay"
      }
    } else {
      // Use traditional bank parser
      const result = parseTraditionalBankStatement(text)
      return {
        ...result,
        bankType: "traditional"
      }
    }
  } catch (error) {
    logger.error("Error in PDF text parsing", { error: String(error) })
    throw error
  }
}

function detectBankType(text: string): "opay" | "traditional" {
  const textLower = text.toLowerCase()
  
  // Opay indicators
  const opayIndicators = [
    "opay",
    "o-pay",
    "digital wallet",
    "wallet balance",
    "mobile money",
    "fintech",
    "pos transaction",
    "p2p transfer",
    "qr payment",
    "mobile app",
    "wallet funding"
  ]
  
  // Traditional bank indicators  
  const traditionalIndicators = [
    "first bank",
    "access bank",
    "gtbank",
    "zenith bank",
    "uba",
    "fidelity bank",
    "sterling bank",
    "wema bank",
    "union bank",
    "current account",
    "savings account",
    "account statement",
    "sort code",
    "swift code"
  ]
  
  let opayScore = 0
  let traditionalScore = 0
  
  // Count indicators
  for (const indicator of opayIndicators) {
    if (textLower.includes(indicator)) {
      opayScore++
    }
  }
  
  for (const indicator of traditionalIndicators) {
    if (textLower.includes(indicator)) {
      traditionalScore++
    }
  }
  
  // Additional heuristics
  if (textLower.includes("opay") || textLower.includes("o-pay")) {
    opayScore += 5 // Strong indicator
  }
  
  if (textLower.includes("wallet") && (textLower.includes("balance") || textLower.includes("funding"))) {
    opayScore += 3
  }
  
  // Phone number as account identifier suggests digital bank
  if (text.match(/(?:Account|Phone).*?(?:\+234|0)[1-9]\d{9}/)) {
    opayScore += 2
  }
  
  // Traditional account number format
  if (text.match(/\d{10,}/)) {
    traditionalScore += 1
  }
  
  logger.info("Bank type detection scores", { opayScore, traditionalScore })
  
  return opayScore > traditionalScore ? "opay" : "traditional"
}

function parseTraditionalBankStatement(text: string): Omit<ParsedStatement, 'bankType'> {
  const result: Omit<ParsedStatement, 'bankType'> = { transactions: [] }
  
  try {
    // Traditional Nigerian bank patterns
    const patterns = [
      // Account number patterns
      { 
        regex: /Account\s*Number[:]?\s*([A-Z0-9-\s]+)/i, 
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.account_number = match[1].trim()
        }
      },
      { 
        regex: /Account\s*No[:]?\s*([A-Z0-9-\s]+)/i, 
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.account_number = match[1].trim()
        }
      },
      
      // Account name patterns
      { 
        regex: /Account\s*Name[:]?\s*([A-Z\s\.]+)/i, 
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.account_name = match[1].trim()
        }
      },
      
      // Bank name patterns
      { 
        regex: /Bank\s*Name[:]?\s*([A-Z\s]+)/i, 
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.bank_name = match[1].trim()
        }
      },
      
      // Detect bank from header or footer
      {
        regex: /(First Bank|Access Bank|GTBank|Zenith Bank|UBA|Fidelity Bank|Sterling Bank|Wema Bank|Union Bank)/i,
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.bank_name = match[1].trim()
        }
      },
      
      // Currency patterns
      { 
        regex: /Currency[:]?\s*([A-Z]{3})/i, 
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.currency = match[1].trim()
        }
      },
      
      // Statement period patterns
      { 
        regex: /Statement\s*Period[:]?\s*(\d{2}\/\d{2}\/\d{4})\s*to\s*(\d{2}\/\d{2}\/\d{4})/i, 
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.statement_period = {
            start_date: match[1],
            end_date: match[2]
          }
        }
      },
      
      // Balance patterns
      { 
        regex: /Opening\s*Balance[:]?\s*([\d,]+\.\d{2})/i, 
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.opening_balance = parseFloat(match[1].replace(/,/g, ''))
        }
      },
      { 
        regex: /Closing\s*Balance[:]?\s*([\d,]+\.\d{2})/i, 
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.closing_balance = parseFloat(match[1].replace(/,/g, ''))
        }
      },
    ]

    // Process patterns
    for (const pattern of patterns) {
      const match = text.match(pattern.regex)
      if (match) {
        pattern.handler(match)
      }
    }

    // Transaction patterns - multiple approaches
    const transactionPatterns = [
      // Pattern 1: Date Description Amount
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})/g,
      // Pattern 2: Date Description Reference Amount
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Z0-9]+)\s+([\d,]+\.\d{2})/g,
      // Pattern 3: Date Description Debit Credit Balance
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g
    ]

    for (const pattern of transactionPatterns) {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        try {
          let amount: number, type: "credit" | "debit", description: string
          
          if (match.length >= 4) {
            // Pattern 1 or 2
            amount = parseFloat(match[match.length - 1].replace(/,/g, ''))
            description = match[2].trim()
            type = amount >= 0 ? "credit" : "debit"
          } else {
            // Pattern 3
            const debit = match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0
            const credit = match[4] ? parseFloat(match[4].replace(/,/g, '')) : 0
            amount = credit > 0 ? credit : -debit
            type = credit > 0 ? "credit" : "debit"
            description = match[2].trim()
          }

          const transaction = {
            date: match[1],
            description,
            type,
            amount: Math.abs(amount),
            balance_after: match[5] ? parseFloat(match[5].replace(/,/g, '')) : undefined,
            category: categorizeTransaction(description),
            transaction_reference: match[3] && match[3].match(/[A-Z0-9]{6,}/) ? match[3] : undefined,
            channel: "Bank Statement Import"
          }

          // Basic validation to avoid false positives
          if (transaction.amount > 0 && transaction.description.length > 3) {
            result.transactions.push(transaction)
          }
        } catch (error) {
          // Skip invalid transactions
          continue
        }
      }
    }

    // Set default values if not found
    if (result.accountInfo) {
      result.accountInfo.currency = result.accountInfo.currency || "NGN"
      result.accountInfo.account_type = result.accountInfo.account_type || "Savings"
    }

  } catch (error) {
    logger.error("Error parsing traditional bank statement", { error: String(error) })
    throw error
  }

  return result
}