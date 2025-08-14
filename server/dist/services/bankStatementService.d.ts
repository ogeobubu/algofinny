import type { ITransaction } from "../models/Transaction";
export declare function extractTransactionsFromFile(filePath: string): Promise<ITransaction[]>;
export declare function getDeepseekAdvice(transactions: ITransaction[]): Promise<string>;
