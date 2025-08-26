import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import AccountInfo from "../models/AccountInfo.js";
import Transaction from "../models/Transaction.js";
import logger from "../utils/logger.js";
import { categorizeTransaction } from "../utils/categorizer.js";
import { parseStatementData } from "../utils/parser.js";
import { parsePDFBuffer, isPDFParserAvailable, initializePDFParser, isPDFBuffer } from "../utils/pdfParser.js";
import { parsePDFTextToStructuredData } from "../utils/pdfTextParser.js";
// Ensure uploads directory exists
async function ensureUploadsDirectory() {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
        await fs.access(uploadsDir);
    }
    catch {
        await fs.mkdir(uploadsDir, { recursive: true });
        logger.info("Created uploads directory");
    }
}
// Initialize on startup
ensureUploadsDirectory().catch(error => {
    logger.error("Failed to create uploads directory", { error: String(error) });
});
export const handleFileUpload = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const form = formidable({
            multiples: false,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            uploadDir: './uploads',
            keepExtensions: true,
            filename: (name, ext) => {
                return `statement_${Date.now()}_${userId}${ext}`;
            }
        });
        form.parse(req, async (err, fields, files) => {
            if (err) {
                logger.error("Form parsing error:", { error: err.message, userId });
                return res.status(400).json({ error: "Failed to parse form data", details: err.message });
            }
            let file;
            let filePath = null;
            try {
                file = files.statement?.[0];
                if (!file) {
                    return res.status(400).json({ error: "No file uploaded" });
                }
                filePath = file.filepath;
                if (!filePath) {
                    return res.status(400).json({ error: "Uploaded file is missing path" });
                }
                const buffer = await fs.readFile(filePath);
                const originalFilename = file.originalFilename || 'unknown';
                logger.info("Processing bank statement", {
                    userId,
                    filename: originalFilename,
                    size: file.size,
                });
                let parsedData;
                // Handle different file formats
                if (originalFilename.toLowerCase().endsWith(".json")) {
                    try {
                        const jsonContent = buffer.toString("utf8");
                        parsedData = JSON.parse(jsonContent);
                        // Validate JSON structure
                        if (!parsedData.transactions && !parsedData.accountInfo) {
                            return res.status(400).json({
                                error: "Invalid JSON structure",
                                expected: "JSON should contain 'transactions' and/or 'accountInfo' fields",
                                example: {
                                    bankType: "opay",
                                    accountInfo: { account_name: "John Doe", bank_name: "OPay" },
                                    transactions: [{ date: "2024-01-01", description: "Test", type: "debit", amount: 100 }]
                                }
                            });
                        }
                        logger.info("JSON file parsed successfully", {
                            userId,
                            bankType: parsedData.bankType,
                            transactions: parsedData.transactions?.length || 0
                        });
                    }
                    catch (parseError) {
                        logger.error("JSON parsing failed", { error: parseError.message, userId });
                        return res.status(400).json({
                            error: "Invalid JSON file format",
                            details: parseError.message,
                            suggestion: "Ensure the JSON file is properly formatted"
                        });
                    }
                }
                else if (originalFilename.toLowerCase().endsWith(".csv")) {
                    // Enhanced CSV support for Opay
                    try {
                        const csvContent = buffer.toString("utf8");
                        parsedData = await parseCSVContent(csvContent, originalFilename);
                        logger.info("CSV file parsed successfully", {
                            userId,
                            transactions: parsedData.transactions?.length || 0
                        });
                    }
                    catch (csvError) {
                        logger.error("CSV parsing failed", { error: csvError.message, userId });
                        return res.status(400).json({
                            error: "Failed to parse CSV file",
                            details: csvError.message,
                            suggestion: "Ensure the CSV has the required columns: date, description, type, amount"
                        });
                    }
                }
                else if (originalFilename.toLowerCase().endsWith(".pdf")) {
                    // Enhanced PDF handling
                    if (!isPDFBuffer(buffer)) {
                        return res.status(400).json({
                            error: "Invalid PDF file",
                            details: "The uploaded file doesn't appear to be a valid PDF",
                            suggestion: "Please upload a valid PDF bank statement"
                        });
                    }
                    // Initialize PDF parser if needed
                    if (!isPDFParserAvailable()) {
                        logger.info("PDF parser not available, initializing...", { userId });
                        const initialized = await initializePDFParser();
                        if (!initialized) {
                            const sampleTemplate = createSampleJSONTemplate();
                            return res.status(400).json({
                                error: "PDF parsing temporarily unavailable",
                                details: "PDF processing is currently unavailable. Please try one of these alternatives:",
                                alternatives: [
                                    "Upload your statement as JSON using the template below",
                                    "For Opay: Export transactions from the app as JSON",
                                    "Use manual transaction entry",
                                    "Try again later - we're working on fixing PDF support"
                                ],
                                jsonTemplate: sampleTemplate,
                                supportedBanks: [
                                    "OPay Digital Wallet", "Access Bank", "GTBank", "First Bank",
                                    "Zenith Bank", "UBA", "Fidelity Bank", "Sterling Bank", "Wema Bank"
                                ]
                            });
                        }
                    }
                    try {
                        logger.info("Starting PDF text extraction", { userId, fileSize: buffer.length });
                        const pdfText = await parsePDFBuffer(buffer);
                        if (!pdfText || pdfText.trim().length < 50) {
                            logger.warn("PDF text extraction yielded minimal content", {
                                userId,
                                textLength: pdfText?.length || 0,
                                filename: originalFilename
                            });
                            return res.status(400).json({
                                error: "Could not extract readable text from PDF",
                                details: "The PDF might be image-based, scanned, or encrypted",
                                suggestions: [
                                    "For Opay: Try exporting as JSON from the mobile app",
                                    "For traditional banks: Request a text-based statement",
                                    "Use our JSON template for manual entry",
                                    "Try using OCR software to convert the PDF to text first"
                                ],
                                jsonTemplate: createSampleJSONTemplate()
                            });
                        }
                        logger.info("PDF text extracted successfully", {
                            userId,
                            textLength: pdfText.length,
                            filename: originalFilename
                        });
                        // Parse the extracted text
                        parsedData = await parsePDFTextToStructuredData(pdfText);
                        if (!parsedData.transactions || parsedData.transactions.length === 0) {
                            logger.warn("No transactions found in PDF", { userId, bankType: parsedData.bankType });
                            return res.status(400).json({
                                error: "No transactions found in PDF",
                                details: "The PDF format may not be supported or contains no recognizable transaction data",
                                bankType: parsedData.bankType,
                                suggestions: parsedData.bankType === "opay" ? [
                                    "Opay statements should contain transaction history",
                                    "Try exporting from a different date range",
                                    "Use the JSON template for manual entry",
                                    "Ensure the PDF contains transaction details, not just account summary"
                                ] : [
                                    "Ensure the PDF contains a full statement with transactions",
                                    "The statement format may not be recognized",
                                    "Try a different date range or statement type",
                                    "Use the JSON template for manual entry"
                                ],
                                jsonTemplate: createSampleJSONTemplate(parsedData.bankType)
                            });
                        }
                        logger.info("PDF parsed successfully", {
                            userId,
                            bankType: parsedData.bankType,
                            transactionsFound: parsedData.transactions.length,
                            hasAccountInfo: !!parsedData.accountInfo
                        });
                    }
                    catch (pdfError) {
                        logger.error("PDF parsing failed", {
                            error: pdfError.message,
                            userId,
                            filename: originalFilename,
                            stack: pdfError.stack
                        });
                        return res.status(400).json({
                            error: "Failed to parse PDF bank statement",
                            details: pdfError.message,
                            suggestions: [
                                "Ensure the PDF is not password-protected or encrypted",
                                "For Opay: Try exporting as JSON from the mobile app",
                                "For traditional banks: Request a different statement format",
                                "Use our JSON template for manual entry"
                            ],
                            jsonTemplate: createSampleJSONTemplate()
                        });
                    }
                }
                else {
                    return res.status(400).json({
                        error: "Unsupported file format",
                        supportedFormats: ["JSON (.json)", "PDF (.pdf)", "CSV (.csv)"],
                        received: originalFilename,
                        recommendation: "PDF and JSON formats work best for Opay statements"
                    });
                }
                // Validate parsed data
                if (!parsedData || (!parsedData.transactions?.length && !parsedData.accountInfo)) {
                    return res.status(400).json({
                        error: "No usable data found in file",
                        details: "The file doesn't contain recognizable transaction or account data",
                        bankType: parsedData?.bankType,
                        suggestions: [
                            "Check if the file format matches your bank type",
                            "For Opay: Ensure the statement includes transaction history",
                            "Try uploading a statement with a longer date range",
                            "Use manual transaction entry instead"
                        ]
                    });
                }
                // Process the parsed data
                logger.info("Processing parsed statement data", {
                    userId,
                    bankType: parsedData.bankType,
                    hasAccountInfo: !!parsedData.accountInfo,
                    transactionCount: parsedData.transactions?.length || 0
                });
                const { accountInfo, transactions } = parseStatementData(parsedData);
                let savedTransactions = 0;
                let skippedTransactions = 0;
                let updatedAccountInfo = null;
                // Save account information
                if (accountInfo) {
                    try {
                        const accountData = {
                            userId,
                            account_name: accountInfo.account_name,
                            account_number: accountInfo.account_number,
                            bank_name: accountInfo.bank_name,
                            account_type: accountInfo.account_type,
                            currency: accountInfo.currency || "NGN",
                            statement_period: {
                                start_date: new Date(accountInfo.statement_period.start_date),
                                end_date: new Date(accountInfo.statement_period.end_date),
                            },
                            opening_balance: accountInfo.opening_balance || 0,
                            closing_balance: accountInfo.closing_balance || accountInfo.wallet_balance || 0,
                            total_debits: accountInfo.total_debits || 0,
                            total_credits: accountInfo.total_credits || 0,
                            wallet_balance: accountInfo.wallet_balance || accountInfo.closing_balance || 0,
                            last_updated: new Date(),
                        };
                        updatedAccountInfo = await AccountInfo.findOneAndUpdate({ userId }, accountData, { upsert: true, new: true, runValidators: true });
                        logger.info("Account info saved successfully", {
                            userId,
                            bankName: accountInfo.bank_name,
                            accountType: accountInfo.account_type,
                            bankType: parsedData.bankType
                        });
                    }
                    catch (accountError) {
                        logger.error("Failed to save account info", {
                            error: accountError.message,
                            userId,
                            accountInfo,
                            stack: accountError.stack
                        });
                    }
                }
                // Save transactions with improved duplicate detection
                if (transactions && transactions.length > 0) {
                    logger.info("Processing transactions", {
                        userId,
                        transactionCount: transactions.length,
                        bankType: parsedData.bankType
                    });
                    for (const txn of transactions) {
                        try {
                            // Enhanced duplicate detection
                            const duplicateQuery = await buildDuplicateQuery(userId, txn, parsedData.bankType);
                            const existing = await Transaction.findOne(duplicateQuery);
                            if (existing) {
                                logger.debug("Skipping duplicate transaction", {
                                    userId,
                                    description: txn.description,
                                    amount: txn.amount,
                                    date: txn.date,
                                    existingId: existing._id
                                });
                                skippedTransactions++;
                                continue;
                            }
                            // Create transaction data
                            const transactionData = {
                                userId,
                                date: new Date(txn.date),
                                time: txn.time || new Date().toTimeString().slice(0, 8),
                                description: txn.description || "Bank Statement Transaction",
                                type: txn.type === "credit" ? "credit" : "debit",
                                amount: Math.abs(Number(txn.amount)),
                                balance_after: txn.balance_after || null,
                                channel: txn.channel || (parsedData.bankType === "opay" ? "OPay Mobile App" : "Bank Statement Import"),
                                transaction_reference: txn.transaction_reference || generateTransactionReference(parsedData.bankType),
                                counterparty: txn.counterparty || null,
                                category: txn.category || categorizeTransaction(txn.description || ""),
                            };
                            await Transaction.create(transactionData);
                            savedTransactions++;
                        }
                        catch (txnError) {
                            logger.warn("Failed to save transaction", {
                                error: txnError.message,
                                userId,
                                transaction: {
                                    description: txn.description,
                                    amount: txn.amount,
                                    date: txn.date
                                }
                            });
                            skippedTransactions++;
                        }
                    }
                }
                // Clean up uploaded file
                try {
                    if (filePath) {
                        await fs.unlink(filePath);
                    }
                }
                catch (unlinkError) {
                    logger.warn("Failed to delete uploaded file", {
                        error: unlinkError.message,
                        filePath
                    });
                }
                // Generate success response
                const bankType = parsedData.bankType || "traditional";
                const bankName = parsedData.accountInfo?.bank_name || "Unknown Bank";
                logger.info("Bank statement processing completed successfully", {
                    userId,
                    bankType,
                    bankName,
                    totalTransactions: transactions?.length || 0,
                    savedTransactions,
                    skippedTransactions,
                    hasAccountInfo: !!accountInfo,
                });
                return res.json({
                    success: true,
                    message: `${bankName} statement processed successfully!`,
                    bankType,
                    filename: originalFilename,
                    size: file.size,
                    processed: {
                        total_transactions: transactions?.length || 0,
                        saved_transactions: savedTransactions,
                        skipped_transactions: skippedTransactions,
                        account_info_updated: !!updatedAccountInfo,
                        bank_detected: bankName
                    },
                    ...(savedTransactions === 0 && skippedTransactions > 0 && {
                        warning: "All transactions were duplicates - no new transactions added"
                    }),
                    ...(savedTransactions === 0 && skippedTransactions === 0 && {
                        warning: "No transactions found in the statement"
                    }),
                    ...(bankType === "opay" && {
                        opayNote: "OPay digital wallet statement processed! Your transactions have been automatically categorized."
                    })
                });
            }
            catch (processingError) {
                logger.error("Error processing bank statement", {
                    error: processingError.message,
                    stack: processingError.stack,
                    userId,
                    filename: file?.originalFilename
                });
                // Clean up uploaded file
                if (filePath) {
                    try {
                        await fs.unlink(filePath);
                    }
                    catch (unlinkError) {
                        logger.warn("Failed to delete file after error", { error: String(unlinkError) });
                    }
                }
                return res.status(500).json({
                    error: "Failed to process bank statement",
                    details: processingError.message,
                    suggestion: "Please try again or contact support if the issue persists",
                    supportedFormats: ["PDF", "JSON", "CSV"],
                    support: "Try using JSON format for more reliable results"
                });
            }
        });
    }
    catch (error) {
        logger.error("Unexpected error in handleFileUpload", {
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({
            error: "Internal server error",
            details: "Please try again later or contact support"
        });
    }
};
// Helper function to parse CSV content
async function parseCSVContent(csvContent, filename) {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header and one data row");
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const transactions = [];
    // Map common CSV column names
    const columnMap = {
        date: headers.findIndex(h => h.includes('date') || h.includes('time')),
        description: headers.findIndex(h => h.includes('description') || h.includes('narration') || h.includes('details')),
        amount: headers.findIndex(h => h.includes('amount') || h.includes('value')),
        type: headers.findIndex(h => h.includes('type') || h.includes('credit') || h.includes('debit')),
        balance: headers.findIndex(h => h.includes('balance'))
    };
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length)
            continue;
        try {
            const dateStr = values[columnMap.date] || '';
            const description = values[columnMap.description] || 'CSV Transaction';
            const amountStr = values[columnMap.amount] || '0';
            const typeStr = values[columnMap.type] || '';
            const balanceStr = values[columnMap.balance] || '';
            // Parse amount
            const amount = parseFloat(amountStr.replace(/[₦,]/g, ''));
            if (isNaN(amount) || amount <= 0)
                continue;
            // Parse date
            const date = new Date(dateStr);
            if (isNaN(date.getTime()))
                continue;
            // Determine type
            let type = "debit";
            if (typeStr.toLowerCase().includes('credit') || typeStr.toUpperCase() === 'CR') {
                type = "credit";
            }
            transactions.push({
                date,
                description,
                type,
                amount,
                balance_after: balanceStr ? parseFloat(balanceStr.replace(/[₦,]/g, '')) : null,
                category: categorizeTransaction(description)
            });
        }
        catch (error) {
            logger.warn("Skipping invalid CSV row", { rowIndex: i, error: String(error) });
        }
    }
    // Detect if this looks like an Opay CSV
    const bankType = filename.toLowerCase().includes('opay') ||
        csvContent.toLowerCase().includes('opay') ? "opay" : "traditional";
    return {
        bankType,
        transactions,
        accountInfo: {
            account_name: "CSV Import",
            account_number: "CSV",
            bank_name: bankType === "opay" ? "OPay Digital Services" : "CSV Bank",
            account_type: bankType === "opay" ? "Digital Wallet" : "Account",
            currency: "NGN",
            statement_period: {
                start_date: transactions.length > 0 ? new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))).toISOString().slice(0, 10) : "",
                end_date: transactions.length > 0 ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))).toISOString().slice(0, 10) : ""
            }
        }
    };
}
// Helper function to build duplicate detection query
async function buildDuplicateQuery(userId, txn, bankType) {
    const baseQuery = { userId };
    const conditions = [];
    // Primary: Transaction reference (most reliable)
    if (txn.transaction_reference) {
        conditions.push({ transaction_reference: txn.transaction_reference });
    }
    // Secondary: Exact match on key fields
    conditions.push({
        date: new Date(txn.date),
        amount: Math.abs(Number(txn.amount)),
        description: txn.description,
        type: txn.type === "credit" ? "credit" : "debit"
    });
    // Tertiary: Time-based match for Opay (more precision)
    if (bankType === "opay" && txn.time) {
        conditions.push({
            date: new Date(txn.date),
            time: txn.time,
            amount: Math.abs(Number(txn.amount))
        });
    }
    return {
        ...baseQuery,
        $or: conditions.filter(condition => {
            // Ensure all required fields exist
            return Object.values(condition).every(val => val !== null && val !== undefined && val !== '');
        })
    };
}
// Helper function to generate transaction reference
function generateTransactionReference(bankType) {
    const prefix = bankType === "opay" ? "OP" : "IMP";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
}
// Helper function to create sample JSON template
function createSampleJSONTemplate(bankType = "opay") {
    if (bankType === "opay") {
        return {
            bankType: "opay",
            accountInfo: {
                account_name: "John Doe",
                account_number: "+2348012345678",
                bank_name: "OPay Digital Services",
                account_type: "Digital Wallet",
                currency: "NGN",
                statement_period: {
                    start_date: "2024-01-01",
                    end_date: "2024-01-31"
                },
                wallet_balance: 25000.00
            },
            transactions: [
                {
                    date: "2024-01-15",
                    time: "14:30:00",
                    description: "Transfer to John Smith",
                    type: "debit",
                    amount: 5000.00,
                    category: "Transfer",
                    transaction_reference: "OP123456789",
                    channel: "OPay Mobile App"
                },
                {
                    date: "2024-01-16",
                    time: "09:15:00",
                    description: "Cashback from merchant payment",
                    type: "credit",
                    amount: 100.00,
                    category: "Rewards",
                    transaction_reference: "CB987654321"
                }
            ]
        };
    }
    else {
        return {
            bankType: "traditional",
            accountInfo: {
                account_name: "John Doe",
                account_number: "1234567890",
                bank_name: "Access Bank",
                account_type: "Savings",
                currency: "NGN",
                statement_period: {
                    start_date: "2024-01-01",
                    end_date: "2024-01-31"
                },
                opening_balance: 50000.00,
                closing_balance: 45000.00
            },
            transactions: [
                {
                    date: "2024-01-15",
                    description: "ATM Withdrawal",
                    type: "debit",
                    amount: 5000.00,
                    balance_after: 45000.00,
                    category: "Cash Withdrawal"
                }
            ]
        };
    }
}
// Initialize PDF parser with retry on startup
async function initializePDFParserWithRetry(retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const available = await initializePDFParser();
            if (available) {
                logger.info(`PDF parser initialized successfully on attempt ${i + 1}`);
                return true;
            }
        }
        catch (error) {
            logger.warn(`PDF parser initialization failed on attempt ${i + 1}`, {
                error: String(error)
            });
        }
        if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    logger.warn("PDF parser initialization failed after all retries");
    return false;
}
// Initialize on startup
initializePDFParserWithRetry().then(available => {
    if (available) {
        logger.info("PDF parser ready - supporting OPay and traditional bank statements");
    }
    else {
        logger.info("PDF parser unavailable - users can still upload JSON and CSV files");
    }
}).catch(error => {
    logger.error("Failed to initialize PDF parser", { error: String(error) });
});
//# sourceMappingURL=bankStatement.js.map