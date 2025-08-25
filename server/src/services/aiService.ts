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

// Enhanced rule-based advice for when AI is not available
export function generateAdvice(transactions: ITransaction[]): string {
  if (!transactions.length) {
    return "Upload a bank statement or add some transactions to get personalized financial insights!"
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonth = transactions.filter(t => new Date(t.date) >= startOfMonth)

  // Calculate key metrics
  const totalIncome = currentMonth
    .filter(t => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = currentMonth
    .filter(t => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0)

  // Category analysis
  const categorySpending: Record<string, number> = {}
  currentMonth
    .filter(t => t.type === "debit")
    .forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount
    })

  const topCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)[0]

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  // Generate contextual advice
  if (totalIncome === 0 && totalExpenses > 0) {
    return "💡 I notice you have expenses but no recorded income this month. Consider adding your salary or other income sources for better financial tracking."
  }

  if (savingsRate < 10 && totalIncome > 0) {
    const topSpend = topCategory ? topCategory[0] : null
    const topAmount = topCategory ? topCategory[1] : 0
    
    if (topSpend && topAmount > totalIncome * 0.3) {
      return `💰 You're spending ₦${Math.round(topAmount).toLocaleString()} on ${topSpend} (${Math.round((topAmount/totalIncome)*100)}% of income). Consider reducing this by 20% to improve your savings rate.`
    }
    
    return `📊 Your savings rate is ${Math.round(savingsRate)}%. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Start by cutting one unnecessary expense.`
  }

  if (savingsRate >= 20) {
    return `🎉 Excellent! You're saving ${Math.round(savingsRate)}% of your income. Consider investing in Nigerian Treasury Bills or mutual funds for better returns.`
  }

  if (categorySpending['Food'] > totalIncome * 0.25) {
    return `🍽️ Food expenses are ${Math.round((categorySpending['Food']/totalIncome)*100)}% of your income. Meal prepping and cooking at home could save you ₦${Math.round(categorySpending['Food']*0.2).toLocaleString()} monthly.`
  }

  if (categorySpending['Transport'] > totalIncome * 0.15) {
    return `🚗 Transport costs are high at ₦${Math.round(categorySpending['Transport']).toLocaleString()}. Consider carpooling, using BRT, or working from home to reduce these expenses.`
  }

  return `📈 This month: Income ₦${Math.round(totalIncome).toLocaleString()}, Expenses ₦${Math.round(totalExpenses).toLocaleString()}, Savings rate ${Math.round(Math.max(0, savingsRate))}%. ${topCategory ? `Top expense: ${topCategory[0]} (₦${Math.round(topCategory[1]).toLocaleString()})` : 'Keep tracking to get better insights!'}`
}

// Enhanced OpenAI-powered advice with Nigerian context
export async function generateOpenAIAdvice(transactions: ITransaction[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    logger.warn("OpenAI API key not configured, using fallback advice")
    return generateAdvice(transactions)
  }

  try {
    const openai = new OpenAI({ apiKey })
    
    // Prepare transaction summary for analysis
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)

    // Calculate key metrics
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonth = recentTransactions.filter(t => new Date(t.date) >= startOfMonth)
    
    const totalIncome = currentMonth
      .filter(t => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = currentMonth
      .filter(t => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0)

    const categoryBreakdown: Record<string, number> = {}
    currentMonth
      .filter(t => t.type === "debit")
      .forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount
      })

    // Create comprehensive prompt
    const transactionSummary = recentTransactions
      .map(t => `${t.type === 'credit' ? '+' : '-'}₦${t.amount.toLocaleString()} - ${t.category} - ${t.description} (${new Date(t.date).toLocaleDateString()})`)
      .join('\n')

    const categoryText = Object.entries(categoryBreakdown)
      .map(([cat, amount]) => `${cat}: ₦${amount.toLocaleString()}`)
      .join(', ')

    const prompt = `As a financial advisor for Nigerian users, analyze these financial patterns and provide specific, actionable advice:

MONTHLY SUMMARY:
- Income: ₦${totalIncome.toLocaleString()}
- Expenses: ₦${totalExpenses.toLocaleString()}
- Savings Rate: ${totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0}%
- Top Categories: ${categoryText}

RECENT TRANSACTIONS:
${transactionSummary}

Please provide:
1. One specific area for improvement
2. One actionable tip considering Nigerian context (costs, culture, available services)
3. Keep it under 100 words and include specific naira amounts where relevant

Focus on practical advice for Nigerian users (food prices, transport options, local investment opportunities, etc.)`

    logger.info("Sending enhanced prompt to OpenAI", { 
      transactionCount: recentTransactions.length,
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses
    })

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful financial advisor specializing in Nigerian personal finance. Provide practical, culturally relevant advice." 
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const advice = response.choices[0]?.message?.content?.trim()
    
    if (!advice) {
      logger.warn("OpenAI returned empty response")
      return generateAdvice(transactions)
    }

    logger.info("OpenAI advice generated successfully", { 
      adviceLength: advice.length,
      userId: transactions[0]?.userId 
    })
    
    return advice

  } catch (error: any) {
    logger.error("Error generating OpenAI advice", { 
      error: error.message,
      apiKey: !!process.env.OPENAI_API_KEY
    })
    
    // Fallback to rule-based advice
    return generateAdvice(transactions)
  }
}

// DeepSeek integration (placeholder for when DeepSeek API is available)
export async function generateDeepseekAdvice(transactions: ITransaction[]): Promise<string> {
  // For now, use OpenAI as DeepSeek might not have a direct API
  // In the future, you could integrate with DeepSeek's API here
  
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY
  if (!deepseekApiKey) {
    logger.info("DeepSeek API not configured, using OpenAI fallback")
    return generateOpenAIAdvice(transactions)
  }

  // TODO: Implement DeepSeek API integration when available
  // For now, fallback to OpenAI
  return generateOpenAIAdvice(transactions)
}

// Smart advice dispatcher - tries AI first, falls back to rules
export async function getSmartAdvice(transactions: ITransaction[], preferredModel?: 'openai' | 'deepseek' | 'rules'): Promise<{ advice: string, model: string }> {
  try {
    if (preferredModel === 'rules' || !process.env.OPENAI_API_KEY) {
      return {
        advice: generateAdvice(transactions),
        model: 'rules-based'
      }
    }

    if (preferredModel === 'deepseek') {
      return {
        advice: await generateDeepseekAdvice(transactions),
        model: 'deepseek-ai'
      }
    }

    // Default to OpenAI
    return {
      advice: await generateOpenAIAdvice(transactions),
      model: 'openai-gpt-3.5'
    }

  } catch (error: any) {
    logger.error("Smart advice generation failed, using rules fallback", { error: error.message })
    return {
      advice: generateAdvice(transactions),
      model: 'rules-based-fallback'
    }
  }
}