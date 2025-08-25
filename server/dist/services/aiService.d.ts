import type { ITransaction } from "../models/Transaction.js";
export declare function generateAdvice(transactions: ITransaction[]): string;
export declare function generateOpenAIAdvice(transactions: ITransaction[]): Promise<string>;
