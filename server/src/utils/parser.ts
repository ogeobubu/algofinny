// Utility for parsing different bank statement formats

interface ParsedAccountInfo {
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

interface ParsedTransaction {
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
}

interface ParsedStatement {
  accountInfo?: ParsedAccountInfo
  transactions: ParsedTransaction[]
}

export function parseStatementData(data: any): ParsedStatement {
  // Handle different input formats
  if (data.accountInfo && data.transactions) {
    // Already in the correct format
    return normalizeStatement(data)
  }
  
  // Handle flat structure with account info mixed in
  if (data.account_number && data.statement_data) {
    return parseStructuredFormat(data)
  }
  
  // Handle array of transactions only
  if (Array.isArray(data)) {
    return { transactions: data.map(normalizeTransaction) }
  }
  
  // Handle nested formats from different banks
  if (data.statement || data.transactions) {
    return parseNestedFormat(data)
  }
  
  // Default case - try to extract what we can
  return extractFromUnknownFormat(data)
}

function normalizeStatement(data: ParsedStatement): ParsedStatement {
  return {
    accountInfo: data.accountInfo ? normalizeAccountInfo(data.accountInfo) : undefined,
    transactions: data.transactions.map(normalizeTransaction)
  }
}

function normalizeAccountInfo(info: any): ParsedAccountInfo {
  return {
    account_name: String(info.account_name || info.accountName || info.name || '').trim(),
    account_number: String(info.account_number || info.accountNumber || info.number || '').trim(),
    bank_name: String(info.bank_name || info.bankName || info.bank || '').trim(),
    account_type: String(info.account_type || info.accountType || info.type || 'Savings').trim(),
    currency: String(info.currency || 'NGN'),
    statement_period: {
      start_date: formatDate(info.statement_period?.start_date || info.startDate || info.from),
      end_date: formatDate(info.statement_period?.end_date || info.endDate || info.to)
    },
    opening_balance: parseFloat(String(info.opening_balance || info.openingBalance || '0')),
    closing_balance: parseFloat(String(info.closing_balance || info.closingBalance || '0')),
    total_debits: parseFloat(String(info.total_debits || info.totalDebits || '0')),
    total_credits: parseFloat(String(info.total_credits || info.totalCredits || '0'))
  }
}

function normalizeTransaction(txn: any): ParsedTransaction {
  // Handle various transaction formats
  const amount = parseAmount(txn.amount || txn.debit || txn.credit || 0)
  const type = determineTransactionType(txn, amount)
  
  return {
    date: formatDate(txn.date || txn.transaction_date || txn.valueDate),
    time: txn.time || extractTimeFromDate(txn.date),
    description: String(txn.description || txn.narration || txn.details || txn.memo || '').trim(),
    type,
    amount: Math.abs(amount),
    balance_after: parseFloat(String(txn.balance_after || txn.balance || txn.runningBalance || '0')) || undefined,
    channel: String(txn.channel || txn.source || 'Bank Statement Import').trim(),
    transaction_reference: String(txn.transaction_reference || txn.reference || txn.ref || '').trim() || undefined,
    counterparty: String(txn.counterparty || txn.beneficiary || txn.sender || '').trim() || undefined,
    category: String(txn.category || '').trim() || undefined
  }
}

function parseStructuredFormat(data: any): ParsedStatement {
  const accountInfo: ParsedAccountInfo = {
    account_name: data.account_name || 'Unknown Account',
    account_number: data.account_number,
    bank_name: data.bank_name || 'Unknown Bank',
    account_type: data.account_type || 'Savings',
    currency: data.currency || 'NGN',
    statement_period: {
      start_date: formatDate(data.period_start || data.from_date),
      end_date: formatDate(data.period_end || data.to_date)
    },
    opening_balance: data.opening_balance,
    closing_balance: data.closing_balance
  }
  
  const transactions = (data.statement_data || data.transactions || []).map(normalizeTransaction)
  
  return { accountInfo, transactions }
}

function parseNestedFormat(data: any): ParsedStatement {
  const statement = data.statement || data
  const accountInfo = statement.account_info || statement.accountInfo
  const transactions = statement.transactions || data.transactions || []
  
  return {
    accountInfo: accountInfo ? normalizeAccountInfo(accountInfo) : undefined,
    transactions: transactions.map(normalizeTransaction)
  }
}

function extractFromUnknownFormat(data: any): ParsedStatement {
  // Try to find transactions in various nested structures
  let transactions: any[] = []
  
  const searchKeys = ['transactions', 'statement_data', 'data', 'entries', 'records', 'items']
  for (const key of searchKeys) {
    if (Array.isArray(data[key])) {
      transactions = data[key]
      break
    }
  }
  
  // If no array found, treat the whole object as potential transaction data
  if (transactions.length === 0 && typeof data === 'object') {
    transactions = [data]
  }
  
  return {
    transactions: transactions.map(normalizeTransaction)
  }
}

function parseAmount(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[₦,\s]/g, '')
    return parseFloat(cleaned) || 0
  }
  return 0
}

function determineTransactionType(txn: any, amount: number): "credit" | "debit" {
  // Check explicit type field
  if (txn.type === 'credit' || txn.type === 'debit') {
    return txn.type
  }
  
  // Check for credit/debit amount columns
  if (txn.credit && parseFloat(String(txn.credit)) > 0) return 'credit'
  if (txn.debit && parseFloat(String(txn.debit)) > 0) return 'debit'
  
  // Check transaction indicators in description
  const desc = String(txn.description || txn.narration || '').toLowerCase()
  if (desc.includes('salary') || desc.includes('credit') || desc.includes('deposit') || 
      desc.includes('refund') || desc.includes('reversal')) {
    return 'credit'
  }
  
  // Default based on amount sign (if negative in the data, it's likely a debit)
  return amount < 0 ? 'debit' : 'credit'
}

function formatDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString()
  
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) {
      // Try different date formats
      const dateStr = String(dateValue)
      
      // Handle DD/MM/YYYY or DD-MM-YYYY
      const ddmmyyyy = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
      if (ddmmyyyy) {
        return new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`).toISOString()
      }
      
      // Handle YYYY-MM-DD (ISO format)
      const yyyymmdd = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
      if (yyyymmdd) {
        return new Date(`${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[3].padStart(2, '0')}`).toISOString()
      }
      
      // Fallback to current date
      return new Date().toISOString()
    }
    
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function extractTimeFromDate(dateValue: any): string | undefined {
  if (!dateValue) return undefined
  
  try {
    const date = new Date(dateValue)
    if (!isNaN(date.getTime())) {
      return date.toTimeString().slice(0, 8)
    }
  } catch {
    // ignore
  }
  
  return undefined
}

// Helper function to validate parsed data
export function validateParsedData(data: ParsedStatement): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.transactions || !Array.isArray(data.transactions)) {
    errors.push('No transactions found in the data')
  }
  
  if (data.transactions && data.transactions.length === 0) {
    errors.push('Transaction array is empty')
  }
  
  // Check for required transaction fields
  if (data.transactions) {
    data.transactions.forEach((txn, index) => {
      if (!txn.date) {
        errors.push(`Transaction ${index + 1}: Missing date`)
      }
      if (!txn.amount || txn.amount <= 0) {
        errors.push(`Transaction ${index + 1}: Invalid amount`)
      }
      if (!txn.description || txn.description.trim() === '') {
        errors.push(`Transaction ${index + 1}: Missing description`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}