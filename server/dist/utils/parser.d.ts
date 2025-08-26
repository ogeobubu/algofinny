import { ParsedStatement } from "./pdfTextParser.js";
export interface ProcessedAccountInfo {
    account_name: string;
    account_number: string;
    bank_name: string;
    account_type: string;
    currency: string;
    statement_period: {
        start_date: string;
        end_date: string;
    };
    opening_balance?: number;
    closing_balance?: number;
    wallet_balance?: number;
    total_debits?: number;
    total_credits?: number;
}
export interface ProcessedTransaction {
    date: Date | string;
    time?: string;
    description: string;
    type: "credit" | "debit";
    amount: number;
    balance_after?: number | null;
    category: string;
    transaction_reference?: string;
    channel?: string;
    counterparty?: string | null;
}
export interface ParsedData {
    accountInfo?: ProcessedAccountInfo;
    transactions: ProcessedTransaction[];
}
export declare function parseStatementData(parsedStatement: ParsedStatement): ParsedData;
export declare function validateParsedStatement(parsedStatement: any): parsedStatement is ParsedStatement;
export declare function sanitizeParsedStatement(parsedStatement: ParsedStatement): ParsedStatement;
