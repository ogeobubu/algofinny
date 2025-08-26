// server/src/controllers/auth.ts - Fixed TypeScript errors
import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import logger from "../utils/logger.js"
import type { SignOptions } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

interface LoginRequest {
  email: string
  password: string
}

interface SignupRequest {
  email: string
  password: string
  name?: string
}

const signOptions: SignOptions = {
  expiresIn: (isNaN(Number(process.env.JWT_EXPIRES_IN))
    ? process.env.JWT_EXPIRES_IN || "7d"
    : Number(process.env.JWT_EXPIRES_IN)) as SignOptions["expiresIn"]
}


function generateToken(userId: string): string {
  return jwt.sign(
    { userId, sub: userId },
    JWT_SECRET,
    signOptions
  )
}


export async function login(req: Request, res: Response) {
  try {
    const { email, password }: LoginRequest = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["email", "password"]
      })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      logger.warn("Login attempt with non-existent email", { email })
      return res.status(401).json({ error: "Invalid email or password" })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      logger.warn("Login attempt with invalid password", { userId: user._id, email })
      return res.status(401).json({ error: "Invalid email or password" })
    }

    // Generate JWT token
    const token = generateToken(user._id.toString())

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    logger.info("User logged in successfully", { 
      userId: user._id,
      email: user.email,
      name: user.name
    })

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      message: "Login successful"
    })

  } catch (error: any) {
    logger.error("Error in login", { 
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    })
    return res.status(500).json({ 
      error: "Internal server error",
      details: "Login failed"
    })
  }
}

export async function signup(req: Request, res: Response) {
  try {
    const { email, password, name }: SignupRequest = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["email", "password"]
      })
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long"
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      logger.warn("Signup attempt with existing email", { email })
      return res.status(409).json({ error: "User already exists with this email" })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0], // Use part before @ as default name
      createdAt: new Date(),
      lastLogin: new Date()
    })

    // Generate JWT token
    const token = generateToken(user._id.toString())

    logger.info("User signed up successfully", { 
      userId: user._id,
      email: user.email,
      name: user.name
    })

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      message: "Account created successfully"
    })

  } catch (error: any) {
    logger.error("Error in signup", { 
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    })
    
    // Handle duplicate key error (in case of race condition)
    if (error.code === 11000) {
      return res.status(409).json({ error: "User already exists with this email" })
    }
    
    return res.status(500).json({ 
      error: "Internal server error",
      details: "Account creation failed"
    })
  }
}

export async function verifyToken(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId || decoded.sub

    if (!userId) {
      return res.status(403).json({ error: "Invalid token structure" })
    }

    // Get user details
    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      tokenExpiry: new Date(decoded.exp * 1000)
    })

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: "Token expired",
        expired: true,
        expiredAt: error.expiredAt
      })
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: "Invalid token",
        details: error.message
      })
    }

    logger.error("Error in verifyToken", { error: error.message })
    return res.status(500).json({ error: "Token verification failed" })
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as any
    const userId = decoded.userId || decoded.sub

    if (!userId) {
      return res.status(403).json({ error: "Invalid token structure" })
    }

    // Check if user still exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Generate new token
    const newToken = generateToken(userId)

    logger.info("Token refreshed", { userId })

    return res.json({
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      message: "Token refreshed successfully"
    })

  } catch (error: any) {
    logger.error("Error in refreshToken", { error: error.message })
    return res.status(403).json({ 
      error: "Token refresh failed",
      details: error.message
    })
  }
}

export async function logout(req: Request, res: Response) {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // But we can log the action for audit purposes
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        const userId = decoded.userId || decoded.sub
        logger.info("User logged out", { userId })
      } catch {
        // Token might be invalid, but that's okay for logout
      }
    }

    return res.json({ message: "Logged out successfully" })

  } catch (error: any) {
    logger.error("Error in logout", { error: error.message })
    return res.status(500).json({ error: "Logout failed" })
  }
}