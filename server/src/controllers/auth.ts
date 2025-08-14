import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" })
}

export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body || {}
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" })

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: "User already exists" })

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashed })
    const token = signToken(user.id)
    return res.json({ token })
  } catch (err) {
    return res.status(500).json({ error: "Internal error" })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: "email, password required" })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: "Invalid credentials" })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: "Invalid credentials" })

    const token = signToken(user.id)
    return res.json({ token })
  } catch (err) {
    return res.status(500).json({ error: "Internal error" })
  }
}
