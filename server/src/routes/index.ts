// server/src/routes/index.ts
import express from "express"
import cors from "cors"
import helmet from "helmet"
import { authenticateToken } from "../middleware/authMiddleware.js"

// Import controllers
import { login, signup, verifyToken, refreshToken, logout } from "../controllers/auth.js"
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from "../controllers/transactions.js"
import { getInsights, getAdvice, compareAdvice, getAIHealth, getAIModels } from "../controllers/ai.js"
import { handleFileUpload } from "../controllers/bankStatement.js"

const router = express.Router()

// Security middleware
router.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

router.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
}))

// Request logging middleware
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'algofinny-api',
    version: process.env.npm_package_version || '1.0.0'
  })
})

// ===== AUTH ROUTES (no auth required) =====
router.post('/auth/login', login)
router.post('/auth/signup', signup)

// ===== AUTH ROUTES (require existing token) =====
router.post('/auth/verify', authenticateToken, verifyToken)
router.post('/auth/refresh', authenticateToken, refreshToken)
router.post('/auth/logout', authenticateToken, logout)

// ===== TRANSACTION ROUTES (auth required) =====
router.get('/transactions', authenticateToken, listTransactions)
router.post('/transactions', authenticateToken, createTransaction)
router.put('/transactions/:id', authenticateToken, updateTransaction)
router.delete('/transactions/:id', authenticateToken, deleteTransaction)

console.log(authenticateToken)

// ===== AI ROUTES (auth required) =====
router.get('/insights', authenticateToken, getInsights)
router.get('/advice', authenticateToken, getAdvice) // Legacy route
router.post('/advice', authenticateToken, getAdvice) // Support both GET and POST
router.get('/ai/advice', authenticateToken, getAdvice)
router.get('/ai/compare', authenticateToken, compareAdvice)
router.get('/ai/models', authenticateToken, getAIModels)

// ===== AI HEALTH CHECK (no auth - for monitoring) =====
router.get('/ai/health', getAIHealth)

// ===== BANK STATEMENT ROUTES (auth required) =====
router.post('/bank/upload', authenticateToken, handleFileUpload)

// ===== USER PROFILE ROUTES (auth required) =====
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default
    const user = await User.findById(req.userId).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(user.toJSON()) // ✅ use return
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return res.status(500).json({ error: 'Failed to fetch profile' }) // ✅ use return
  }
})


router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default
    const { name, profile } = req.body
    
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    if (name) user.name = name
    if (profile) user.profile = { ...user.profile, ...profile }
    
    await user.save()
    
    return res.json(user.toJSON()) // ✅ explicit return
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return res.status(500).json({ error: 'Failed to update profile' }) // ✅ explicit return
  }
})



// ===== ANALYTICS ROUTES (auth required) =====
router.get('/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const Transaction = (await import('../models/Transaction.js')).default
    const userId = req.userId
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    
    // Get current month data
    const currentMonthTransactions = await Transaction.find({
      userId,
      date: { $gte: startOfMonth }
    })
    
    // Get last month data for comparison
    const lastMonthTransactions = await Transaction.find({
      userId,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    })
    
    const calculateTotals = (transactions: any[]) => {
      const income = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)
      return { income, expenses, savings: income - expenses }
    }
    
    const current = calculateTotals(currentMonthTransactions)
    const previous = calculateTotals(lastMonthTransactions)
    
    res.json({
      current,
      previous,
      comparison: {
        incomeChange: previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0,
        expenseChange: previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : 0,
        savingsChange: previous.savings !== 0 ? ((current.savings - previous.savings) / Math.abs(previous.savings)) * 100 : 0
      },
      totalTransactions: await Transaction.countDocuments({ userId })
    })
    
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// ===== ERROR HANDLING =====
router.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found', 
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

// Global error handler
router.use((error: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', error)
  
  if (res.headersSent) {
    return next(error)
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  })
})

export default router