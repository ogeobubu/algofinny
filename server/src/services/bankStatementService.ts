import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { CSVLoader } from "langchain/document_loaders/fs/csv"
import { DeepSeekClient } from "deepseek"
import type { ITransaction } from "../models/Transaction"
import fs from "fs/promises"

export async function extractTransactionsFromFile(filePath: string): Promise<ITransaction[]> {
  if (filePath.endsWith(".pdf")) {
    const loader = new PDFLoader(filePath)
    const docs = await loader.load()
    // TODO: Parse docs to extract transactions
    return []
  } else if (filePath.endsWith(".csv")) {
    const loader = new CSVLoader(filePath)
    const docs = await loader.load()
    // TODO: Parse docs to extract transactions
    return []
  }
  return []
}

export async function getDeepseekAdvice(transactions: ITransaction[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set")
  const client = new DeepSeekClient(apiKey)
  const summary = transactions.slice(0, 10).map(t => `- ${t.type} ₦${t.amount} on ${t.category} (${t.date.toISOString().slice(0,10)})`).join("\n")
  const prompt = `You are a financial advisor. Given these transactions, provide actionable, positive, and personalized financial advice for a Nigerian user.\n\nTransactions:\n${summary}\n\nAdvice:`
  const res = await client.chat({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "You are a helpful financial advisor for Nigerian users." },
      { role: "user", content: prompt },
    ],
    max_tokens: 120,
    temperature: 0.7,
  })
  return res.choices[0]?.message?.content?.trim() || "Could not generate advice."
}
