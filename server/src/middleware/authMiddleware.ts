import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import logger from "../utils/logger.js"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

// Extend Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      logger.warn("No token provided in request", { 
        path: req.path,
        method: req.method,
        headers: Object.keys(req.headers)
      })
      return res.status(401).json({ error: "Access token required" })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Extract userId from different possible token structures
    const userId = decoded.userId || decoded.sub || decoded.id
    
    if (!userId) {
      logger.warn("Token missing userId field", { 
        decoded: Object.keys(decoded),
        tokenPrefix: token.substring(0, 20) + "..."
      })
      return res.status(403).json({ error: "Invalid token structure" })
    }

    // Attach userId to request
    req.userId = userId
    
    logger.debug("Token authenticated successfully", { 
      userId,
      path: req.path,
      method: req.method
    })
    
    next()
    
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.warn("Token expired", { 
        expiredAt: error.expiredAt,
        path: req.path 
      })
      return res.status(403).json({ 
        error: "Token expired",
        expired: true
      })
    }
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn("Invalid JWT token", { 
        message: error.message,
        path: req.path
      })
      return res.status(403).json({ 
        error: "Invalid token",
        details: error.message
      })
    }
    
    logger.error("Token verification error", { 
      error: error.message,
      name: error.name,
      path: req.path
    })
    
    return res.status(403).json({ 
      error: "Token verification failed",
      details: error.message
    })
  }
}

// Helper function to get user ID from request (for use in controllers)
export const getUserIdFromRequest = (req: Request): string | null => {
  return req.userId || null
}

// Helper function to manually extract user ID from token (for backward compatibility)
export const extractUserIdFromToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null
  
  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer' || !token) return null
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return payload.userId || payload.sub || payload.id || null
  } catch (error: any) {
    logger.warn("Manual token extraction failed", { error: error.message })
    return null
  }
}