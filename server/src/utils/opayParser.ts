// server/src/utils/opayParser.ts
import logger from "./logger.js"
import { categorizeTransaction } from "./categorizer.js"

export interface OpayTransaction {
  date: string
  time?: string
  description: string
  type: "credit" | "debit"
  amount: number
  balance_after?: number
  channel?: string
  transaction_reference?: string
  counterparty?: string
  category?: string
  transaction_id?: string
  merchant?: string
  location?: string
}

export interface OpayStatement {
  accountInfo?: {
    account_name: string
    account_number: string
    bank_name: string
    account_type: string
    currency: string
    statement_period: { start_date: string; end_date: string }
    opening_balance?: number
    closing_balance?: number
    total_debits?: number
    total_credits?: number
    wallet_balance?: number
  }
  transactions: OpayTransaction[]
}

// Enhanced Opay-specific categorization
export function categorizeOpayTransaction(description: string): string {
  if (!description) return "Other"
  
  const desc = description.toLowerCase().trim()
  
  // Opay-specific patterns
  if (desc.includes('opay wallet') || desc.includes('wallet topup') || desc.includes('wallet funding')) {
    return "Wallet Funding"
  }
  
  if (desc.includes('opay pos') || desc.includes('pos transaction') || desc.includes('pos withdrawal')) {
    return "POS Transaction"
  }
  
  if (desc.includes('opay transfer') || desc.includes('p2p transfer') || desc.includes('send money')) {
    return "Money Transfer"
  }
  
  if (desc.includes('opay bill') || desc.includes('bill payment') || desc.includes('utility payment')) {
    return "Bill Payment"
  }
  
  if (desc.includes('opay airtime') || desc.includes('airtime purchase') || desc.includes('data purchase')) {
    return "Airtime/Data"
  }
  
  if (desc.includes('opay merchant') || desc.includes('merchant payment') || desc.includes('qr payment')) {
    return "Merchant Payment"
  }
  
  if (desc.includes('opay savings') || desc.includes('ajo savings') || desc.includes('target savings')) {
    return "Savings"
  }
  
  if (desc.includes('opay loan') || desc.includes('loan disbursement') || desc.includes('loan repayment')) {
    return "Loan"
  }
  
  if (desc.includes('opay investment') || desc.includes('investment return') || desc.includes('mutual fund')) {
    return "Investment"
  }
  
  if (desc.includes('cashback') || desc.includes('reward') || desc.includes('bonus')) {
    return "Rewards"
  }
  
  if (desc.includes('refund') || desc.includes('reversal') || desc.includes('failed transaction')) {
    return "Refund/Reversal"
  }
  
  // Fall back to general categorization
  return categorizeTransaction(description)
}

export function parseOpayPDFText(text: string): OpayStatement {
  const result: OpayStatement = { transactions: [] }
  
  try {
    logger.info("Starting Opay PDF text parsing", { textLength: text.length })
    
    // Extract account information - Opay specific patterns
    const accountPatterns = [
      // Account holder name
      {
        regex: /(?:Account\s*Holder|Customer\s*Name|Name)[:]?\s*([A-Z\s\.]+)/i,
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.account_name = match[1].trim()
        }
      },
      
      // Phone number as account identifier for Opay
      {
        regex: /(?:Phone\s*Number|Mobile)[:]?\s*(\+234\d{10}|\d{11})/i,
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.account_number = match[1].trim()
        }
      },
      
      // Opay account number (if different format)
      {
        regex: /(?:Account\s*Number|Opay\s*ID)[:]?\s*([A-Z0-9]+)/i,
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.account_number = match[1].trim()
        }
      },
      
      // Statement period
      {
        regex: /(?:Statement\s*Period|Period)[:]?\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:to|-)\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.statement_period = {
            start_date: formatOpayDate(match[1]),
            end_date: formatOpayDate(match[2])
          }
        }
      },
      
      // Opening balance
      {
        regex: /(?:Opening\s*Balance|Previous\s*Balance)[:]?\s*₦?([\d,]+\.?\d*)/i,
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.opening_balance = parseFloat(match[1].replace(/,/g, ''))
        }
      },
      
      // Closing balance
      {
        regex: /(?:Closing\s*Balance|Current\s*Balance|Wallet\s*Balance)[:]?\s*₦?([\d,]+\.?\d*)/i,
        handler: (match: RegExpMatchArray) => {
          result.accountInfo = result.accountInfo || {} as any
          result.accountInfo.closing_balance = parseFloat(match[1].replace(/,/g, ''))
          result.accountInfo.wallet_balance = parseFloat(match[1].replace(/,/g, ''))
        }
      }
    ]

    // Process account information
    for (const pattern of accountPatterns) {
      const match = text.match(pattern.regex)
      if (match) {
        pattern.handler(match)
      }
    }

    // Set Opay-specific defaults
    if (result.accountInfo) {
      result.accountInfo.bank_name = "Opay"
      result.accountInfo.account_type = "Digital Wallet"
      result.accountInfo.currency = "NGN"
    }

    // Parse transactions - Multiple Opay transaction patterns
    const transactionPatterns = [
      // Pattern 1: Date Time Description Amount Balance
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s+(.+?)\s+₦?([\d,]+\.?\d*)\s+₦?([\d,]+\.?\d*)/gi,
      
      // Pattern 2: Date Description Reference Amount Type
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([A-Z0-9]{8,})\s+₦?([\d,]+\.?\d*)\s+(Credit|Debit)/gi,
      
      // Pattern 3: Date Description Amount Status
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+₦?([\d,]+\.?\d*)\s+(Successful|Failed|Pending)/gi,
      
      // Pattern 4: Simple Date Description Amount
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+₦?([\d,]+\.?\d*)/gi
    ]

    let transactionCount = 0
    
    for (const pattern of transactionPatterns) {
      const matches = Array.from(text.matchAll(pattern))
      
      for (const match of matches) {
        try {
          const transaction = parseOpayTransaction(match)
          
          if (transaction && isValidOpayTransaction(transaction)) {
            // Check for duplicates
            const isDuplicate = result.transactions.some(existing => 
              existing.date === transaction.date &&
              existing.amount === transaction.amount &&
              existing.description === transaction.description
            )
            
            if (!isDuplicate) {
              result.transactions.push(transaction)
              transactionCount++
            }
          }
        } catch (error) {
          logger.warn("Failed to parse Opay transaction", { 
            error: String(error), 
            match: match[0] 
          })
        }
      }
    }

    logger.info("Opay PDF parsing completed", { 
      accountInfoFound: !!result.accountInfo,
      transactionsFound: transactionCount 
    })

  } catch (error) {
    logger.error("Error parsing Opay PDF text", { error: String(error) })
    throw new Error(`Failed to parse Opay statement: ${error}`)
  }

  return result
}

