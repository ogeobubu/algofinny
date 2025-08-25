import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import Transaction from "../models/Transaction.js"
import { generateAdvice, generateOpenAIAdvice, generateDeepseekAdvice, getSmartAdvice } from "../services/aiService.js"
import winston from "winston"

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

// Helper to get user ID from JWT token
function getUserId(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  
  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer' || !token) return null
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return payload.sub || payload.userId
  } catch (error: any) {
    logger.warn("Invalid JWT token", { error: error.message })
    return null
  }
}

// Endpoint to get financial insights and metrics
export async function getInsights(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const transactions = await Transaction.find({ userId }).sort({ date: -1 })
    
    if (!transactions.length) {
      return res.json({ 
        advice: "Add transactions to get personalized insights",
        insights: {
          totalTransactions: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          savingsRate: 0,
          topCategories: []
        }
      })
    }

    // Calculate insights
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth)
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0)
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0)

    const categorySpending: Record<string, number> = {}
    monthlyTransactions
      .filter(t => t.type === "debit")
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount
      })

    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }))

    const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0

    // Generate smart advice
    const { advice, model } = await getSmartAdvice(transactions)

    const insights = {
      totalTransactions: transactions.length,
      monthlyTransactions: monthlyTransactions.length,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      topCategories,
      period: {
        start: startOfMonth.toISOString(),
        end: now.toISOString()
      }
    }

    logger.info("Insights generated", { 
      userId, 
      totalTransactions: transactions.length,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      model
    })

    return res.json({ 
      advice,
      model,
      insights,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    logger.error("Error in getInsights", { error: error.message })
    return res.status(500).json({ 
      error: "Failed to generate insights",
      details: error.message
    })
  }
}

// Main advice endpoint with smart model selection
export async function getAdvice(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      logger.warn("Unauthorized advice request")
      return res.status(401).json({ error: "Unauthorized - valid token required" })
    }

    // Get model preference from query params
    const model = req.query.model as 'openai' | 'deepseek' | 'rules' | undefined
    const useOpenAI = req.query.openai === "true" // Legacy support
    const forceRules = req.query.rules === "true"

    logger.info("Advice request received", { userId, model, useOpenAI, forceRules })

    // Fetch user's transactions
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(100) // Get recent transactions for better analysis

    if (!transactions.length) {
      return res.json({ 
        advice: "Welcome to AlgoFinny! Upload a bank statement or add some transactions to get personalized AI-powered financial advice.",
        model: "welcome-message",
        transactionCount: 0
      })
    }

    let advice: string
    let usedModel: string

    // Determine which model to use
    if (forceRules) {
      advice = generateAdvice(transactions)
      usedModel = "rules-based"
    } else if (useOpenAI || model === 'openai') {
      try {
        advice = await generateOpenAIAdvice(transactions)
        usedModel = "openai-gpt-3.5"
      } catch (error) {
        logger.warn("OpenAI failed, falling back to rules", { error: String(error) })
        advice = generateAdvice(transactions)
        usedModel = "rules-based-fallback"
      }
    } else if (model === 'deepseek') {
      try {
        advice = await generateDeepseekAdvice(transactions)
        usedModel = "deepseek-ai"
      } catch (error) {
        logger.warn("DeepSeek failed, falling back to rules", { error: String(error) })
        advice = generateAdvice(transactions)
        usedModel = "rules-based-fallback"
      }
    } else {
      // Smart selection based on available APIs
      const result = await getSmartAdvice(transactions)
      advice = result.advice
      usedModel = result.model
    }

    logger.info("Advice generated successfully", { 
      userId, 
      model: usedModel, 
      transactionCount: transactions.length,
      adviceLength: advice.length
    })

    return res.json({ 
      advice,
      model: usedModel,
      transactionCount: transactions.length,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    logger.error("Error in getAdvice", { error: error.message, stack: error.stack })
    return res.status(500).json({ 
      error: "Failed to generate financial advice",
      details: error.message
    })
  }
}

