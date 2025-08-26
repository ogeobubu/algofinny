interface ParsedAccountInfo {
    account_name: string;
    account_number: string;
    bank_name: string;
    account_type: string;
    currency?: string;
    statement_period: {
        start_date: string;
        end_date: string;
    };
    opening_balance?: number;
    closing_balance?: number;
    total_debits?: number;
    total_credits?: number;
}
interface ParsedTransaction {
    date: string;
    time?: string;
    description?: string;
    type?: "credit" | "debit";
    amount: number;
    balance_after?: number;
    channel?: string;
    transaction_reference?: string;
    counterparty?: string;
    category?: string;
}
interface ParsedStatement {
    accountInfo?: ParsedAccountInfo;
    transactions: ParsedTransaction[];
}
export declare function parseStatementData(data: any): ParsedStatement;
export declare function validateParsedData(data: ParsedStatement): {
    isValid: boolean;
    errors: string[];
};
export {};
