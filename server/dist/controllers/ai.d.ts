import type { Request, Response } from "express";
export declare function getInsights(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getAdvice(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function compareAdvice(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getAIHealth(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getAIModels(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
