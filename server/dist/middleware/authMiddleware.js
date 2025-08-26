import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
        if (!token) {
            logger.warn("No token provided in request", {
                path: req.path,
                method: req.method,
                headers: Object.keys(req.headers)
            });
            return res.status(401).json({ error: "Access token required" });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId || decoded.sub || decoded.id;
        if (!userId) {
            logger.warn("Token missing userId field", {
                decoded: Object.keys(decoded),
                tokenPrefix: token.substring(0, 20) + "..."
            });
            return res.status(403).json({ error: "Invalid token structure" });
        }
        req.userId = userId;
        logger.debug("Token authenticated successfully", {
            userId,
            path: req.path,
            method: req.method
        });
        return next(); // ✅ explicitly return next()
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            logger.warn("Token expired", { expiredAt: error.expiredAt, path: req.path });
            return res.status(403).json({ error: "Token expired", expired: true });
        }
        if (error.name === "JsonWebTokenError") {
            logger.warn("Invalid JWT token", { message: error.message, path: req.path });
            return res.status(403).json({ error: "Invalid token", details: error.message });
        }
        logger.error("Token verification error", { error: error.message, name: error.name, path: req.path });
        return res.status(403).json({ error: "Token verification failed", details: error.message });
    }
};
// Helper function to get user ID from request (for use in controllers)
export const getUserIdFromRequest = (req) => {
    return req.userId || null;
};
// Helper function to manually extract user ID from token (for backward compatibility)
export const extractUserIdFromToken = (authHeader) => {
    if (!authHeader)
        return null;
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token)
        return null;
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return payload.userId || payload.sub || payload.id || null;
    }
    catch (error) {
        logger.warn("Manual token extraction failed", { error: error.message });
        return null;
    }
};
//# sourceMappingURL=authMiddleware.js.map