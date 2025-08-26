// server/src/routes/uploadStatement.ts
import { Request, Response } from "express"
import formidable, { File } from "formidable"
import fs from "fs/promises"
import path from "path"
import AccountInfo from "../models/AccountInfo.js"
import Transaction from "../models/Transaction.js"
import logger from "../utils/logger.js"

// ----------------- Simple Categorizer ----------------- //
function categorizeTransaction(description: string): string {
  if (!description) return "Other"
  const desc = description.toLowerCase().trim()

  if (desc.includes("opay wallet") || desc.includes("wallet topup")) return "Wallet Funding"
  if (desc.includes("opay pos") || desc.includes("pos transaction")) return "POS Transaction"
  if (desc.includes("opay transfer") || desc.includes("p2p transfer")) return "Money Transfer"
  if (desc.includes("bill") || desc.includes("utility")) return "Bill Payment"
  if (desc.includes("airtime") || desc.includes("data")) return "Airtime/Data"
  if (desc.includes("merchant") || desc.includes("qr")) return "Merchant Payment"
  if (desc.includes("savings") || desc.includes("ajo")) return "Savings"
  if (desc.includes("loan") || desc.includes("okash")) return "Loan"
  if (desc.includes("investment") || desc.includes("mutual fund")) return "Investment"
  if (desc.includes("cashback") || desc.includes("bonus")) return "Rewards"
  if (desc.includes("refund") || desc.includes("reversal")) return "Refund/Reversal"
  if (desc.includes("salary") || desc.includes("wage")) return "Salary"
  return "Other"
}

// ----------------- Minimal PDF Parser ----------------- //
let pdfParse: any = null
let PDFDocument: any = null

async function initializePDFParser(): Promise<boolean> {
  try {
    try {
      const pdfLib = await import("pdf-lib")
      PDFDocument = pdfLib.PDFDocument
      logger.info("pdf-lib loaded")
    } catch {}
    try {
      pdfParse = (await import("pdf-parse")).default
      logger.info("pdf-parse loaded")
    } catch {}
    return !!pdfParse || !!PDFDocument
  } catch {
    return false
  }
}

async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  if (pdfParse) {
    const data = await pdfParse(buffer)
    return data.text
  } else if (PDFDocument) {
    const pdfDoc = await PDFDocument.load(buffer)
    return pdfDoc.getPages().map((_, i) => `Page ${i + 1} [no text extraction]`).join("\n")
  }
  throw new Error("No PDF parser available")
}

// ----------------- Simple OPay PDF Parser ----------------- //
async function parseOpayPDFText(text: string) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean)

  // Try to extract account info
  const account_name = lines.find(l => /^Account Name/i.test(l))?.split(":")[1]?.trim() || "OPay Wallet"
  const account_number = lines.find(l => /^Account Number/i.test(l))?.split(":")[1]?.trim() || "Unknown"
  const bank_name = "OPay"
  const account_type = "Wallet"
  const currency = "NGN"

  // Opening / closing balance
  const opening_balance = parseFloat(
    lines.find(l => /^Opening Balance/i.test(l))?.replace(/[^0-9.]/g, "") || "0"
  )
  const closing_balance = parseFloat(
    lines.find(l => /^Closing Balance/i.test(l))?.replace(/[^0-9.]/g, "") || "0"
  )

  // Match transaction rows (example: "2024-07-12 14:30:01 TRANSFER TO JOHN DOE N2000.00 DR BAL: 5300.00 Ref: 123456")
  const transactionRegex =
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(.*?)\s+([0-9,.]+)\s+(CR|DR)\s+BAL:\s*([0-9,.]+)(?:\s+Ref:\s*(\S+))?/i

  const transactions = lines
    .map(line => {
      const match = transactionRegex.exec(line)
      if (!match) return null

      const [, date, time, description, amt, type, bal, ref] = match

      const amount = parseFloat(amt.replace(/,/g, ""))
      const balance_after = parseFloat(bal.replace(/,/g, ""))

      return {
        date,
        time,
        description,
        type: type.toUpperCase() === "CR" ? "credit" : "debit",
        amount,
        balance_after,
        channel: description.includes("POS") ? "POS" : description.includes("TRANSFER") ? "Transfer" : "Wallet",
        transaction_reference: ref || `OPAY${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        counterparty: extractCounterparty(description),
        category: categorizeTransaction(description),
      }
    })
    .filter(Boolean)

  // Calculate totals
  const total_debits = transactions.filter(t => t!.type === "debit").reduce((s, t) => s + t!.amount, 0)
  const total_credits = transactions.filter(t => t!.type === "credit").reduce((s, t) => s + t!.amount, 0)

  return {
    accountInfo: {
      account_name,
      account_number,
      bank_name,
      account_type,
      currency,
      statement_period: {
        start_date: transactions[0]?.date ? new Date(transactions[0].date) : new Date(),
        end_date: transactions.at(-1)?.date ? new Date(transactions.at(-1).date) : new Date(),
      },
      opening_balance,
      closing_balance,
      total_debits,
      total_credits,
    },
    transactions,
  }
}

// Helper to extract counterparty names from description
function extractCounterparty(description: string): string | null {
  if (/to\s+([a-z ]+)/i.test(description)) {
    return description.match(/to\s+([a-z ]+)/i)?.[1] || null
  }
  if (/from\s+([a-z ]+)/i.test(description)) {
    return description.match(/from\s+([a-z ]+)/i)?.[1] || null
  }
  return null
}


// ----------------- Upload Handler ----------------- //
export const handleFileUpload = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    if (!userId) return res.status(401).json({ error: "User not authenticated" })

    const form = formidable({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024,
      uploadDir: "./uploads",
      keepExtensions: true,
    })

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(400).json({ error: "Failed to parse form" })

      const file = files.statement?.[0] as File | undefined
      if (!file) return res.status(400).json({ error: "No file uploaded" })

      const filePath = file.filepath
      const buffer = await fs.readFile(filePath)
      const originalFilename = file.originalFilename || "unknown"

      let parsedData: any

      if (originalFilename.toLowerCase().endsWith(".pdf")) {
        await initializePDFParser()
        const pdfText = await parsePDFBuffer(buffer)

        const isOpay = /opay|okash/i.test(pdfText)
        parsedData = isOpay
          ? await parseOpayPDFText(pdfText)
          : { accountInfo: null, transactions: [] } // fallback

      } else {
        return res.status(400).json({ error: "Unsupported file format" })
      }

      const { accountInfo, transactions } = parsedData

      let savedTransactions = 0
      if (transactions?.length) {
        for (const txn of transactions) {
          const existing = await Transaction.findOne({
            userId,
            date: new Date(txn.date),
            amount: txn.amount,
            description: txn.description,
          })
          if (existing) continue

          await Transaction.create({
            userId,
            ...txn,
            date: new Date(txn.date),
            category: txn.category ?? categorizeTransaction(txn.description),
          })
          savedTransactions++
        }
      }

      if (accountInfo) {
        await AccountInfo.findOneAndUpdate(
          { userId },
          { ...accountInfo, last_updated: new Date() },
          { upsert: true, new: true }
        )
      }

      await fs.unlink(filePath)

      return res.json({
        success: true,
        message: "Statement processed",
        processed: {
          total_transactions: transactions?.length || 0,
          saved_transactions: savedTransactions,
          account_info_updated: !!accountInfo,
        },
      })
    })
  } catch (err: any) {
    logger.error("Upload error", { error: err.message })
    return res.status(500).json({ error: "Internal error" })
  }
}
