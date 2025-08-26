import type { ITransaction } from "../models/Transaction.js";
export declare function generateAdvice(transactions: ITransaction[]): string;
export declare function generateOpenAIAdvice(transactions: ITransaction[]): Promise<string>;
export declare function generateDeepseekAdvice(transactions: ITransaction[]): Promise<string>;
export declare function getSmartAdvice(transactions: ITransaction[], preferredModel?: 'openai' | 'deepseek' | 'rules'): Promise<{
    advice: string;
    model: string;
}>;
