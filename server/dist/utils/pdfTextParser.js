// server/src/utils/pdfTextParser.ts - Enhanced with Opay support
import { parseOpayPDFText } from "./opayPdfParser.js";
import { categorizeTransaction } from "./categorizer.js";
import logger from "./logger.js";
export async function parsePDFTextToStructuredData(pdfText) {
    logger.info("Starting PDF text parsing", { textLength: pdfText.length });
    // Detect bank type by checking for keywords
    const bankType = detectBankType(pdfText);
    logger.info("Detected bank type", { bankType });
    if (bankType === "opay") {
        return await parseOpayPDFText(pdfText);
    }
    // Parse traditional bank statements
    return await parseTraditionalBankStatement(pdfText);
}
function detectBankType(text) {
    const lowerText = text.toLowerCase();
    // Opay detection keywords
    const opayKeywords = [
        'opay', 'o-pay', 'opera pay', 'opay digital services',
        'wallet balance', 'digital wallet', 'mobile wallet',
        'opay nigeria', 'fintech', 'digital payment'
    ];
    const opayScore = opayKeywords.reduce((score, keyword) => {
        return score + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
    // Traditional bank keywords
    const traditionalKeywords = [
        'access bank', 'gtbank', 'first bank', 'zenith bank',
        'uba', 'fidelity bank', 'sterling bank', 'wema bank',
        'current account', 'savings account', 'account statement',
        'sort code', 'ifsc code'
    ];
    const traditionalScore = traditionalKeywords.reduce((score, keyword) => {
        return score + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
    logger.debug("Bank type detection scores", { opayScore, traditionalScore });
    return opayScore > traditionalScore ? "opay" : "traditional";
}
async function parseTraditionalBankStatement(pdfText) {
    logger.info("Parsing traditional bank statement");
    const lines = pdfText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let accountInfo = {
        account_name: "",
        account_number: "",
        bank_name: "",
        account_type: "Savings",
        currency: "NGN",
        statement_period: {
            start_date: "",
            end_date: ""
        },
        opening_balance: 0,
        closing_balance: 0,
        total_debits: 0,
        total_credits: 0
    };
    const transactions = [];
    // Enhanced patterns for traditional banks
    const patterns = {
        bankName: [
            /(Access Bank|GTBank|First Bank|Zenith Bank|UBA|Fidelity Bank|Sterling Bank|Wema Bank|Union Bank|FCMB)/i,
            /^([A-Z\s&]+BANK[A-Z\s]*)/i
        ],
        accountName: [
            /(?:Account\s+Name|Name):\s*(.+?)(?:\n|$)/i,
            /(?:Customer|Client)\s+Name:\s*(.+?)(?:\n|$)/i
        ],
        accountNumber: [
            /(?:Account\s+Number|A\/C\s+No):\s*(\d{10,})/i,
            /Account:\s*(\d{10,})/i
        ],
        dateRange: [
            /(?:Statement\s+Period|Period|From):\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:to|To|-)\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s*(?:to|To|-)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i
        ],
        balance: [
            /(?:Opening|Starting)\s+Balance:\s*₦?([\d,]+\.?\d*)/i,
            /(?:Closing|Ending)\s+Balance:\s*₦?([\d,]+\.?\d*)/i,
            /Balance\s+(?:B\/F|BF):\s*₦?([\d,]+\.?\d*)/i,
            /Balance\s+(?:C\/F|CF):\s*₦?([\d,]+\.?\d*)/i
        ],
        // Traditional bank transaction patterns
        transactions: [
            // Format: Date | Description | Debit | Credit | Balance
            /^(\d{1,2}\/\d{1,2}\/\d{4})\s*\|\s*(.+?)\s*\|\s*₦?([\d,]*\.?\d*)\s*\|\s*₦?([\d,]*\.?\d*)\s*\|\s*₦?([\d,]+\.?\d*)/i,
            // Format: Date Description Amount Dr/Cr Balance
            /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+₦?([\d,]+\.?\d*)\s+(DR|CR)\s+₦?([\d,]+\.?\d*)/i,
            // Format: Date Description Debit Credit Balance
            /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+₦?([\d,]*\.?\d*)\s+₦?([\d,]*\.?\d*)\s+₦?([\d,]+\.?\d*)/i
        ]
    };
    // Parse account information
    for (const line of lines) {
        // Bank name
        for (const pattern of patterns.bankName) {
            const match = line.match(pattern);
            if (match && !accountInfo.bank_name) {
                accountInfo.bank_name = match[1].trim();
                break;
            }
        }
        // Account name
        for (const pattern of patterns.accountName) {
            const match = line.match(pattern);
            if (match && !accountInfo.account_name) {
                accountInfo.account_name = match[1].trim();
                break;
            }
        }
        // Account number
        for (const pattern of patterns.accountNumber) {
            const match = line.match(pattern);
            if (match && !accountInfo.account_number) {
                accountInfo.account_number = match[1].trim();
                break;
            }
        }
        // Date range
        for (const pattern of patterns.dateRange) {
            const match = line.match(pattern);
            if (match && !accountInfo.statement_period.start_date) {
                accountInfo.statement_period.start_date = match[1];
                accountInfo.statement_period.end_date = match[2];
                break;
            }
        }
        // Balances
        if (line.toLowerCase().includes('opening') && line.includes('₦')) {
            const amount = line.match(/₦?([\d,]+\.?\d*)/)?.[1];
            if (amount)
                accountInfo.opening_balance = parseFloat(amount.replace(/,/g, ''));
        }
        if (line.toLowerCase().includes('closing') && line.includes('₦')) {
            const amount = line.match(/₦?([\d,]+\.?\d*)/)?.[1];
            if (amount)
                accountInfo.closing_balance = parseFloat(amount.replace(/,/g, ''));
        }
    }
    // Parse transactions
    for (const line of lines) {
        for (const pattern of patterns.transactions) {
            const match = line.match(pattern);
            if (match) {
                try {
                    const [, date, description, ...amounts] = match;
                    let debitAmount = 0;
                    let creditAmount = 0;
                    let balance = 0;
                    let type = "debit";
                    // Parse amounts based on pattern
                    if (amounts.length >= 4) {
                        // Format: Date | Description | Debit | Credit | Balance
                        debitAmount = amounts[0] ? parseFloat(amounts[0].replace(/,/g, '')) : 0;
                        creditAmount = amounts[1] ? parseFloat(amounts[1].replace(/,/g, '')) : 0;
                        balance = parseFloat(amounts[2].replace(/,/g, ''));
                    }
                    else if (amounts.length >= 3 && (amounts[1] === 'DR' || amounts[1] === 'CR')) {
                        // Format: Date Description Amount Dr/Cr Balance
                        const amount = parseFloat(amounts[0].replace(/,/g, ''));
                        if (amounts[1] === 'DR') {
                            debitAmount = amount;
                            type = "debit";
                        }
                        else {
                            creditAmount = amount;
                            type = "credit";
                        }
                        balance = parseFloat(amounts[2].replace(/,/g, ''));
                    }
                    else if (amounts.length >= 3) {
                        // Format: Date Description Debit Credit Balance
                        debitAmount = amounts[0] ? parseFloat(amounts[0].replace(/,/g, '')) : 0;
                        creditAmount = amounts[1] ? parseFloat(amounts[1].replace(/,/g, '')) : 0;
                        balance = parseFloat(amounts[2].replace(/,/g, ''));
                    }
                    const transactionAmount = creditAmount || debitAmount;
                    if (transactionAmount <= 0)
                        continue;
                    type = creditAmount > 0 ? "credit" : "debit";
                    // Parse date
                    const [day, month, year] = date.split('/');
                    const transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    const transaction = {
                        date: transactionDate,
                        description: description.trim(),
                        type,
                        amount: transactionAmount,
                        balance_after: balance || null,
                        category: categorizeTransaction(description.trim()),
                        transaction_reference: `TXN${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                        channel: "Bank Statement Import"
                    };
                    transactions.push(transaction);
                    // Update totals
                    if (type === "credit") {
                        accountInfo.total_credits += transactionAmount;
                    }
                    else {
                        accountInfo.total_debits += transactionAmount;
                    }
                    break;
                }
                catch (error) {
                    logger.warn("Error parsing traditional bank transaction", {
                        line,
                        error: error.message
                    });
                }
            }
        }
    }
    // Set fallback values
    if (!accountInfo.bank_name) {
        accountInfo.bank_name = "Unknown Bank";
    }
    if (!accountInfo.account_name) {
        accountInfo.account_name = "Bank Customer";
    }
    if (!accountInfo.statement_period.start_date && transactions.length > 0) {
        const dates = transactions.map(t => new Date(t.date)).sort();
        accountInfo.statement_period.start_date = dates[0].toISOString().slice(0, 10);
        accountInfo.statement_period.end_date = dates[dates.length - 1].toISOString().slice(0, 10);
    }
    logger.info("Traditional bank statement parsing completed", {
        bankName: accountInfo.bank_name,
        accountNumber: accountInfo.account_number,
        transactionCount: transactions.length
    });
    return {
        bankType: "traditional",
        accountInfo,
        transactions
    };
}
//# sourceMappingURL=pdfTextParser.js.map