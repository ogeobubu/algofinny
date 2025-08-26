import logger from "./logger.js";
import { categorizeTransaction } from "./categorizer.js";
export async function parsePDFTextToStructuredData(text) {
    const result = { transactions: [] };
    try {
        // Common Nigerian bank patterns
        const patterns = [
            // Account number patterns
            {
                regex: /Account\s*Number[:]?\s*([A-Z0-9-\s]+)/i,
                handler: (match) => {
                    result.accountInfo = result.accountInfo || {};
                    result.accountInfo.account_number = match[1].trim();
                }
            },
            {
                regex: /Account\s*No[:]?\s*([A-Z0-9-\s]+)/i,
                handler: (match) => {
                    result.accountInfo = result.accountInfo || {};
                    result.accountInfo.account_number = match[1].trim();
                }
            },
            // Account name patterns
            {
                regex: /Account\s*Name[:]?\s*([A-Z\s\.]+)/i,
                handler: (match) => {
                    result.accountInfo = result.accountInfo || {};
                    result.accountInfo.account_name = match[1].trim();
                }
            },
            // Bank name patterns
            {
                regex: /Bank\s*Name[:]?\s*([A-Z\s]+)/i,
                handler: (match) => {
                    result.accountInfo = result.accountInfo || {};
                    result.accountInfo.bank_name = match[1].trim();
                }
            },
            // Currency patterns
            {
                regex: /Currency[:]?\s*([A-Z]{3})/i,
                handler: (match) => {
                    result.accountInfo = result.accountInfo || {};
                    result.accountInfo.currency = match[1].trim();
                }
            },
            // Statement period patterns
            {
                regex: /Statement\s*Period[:]?\s*(\d{2}\/\d{2}\/\d{4})\s*to\s*(\d{2}\/\d{2}\/\d{4})/i,
                handler: (match) => {
                    result.accountInfo = result.accountInfo || {};
                    result.accountInfo.statement_period = {
                        start_date: match[1],
                        end_date: match[2]
                    };
                }
            },
            // Balance patterns
            {
                regex: /Opening\s*Balance[:]?\s*([\d,]+\.\d{2})/i,
                handler: (match) => {
                    result.accountInfo = result.accountInfo || {};
                    result.accountInfo.opening_balance = parseFloat(match[1].replace(/,/g, ''));
                }
            },
            {
                regex: /Closing\s*Balance[:]?\s*([\d,]+\.\d{2})/i,
                handler: (match) => {
                    result.accountInfo = result.accountInfo || {};
                    result.accountInfo.closing_balance = parseFloat(match[1].replace(/,/g, ''));
                }
            },
        ];
        // Process patterns
        for (const pattern of patterns) {
            const match = text.match(pattern.regex);
            if (match) {
                pattern.handler(match);
            }
        }
        // Transaction patterns - multiple approaches
        const transactionPatterns = [
            // Pattern 1: Date Description Amount
            /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})/g,
            // Pattern 2: Date Description Reference Amount
            /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Z0-9]+)\s+([\d,]+\.\d{2})/g,
            // Pattern 3: Date Description Debit Credit Balance
            /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g
        ];
        for (const pattern of transactionPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                try {
                    let amount, type, description;
                    if (match.length >= 4) {
                        // Pattern 1 or 2
                        amount = parseFloat(match[match.length - 1].replace(/,/g, ''));
                        description = match[2].trim();
                        type = amount >= 0 ? "credit" : "debit";
                    }
                    else {
                        // Pattern 3
                        const debit = match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0;
                        const credit = match[4] ? parseFloat(match[4].replace(/,/g, '')) : 0;
                        amount = credit > 0 ? credit : -debit;
                        type = credit > 0 ? "credit" : "debit";
                        description = match[2].trim();
                    }
                    const transaction = {
                        date: match[1],
                        description,
                        type,
                        amount: Math.abs(amount),
                        balance_after: match[5] ? parseFloat(match[5].replace(/,/g, '')) : undefined,
                        category: categorizeTransaction(description),
                        transaction_reference: match[3] && match[3].match(/[A-Z0-9]{6,}/) ? match[3] : undefined
                    };
                    // Basic validation to avoid false positives
                    if (transaction.amount > 0 && transaction.description.length > 3) {
                        result.transactions.push(transaction);
                    }
                }
                catch (error) {
                    // Skip invalid transactions
                    continue;
                }
            }
        }
        // Set default values if not found
        if (result.accountInfo) {
            result.accountInfo.currency = result.accountInfo.currency || "NGN";
            result.accountInfo.account_type = result.accountInfo.account_type || "Savings";
        }
    }
    catch (error) {
        logger.error("Error parsing PDF text", { error: String(error) });
        throw error;
    }
    return result;
}
//# sourceMappingURL=pdfTextParser.js.map