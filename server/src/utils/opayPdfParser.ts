import { ParsedStatement } from "./pdfTextParser.js"

export async function parseOpayPDFText(pdfText: string): Promise<ParsedStatement> {
  const lines = pdfText.split("\n").map(l => l.trim()).filter(Boolean)

  const accountInfo = {
    account_name: "OPay Wallet",
    account_number: "Virtual",
    bank_name: "OPay Digital Services",
    account_type: "Wallet",
    currency: "NGN",
    statement_period: {
      start_date: "",
      end_date: ""
    }
  }

  const transactions: any[] = []
  // Example format: 12/01/2024  Airtime Purchase  debit  2,000.00  10,000.00
  const txnRegex = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(debit|credit)\s+([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?$/

  for (const line of lines) {
    const match = txnRegex.exec(line)
    if (match) {
      const [, date, description, type, amount, balance] = match
      transactions.push({
        date: new Date(date),
        description,
        type,
        amount: parseFloat(amount.replace(/,/g, "")),
        balance_after: balance ? parseFloat(balance.replace(/,/g, "")) : null,
        category: "Other"
      })
    }
  }

  return { accountInfo, transactions }
}
