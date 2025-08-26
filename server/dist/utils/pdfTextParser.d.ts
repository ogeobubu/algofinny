export interface ParsedStatement {
    accountInfo?: {
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
    };
    transactions: Array<{
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
    }>;
}
export declare function parsePDFTextToStructuredData(text: string): Promise<ParsedStatement>;
