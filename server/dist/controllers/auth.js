import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import winston from "winston";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.Console(),
    ],
});
function signToken(userId, email) {
    return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: "7d" });
}
export async function signup(req, res) {
    try {
        logger.info("Signup attempt", { body: { ...req.body, password: "[REDACTED]" } });
        const { name, email, password } = req.body || {};
        // Validation
        if (!email || !password) {
            logger.warn("Signup failed: Missing email or password");
            return res.status(400).json({ error: "email and password are required" });
        }
        if (!name) {
            logger.warn("Signup failed: Missing name");
            return res.status(400).json({ error: "name is required" });
        }
        if (password.length < 6) {
            logger.warn("Signup failed: Password too short");
            return res.status(400).json({ error: "password must be at least 6 characters" });
        }
        // Check if user already exists
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            logger.warn("Signup failed: User already exists", { email });
            return res.status(409).json({ error: "User already exists" });
        }
        // Hash password
        const saltRounds = 12;
        const hashed = await bcrypt.hash(password, saltRounds);
        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashed
        });
        logger.info("User created successfully", {
            userId: user._id,
            email: user.email,
            name: user.name
        });
        // Generate token
        const token = signToken(user._id.toString(), user.email);
        return res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (err) {
        logger.error("Signup error", {
            error: err.message,
            stack: err.stack,
            email: req.body?.email
        });
        // Handle MongoDB duplicate key error
        if (err.code === 11000) {
            return res.status(409).json({ error: "User already exists" });
        }
        return res.status(500).json({ error: "Internal server error" });
    }
}
export async function login(req, res) {
    try {
        logger.info("Login attempt", { email: req.body?.email });
        const { email, password } = req.body || {};
        // Validation
        if (!email || !password) {
            logger.warn("Login failed: Missing email or password");
            return res.status(400).json({ error: "email and password are required" });
        }
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            logger.warn("Login failed: User not found", { email });
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            logger.warn("Login failed: Invalid password", { email, userId: user._id });
            return res.status(401).json({ error: "Invalid credentials" });
        }
        logger.info("User logged in successfully", {
            userId: user._id,
            email: user.email,
            name: user.name
        });
        // Generate token
        const token = signToken(user._id.toString(), user.email);
        return res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (err) {
        logger.error("Login error", {
            error: err.message,
            stack: err.stack,
            email: req.body?.email
        });
        return res.status(500).json({ error: "Internal server error" });
    }
}
//# sourceMappingURL=auth.js.map