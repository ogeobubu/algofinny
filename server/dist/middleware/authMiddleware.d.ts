import { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => void | Response;
export declare const getUserIdFromRequest: (req: Request) => string | null;
export declare const extractUserIdFromToken: (authHeader: string | undefined) => string | null;
