import { categorizeTransaction } from "./categorizer.js";
import logger from "./logger.js";
export async function parseOpayPDFText(pdfText) {
    logger.info("Starting Opay PDF parsing", { textLength: pdfText.length });
    const lines = pdfText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // Initialize account info with Opay defaults
    let accountInfo = {
        account_name: "",
        account_number: "",
        bank_name: "OPay Digital Services",
        account_type: "Digital Wallet",
        currency: "NGN",
        statement_period: {
            start_date: "",
            end_date: ""
        },
        wallet_balance: 0,
        opening_balance: 0,
        closing_balance: 0
    };
    const transactions = [];
    // Enhanced patterns for Opay statement parsing
    const patterns = {
        // Account name patterns
        accountName: [
            /(?:Account\s+Name|Name):\s*(.+?)(?:\s|$)/i,
            /(?:Hello|Hi)\s+(.+?)(?:,|\s|$)/i,
            /Wallet\s+Owner:\s*(.+?)(?:\s|$)/i
        ],
        // Phone number (account number for Opay)
        phoneNumber: [
            /(?:Phone|Mobile|Number):\s*(\+?\d{11,14})/i,
            /(\+234\d{10})/,
            /(\d{11})/
        ],
        // Date range patterns
        dateRange: [
            /(?:Statement\s+Period|Period|From):\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:to|-)\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
            /(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/
        ],
        // Balance patterns
        balance: [
            /(?:Current|Wallet|Available)\s+Balance:\s*₦?([\d,]+\.?\d*)/i,
            /Balance:\s*₦?([\d,]+\.?\d*)/i
        ],
        // Transaction patterns (multiple formats)
        transactions: [
            // Format 1: Date | Description | Type | Amount | Balance
            /^(\d{1,2}\/\d{1,2}\/\d{4})\s*\|\s*(.+?)\s*\|\s*(debit|credit|DR|CR)\s*\|\s*₦?([\d,]+\.?\d*)\s*\|\s*₦?([\d,]+\.?\d*)?/i,
            // Format 2: Date Description Type Amount Balance
            /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(debit|credit|DR|CR)\s+₦?([\d,]+\.?\d*)\s*₦?([\d,]+\.?\d*)?$/i,
            // Format 3: Date Time Description Type Amount
            /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s+(.+?)\s+(debit|credit|DR|CR)\s+₦?([\d,]+\.?\d*)/i,
            // Format 4: More flexible pattern
            /(\d{1,2}\/\d{1,2}\/\d{4}).*?([Dd]ebit|[Cc]redit|DR|CR).*?₦?([\d,]+\.?\d*)/i
        ]
    };
    // Extract account information
    for (const line of lines) {
        // Account name
        for (const pattern of patterns.accountName) {
            const match = line.match(pattern);
            if (match && !accountInfo.account_name) {
                accountInfo.account_name = match[1].trim();
                break;
            }
        }
        // Phone number
        for (const pattern of patterns.phoneNumber) {
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
        // Balance
        for (const pattern of patterns.balance) {
            const match = line.match(pattern);
            if (match) {
                const balance = parseFloat(match[1].replace(/,/g, ''));
                accountInfo.wallet_balance = balance;
                accountInfo.closing_balance = balance;
                break;
            }
        }
    }
    // Extract transactions
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns.transactions) {
            const match = line.match(pattern);
            if (match) {
                try {
                    let date;
                    let time = "";
                    let description;
                    let type;
                    let amount;
                    let balance = null;
                    if (match.length >= 6) {
                        // Format with time
                        [, date, time, description, type, amount] = match;
                        if (match[6])
                            balance = parseFloat(match[6].replace(/,/g, ''));
                    }
                    else if (match.length >= 5) {
                        // Format without time
                        [, date, description, type, amount] = match;
                        if (match[5])
                            balance = parseFloat(match[5].replace(/,/g, ''));
                    }
                    else {
                        // Minimal format
                        [, date, type, amount] = match;
                        description = line.replace(match[0], '').trim() || "Opay Transaction";
                    }
                    // Parse and validate data
                    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
                    if (isNaN(parsedAmount) || parsedAmount <= 0)
                        continue;
                    // Normalize type
                    const normalizedType = (type.toLowerCase().includes('credit') || type.toUpperCase() === 'CR')
                        ? 'credit' : 'debit';
                    // Parse date
                    const [day, month, year] = date.split('/');
                    const transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    // Generate transaction reference
                    const reference = `OP${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                    const transaction = {
                        date: transactionDate,
                        time: time || new Date().toTimeString().slice(0, 8),
                        description: description.trim(),
                        type: normalizedType,
                        amount: parsedAmount,
                        balance_after: balance,
                        category: categorizeTransaction(description.trim()),
                        transaction_reference: reference,
                        channel: "OPay Mobile App",
                        counterparty: null
                    };
                    transactions.push(transaction);
                    logger.debug("Parsed Opay transaction", {
                        date,
                        type: normalizedType,
                        amount: parsedAmount,
                        description: description.slice(0, 50)
                    });
                    break; // Stop trying other patterns for this line
                }
                catch (error) {
                    logger.warn("Error parsing Opay transaction line", {
                        line,
                        error: error.message
                    });
                }
            }
        }
    }
    // Fallback values if not found
    if (!accountInfo.account_name) {
        accountInfo.account_name = "OPay User";
    }
    if (!accountInfo.account_number) {
        // Try to extract any phone number from the text
        const phoneMatch = pdfText.match(/\+?234\d{10}|\d{11}/);
        accountInfo.account_number = phoneMatch ? phoneMatch[0] : "Unknown";
    }
    // Set date range if not found
    if (!accountInfo.statement_period.start_date && transactions.length > 0) {
        const dates = transactions.map(t => new Date(t.date)).sort();
        accountInfo.statement_period.start_date = dates[0].toISOString().slice(0, 10);
        accountInfo.statement_period.end_date = dates[dates.length - 1].toISOString().slice(0, 10);
    }
    logger.info("Opay PDF parsing completed", {
        accountName: accountInfo.account_name,
        accountNumber: accountInfo.account_number,
        transactionCount: transactions.length,
        dateRange: `${accountInfo.statement_period.start_date} to ${accountInfo.statement_period.end_date}`
    });
    return {
        bankType: "opay",
        accountInfo,
        transactions
    };
}
//# sourceMappingURL=opayPdfParser.js.map