// Endpoint for comparing different AI models
export async function compareAdvice(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(50)
    
    if (!transactions.length) {
      return res.json({ 
        error: "No transactions found",
        message: "Add some transactions to compare AI advice models"
      })
    }

    logger.info("Comparing advice models", { userId, transactionCount: transactions.length })

    const results = await Promise.allSettled([
      Promise.resolve({ advice: generateAdvice(transactions), model: "rules-based" }),
      generateOpenAIAdvice(transactions).then(advice => ({ advice, model: "openai-gpt-3.5" })),
      generateDeepseekAdvice(transactions).then(advice => ({ advice, model: "deepseek-ai" }))
    ])

    const comparison = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        const models = ["rules-based", "openai-gpt-3.5", "deepseek-ai"]
        return {
          model: models[index],
          advice: `Error generating advice: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
          error: true
        }
      }
    })

    return res.json({ 
      comparison,
      transactionCount: transactions.length,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    logger.error("Error in compareAdvice", { error: error.message })
    return res.status(500).json({ 
      error: "Failed to compare advice models",
      details: error.message
    })
  }
}

// Health check endpoint for AI services
export async function getAIHealth(req: Request, res: Response) {
  try {
    const testTransactions = [
      {
        description: "Test transaction",
        amount: 100,
        type: "debit",
        category: "Food",
        date: new Date()
      }
    ] as any[]

    const healthChecks = await Promise.allSettled([
      // Test rules-based (should always work)
      Promise.resolve({ model: "rules-based", status: "healthy", response: generateAdvice(testTransactions) }),
      
      // Test OpenAI
      generateOpenAIAdvice(testTransactions)
        .then(advice => ({ model: "openai", status: "healthy", response: advice.slice(0, 100) + "..." }))
        .catch(error => ({ model: "openai", status: "unhealthy", error: error.message })),
      
      // Test DeepSeek
      generateDeepseekAdvice(testTransactions)
        .then(advice => ({ model: "deepseek", status: "healthy", response: advice.slice(0, 100) + "..." }))
        .catch(error => ({ model: "deepseek", status: "unhealthy", error: error.message }))
    ])

    const status = {
      rulesBased: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : { model: "rules-based", status: "unhealthy" },
      openai: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : { model: "openai", status: "unhealthy", error: healthChecks[1].reason },
      deepseek: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : { model: "deepseek", status: "unhealthy", error: healthChecks[2].reason }
    }

    return res.json({
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    })

  } catch (error: any) {
    logger.error("Error in AI health check", { error: error.message })
    return res.status(500).json({ 
      error: "Failed to check AI service health",
      details: error.message
    })
  }
}

// Endpoint to get available AI models
export async function getAIModels(req: Request, res: Response) {
  try {
    const models = [
      {
        id: "rules-based",
        name: "Rules-Based Engine",
        description: "Fast, reliable advice based on predefined financial rules",
        available: true,
        free: true,
        features: ["instant response", "no API required", "basic insights"]
      },
      {
        id: "openai-gpt-3.5",
        name: "OpenAI GPT-3.5 Turbo",
        description: "Advanced AI-powered financial advice using OpenAI's GPT-3.5",
        available: !!process.env.OPENAI_API_KEY,
        free: false,
        features: ["advanced insights", "natural language", "contextual advice"]
      },
      {
        id: "deepseek-ai",
        name: "DeepSeek AI",
        description: "Cutting-edge financial advice using DeepSeek's AI model",
        available: !!process.env.DEEPSEEK_API_KEY,
        free: false,
        features: ["latest AI technology", "detailed analysis", "personalized recommendations"]
      }
    ]

    return res.json({
      models,
      defaultModel: "rules-based",
      smartSelection: true,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    logger.error("Error getting AI models", { error: error.message })
    return res.status(500).json({ 
      error: "Failed to retrieve AI models",
      details: error.message
    })
  }
}