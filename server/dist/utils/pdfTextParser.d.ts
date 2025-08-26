export interface ParsedTransaction {
    date: Date | string;
    time?: string;
    description: string;
    type: "credit" | "debit";
    amount: string | number | null;
    balance_after?: string | number | null;
    category?: string;
    transaction_reference?: string;
    channel?: string;
    counterparty?: string | null;
}
export interface ParsedStatement {
    bankType?: "opay" | "traditional";
    accountInfo?: {
        account_name: string;
        account_number: string;
        bank_name: string;
        account_type: string;
        currency: string;
        statement_period: {
            start_date: string;
            end_date: string;
        };
        wallet_balance?: number;
        opening_balance?: number;
        closing_balance?: number;
        total_debits?: number;
        total_credits?: number;
    };
    transactions?: ParsedTransaction[];
}
export declare function parsePDFTextToStructuredData(pdfText: string): Promise<ParsedStatement>;
