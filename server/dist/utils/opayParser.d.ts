export interface OpayTransaction {
    date: string;
    time?: string;
    description: string;
    type: "credit" | "debit";
    amount: number;
    balance_after?: number;
    channel?: string;
    transaction_reference?: string;
    counterparty?: string;
    category?: string;
    transaction_id?: string;
    merchant?: string;
    location?: string;
}
export interface OpayStatement {
    accountInfo: {
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
        total_debits?: number;
        total_credits?: number;
        wallet_balance?: number;
    };
    transactions: OpayTransaction[];
}
export declare function categorizeOpayTransaction(description: string): string;
export declare function parseOpayPDFText(text: string): OpayStatement;
export declare function updateCategorizerForOpay(): string[];