function parseOpayTransaction(match: RegExpMatchArray): OpayTransaction | null {
  try {
    const date = formatOpayDate(match[1])
    let description = ""
    let amount = 0
    let type: "credit" | "debit" = "debit"
    let time: string | undefined
    let balance_after: number | undefined
    let transaction_reference: string | undefined
    
    if (match.length === 6) {
      // Pattern 1: Date Time Description Amount Balance
      time = normalizeTime(match[2])
      description = match[3].trim()
      amount = parseFloat(match[4].replace(/,/g, ''))
      balance_after = parseFloat(match[5].replace(/,/g, ''))
      type = determineOpayTransactionType(description, amount)
    } else if (match.length === 6 && match[5] && (match[5].toLowerCase() === 'credit' || match[5].toLowerCase() === 'debit')) {
      // Pattern 2: Date Description Reference Amount Type
      description = match[2].trim()
      transaction_reference = match[3]
      amount = parseFloat(match[4].replace(/,/g, ''))
      type = match[5].toLowerCase() as "credit" | "debit"
    } else if (match.length >= 4) {
      // Pattern 3 & 4: Basic patterns
      description = match[2].trim()
      amount = parseFloat(match[3].replace(/,/g, ''))
      type = determineOpayTransactionType(description, amount)
    }

    return {
      date,
      time,
      description,
      type,
      amount: Math.abs(amount),
      balance_after,
      channel: "Opay Mobile App",
      transaction_reference,
      category: categorizeOpayTransaction(description)
    }
  } catch (error) {
    logger.warn("Error parsing individual Opay transaction", { error: String(error) })
    return null
  }
}

function determineOpayTransactionType(description: string, amount: number): "credit" | "debit" {
  const desc = description.toLowerCase()
  
  // Credit indicators
  if (desc.includes('received') || desc.includes('credit') || desc.includes('deposit') ||
      desc.includes('refund') || desc.includes('cashback') || desc.includes('bonus') ||
      desc.includes('salary') || desc.includes('income') || desc.includes('loan disbursement')) {
    return "credit"
  }
  
  // Debit indicators
  if (desc.includes('sent') || desc.includes('paid') || desc.includes('purchase') ||
      desc.includes('withdrawal') || desc.includes('transfer') || desc.includes('bill') ||
      desc.includes('airtime') || desc.includes('data') || desc.includes('loan repayment')) {
    return "debit"
  }
  
  // Default based on common Opay patterns
  if (desc.includes('to') && desc.includes('₦')) {
    return "debit" // Money sent
  }
  
  if (desc.includes('from') && desc.includes('₦')) {
    return "credit" // Money received
  }
  
  // Fallback to amount sign (though Opay usually shows absolute values)
  return amount < 0 ? "debit" : "credit"
}

function formatOpayDate(dateStr: string): string {
  try {
    // Handle various Opay date formats
    const [day, month, year] = dateStr.split('/')
    const fullYear = year.length === 2 ? `20${year}` : year
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

function normalizeTime(timeStr: string): string {
  try {
    // Convert various time formats to HH:MM:SS
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      // Handle 12-hour format
      const [time, period] = timeStr.split(/\s+(AM|PM)/i)
      const [hours, minutes] = time.split(':')
      let hour24 = parseInt(hours)
      
      if (period.toUpperCase() === 'PM' && hour24 !== 12) {
        hour24 += 12
      } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
        hour24 = 0
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
    }
    
    // Already in 24-hour format
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`
    }
    
    return timeStr
  } catch {
    return "00:00:00"
  }
}

function isValidOpayTransaction(transaction: OpayTransaction): boolean {
  return transaction.amount > 0 && 
         transaction.description.length > 2 &&
         transaction.date.match(/^\d{4}-\d{2}-\d{2}$/) !== null
}

// Enhanced categorizer integration
export function updateCategorizerForOpay() {
  const opayCategories = [
    "Wallet Funding",
    "POS Transaction", 
    "Money Transfer",
    "Bill Payment",
    "Airtime/Data",
    "Merchant Payment",
    "Savings",
    "Loan",
    "Investment",
    "Rewards",
    "Refund/Reversal"
  ]
  
  return opayCategories
}