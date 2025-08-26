import type { Request, Response } from "express";
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function signup(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function verifyToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function logout(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
