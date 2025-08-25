import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
import type { ITransaction } from "../models/Transaction.js"
import OpenAI from "openai"
import winston from "winston"

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

export async function extractTransactionsFromFile(
  filePath: string
): Promise<ITransaction[]> {
  try {
    if (filePath.endsWith(".pdf")) {
      const loader = new PDFLoader(filePath)
      const docs = await loader.load()
      // TODO: Implement PDF parsing logic
      logger.info("PDF loaded", { pages: docs.length })
      return []
    } else if (filePath.endsWith(".csv")) {
      const loader = new CSVLoader(filePath)
      const docs = await loader.load()
      // TODO: Implement CSV parsing logic
      logger.info("CSV loaded", { rows: docs.length })
      return []
    }
    return []
  } catch (error: any) {
    logger.error("Error extracting transactions from file", { error: error.message, filePath })
    return []
  }
}

export async function getDeepseekAdvice(transactions: ITransaction[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY // Using OpenAI for now since DeepSeek client might not be available
  if (!apiKey) {
    logger.warn("No OpenAI API key provided, returning fallback advice")
    return "Connect your OpenAI API key to get AI-powered financial advice!"
  }
  
  try {
    const openai = new OpenAI({ apiKey })
    const summary = transactions.slice(0, 10).map(t => 
      `- ${t.type} ₦${t.amount} on ${t.category} (${t.date.toISOString().slice(0,10)})`
    ).join("\n")
    
    const prompt = `You are a financial advisor for Nigerian users. Given these recent transactions, provide actionable, positive, and personalized financial advice.\n\nTransactions:\n${summary}\n\nProvide specific advice in Nigerian context:`
    
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful financial advisor specializing in Nigerian financial habits and economy." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    })
    
    const advice = res.choices[0]?.message?.content?.trim() || "Could not generate advice at this time."
    logger.info("DeepSeek advice generated via OpenAI", { advice })
    return advice
  } catch (error: any) {
    logger.error("Error generating AI advice", { error: error.message })
    return "Unable to generate AI advice at the moment. Please try again later."
  }
}