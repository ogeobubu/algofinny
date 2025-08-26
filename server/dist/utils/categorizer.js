// server/src/utils/categorizer.ts - Enhanced Nigerian context categorizer
import logger from "./logger.js";
// Nigerian-specific transaction categorization
const categoryPatterns = {
    // Food and Dining
    Food: [
        'restaurant', 'food', 'eating', 'kitchen', 'cafe', 'diner', 'pizza', 'burger',
        'chicken', 'rice', 'beans', 'jollof', 'suya', 'amala', 'eba', 'fufu',
        'mr biggs', 'chicken republic', 'kfc', 'dominos', 'sweet sensation',
        'tantalizers', 'bukka', 'mama put', 'buka', 'canteen', 'food court'
    ],
    // Transportation
    Transport: [
        'uber', 'bolt', 'taxi', 'bus', 'keke', 'okada', 'danfo', 'molue',
        'lagbus', 'brt', 'fuel', 'petrol', 'diesel', 'pms', 'filling station',
        'total', 'mobil', 'oando', 'conoil', 'mrs', 'forte oil', 'aiteo',
        'transport', 'fare', 'trip', 'ride', 'journey', 'travel', 'flight',
        'air peace', 'arik', 'max air', 'azman air', 'overland', 'abc transport'
    ],
    // Shopping
    Shopping: [
        'shopping', 'mall', 'store', 'market', 'supermarket', 'shop',
        'shoprite', 'spar', 'park n shop', 'ebeano', 'grand square',
        'palms', 'ikeja city mall', 'silverbird galleria', 'jabi lake mall',
        'clothes', 'shirt', 'shoe', 'bag', 'dress', 'fashion', 'boutique',
        'jumia', 'konga', 'amazon', 'aliexpress', 'ebay', 'online shopping'
    ],
    // Bills and Utilities
    Bills: [
        'nepa', 'phcn', 'eko disco', 'ikeja disco', 'abuja disco', 'kano disco',
        'electricity', 'light bill', 'power', 'prepaid', 'postpaid',
        'water bill', 'waste management', 'lawma', 'cable tv', 'dstv', 'gotv',
        'startimes', 'multichoice', 'internet', 'wifi', 'broadband',
        'mtn', 'glo', 'airtel', '9mobile', 'spectranet', 'smile', 'ntel'
    ],
    // Airtime and Data
    Airtime: [
        'airtime', 'recharge', 'topup', 'credit', 'data', 'subscription',
        'mtn', 'glo', 'airtel', '9mobile', 'etisalat', 'call credit',
        'phone credit', 'mobile credit', 'sim card', 'line'
    ],
    // Healthcare
    Healthcare: [
        'hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'drug',
        'medicine', 'health', 'dental', 'laboratory', 'lab test',
        'x-ray', 'scan', 'check up', 'consultation', 'treatment',
        'lagos university teaching hospital', 'luth', 'national hospital',
        'medical center', 'health center', 'first aid'
    ],
    // Education
    Education: [
        'school', 'university', 'college', 'tuition', 'fee', 'education',
        'book', 'stationery', 'pen', 'notebook', 'textbook', 'course',
        'training', 'workshop', 'seminar', 'certification', 'exam',
        'unilag', 'ui', 'oau', 'covenant', 'babcock', 'bells university',
        'lead city', 'bowen', 'fountain university', 'school fees',
        'jamb', 'waec', 'neco', 'post utme', 'admission'
    ],
    // Entertainment
    Entertainment: [
        'cinema', 'movie', 'film', 'netflix', 'showmax', 'iroko tv',
        'music', 'spotify', 'apple music', 'audiomack', 'boomplay',
        'club', 'bar', 'lounge', 'party', 'event', 'concert', 'show',
        'genesis deluxe', 'silverbird', 'filmhouse', 'ozone cinemas',
        'game', 'gaming', 'playstation', 'xbox', 'nintendo',
        'bet', 'betting', 'sportybet', 'bet9ja', 'nairabet', '1xbet'
    ],
    // Money Transfer
    Transfer: [
        'transfer', 'send money', 'remittance', 'western union', 'moneygram',
        'ria', 'worldremit', 'sendwave', 'remitly', 'wise', 'paypal',
        'opay transfer', 'kuda transfer', 'gtbank transfer', 'access transfer',
        'family', 'friend', 'relative', 'support', 'help', 'assistance'
    ],
    // Investment and Savings
    Investment: [
        'investment', 'savings', 'fixed deposit', 'treasury bill', 'bond',
        'mutual fund', 'stock', 'shares', 'portfolio', 'dividend',
        'piggyvest', 'cowrywise', 'bamboo', 'trove', 'risevest',
        'stanbic ibtc', 'fbn quest', 'cardinalstone', 'pension',
        'retirement savings', 'rsa', 'pencom'
    ],
    // Fees and Charges
    Fees: [
        'charge', 'fee', 'commission', 'service charge', 'maintenance fee',
        'sms charge', 'stamp duty', 'vat', 'tax', 'cot', 'processing fee',
        'transaction fee', 'transfer fee', 'withdrawal fee', 'card maintenance',
        'annual fee', 'monthly fee', 'account maintenance'
    ],
    // Cash Operations
    Cash: [
        'atm', 'withdrawal', 'deposit', 'cash', 'teller', 'bank hall',
        'pos', 'agent', 'cash deposit', 'cash withdrawal',
        'quickteller', 'gtb atm', 'access atm', 'zenith atm', 'uba atm'
    ],
    // Government and Official
    Government: [
        'tax', 'firs', 'lasirs', 'paye', 'vat', 'customs', 'immigration',
        'passport', 'visa', 'nin', 'drivers license', 'vehicle registration',
        'court', 'fine', 'penalty', 'government', 'ministry', 'agency',
        'lirs', 'birs', 'kirs', 'oirs', 'edirs'
    ],
    // Business
    Business: [
        'supplier', 'vendor', 'contractor', 'business', 'office', 'rent',
        'equipment', 'materials', 'inventory', 'stock', 'wholesale',
        'procurement', 'purchase', 'invoice', 'payment', 'contract'
    ],
    // Personal Care
    'Personal Care': [
        'salon', 'barber', 'spa', 'beauty', 'cosmetics', 'skincare',
        'haircut', 'manicure', 'pedicure', 'massage', 'facial',
        'perfume', 'deodorant', 'soap', 'shampoo', 'lotion'
    ],
    // Charitable/Religious
    Charity: [
        'church', 'mosque', 'temple', 'tithe', 'offering', 'donation',
        'charity', 'zakat', 'sadaqah', 'religious', 'pastor', 'imam',
        'priest', 'collection', 'contribution', 'giving', 'welfare'
    ]
};
// Special Opay transaction patterns
const opayPatterns = {
    'Money Transfer': [
        'transfer to', 'send money', 'money sent', 'p2p transfer',
        'wallet to wallet', 'opay to opay', 'user transfer'
    ],
    'Bill Payment': [
        'bill payment', 'pay bills', 'electricity payment', 'cable tv payment',
        'internet payment', 'water bill payment', 'waste payment'
    ],
    'Airtime': [
        'airtime purchase', 'buy airtime', 'recharge', 'topup airtime',
        'mobile recharge', 'phone credit'
    ],
    'Data': [
        'data purchase', 'buy data', 'data subscription', 'internet data',
        'mobile data', 'data bundle'
    ],
    'Cashback': [
        'cashback', 'reward', 'bonus', 'incentive', 'promotion',
        'refund', 'reversal'
    ],
    'Merchant Payment': [
        'pay merchant', 'pos payment', 'qr payment', 'merchant transaction',
        'store payment', 'shop payment'
    ],
    'Bank Transfer': [
        'transfer to bank', 'bank transfer', 'withdraw to bank',
        'opay to bank', 'send to bank account'
    ],
    'Fund Wallet': [
        'fund wallet', 'add money', 'top up wallet', 'deposit',
        'wallet funding', 'account funding'
    ]
};
export function categorizeTransaction(description) {
    if (!description || typeof description !== 'string') {
        return 'Other';
    }
    const lowerDesc = description.toLowerCase().trim();
    // First check for Opay-specific patterns
    for (const [category, patterns] of Object.entries(opayPatterns)) {
        for (const pattern of patterns) {
            if (lowerDesc.includes(pattern.toLowerCase())) {
                logger.debug('Categorized Opay transaction', { description, category });
                return category;
            }
        }
    }
    // Then check general patterns
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
        for (const pattern of patterns) {
            if (lowerDesc.includes(pattern.toLowerCase())) {
                logger.debug('Categorized transaction', { description, category });
                return category;
            }
        }
    }
    // Special handling for common Nigerian transaction patterns
    if (lowerDesc.includes('reversal') || lowerDesc.includes('refund')) {
        return 'Refund';
    }
    if (lowerDesc.includes('salary') || lowerDesc.includes('wage') || lowerDesc.includes('payment')) {
        return 'Income';
    }
    if (lowerDesc.includes('loan') || lowerDesc.includes('credit facility')) {
        return 'Loan';
    }
    if (lowerDesc.includes('insurance') || lowerDesc.includes('policy')) {
        return 'Insurance';
    }
    if (lowerDesc.includes('rent') || lowerDesc.includes('accommodation')) {
        return 'Housing';
    }
    // Default category
    logger.debug('Transaction categorized as Other', { description });
    return 'Other';
}
// Function to get category color for UI (optional)
export function getCategoryColor(category) {
    const colors = {
        'Food': '#FF6B6B',
        'Transport': '#4ECDC4',
        'Shopping': '#45B7D1',
        'Bills': '#96CEB4',
        'Airtime': '#FFEAA7',
        'Healthcare': '#DDA0DD',
        'Education': '#98D8C8',
        'Entertainment': '#F7DC6F',
        'Transfer': '#BB8FCE',
        'Investment': '#85C1E9',
        'Fees': '#F1948A',
        'Cash': '#82E0AA',
        'Government': '#AED6F1',
        'Business': '#F9E79F',
        'Personal Care': '#D7BDE2',
        'Charity': '#A9DFBF',
        'Money Transfer': '#BB8FCE',
        'Bill Payment': '#96CEB4',
        'Data': '#FDEAA7',
        'Cashback': '#A9DFBF',
        'Merchant Payment': '#85C1E9',
        'Bank Transfer': '#AED6F1',
        'Fund Wallet': '#82E0AA',
        'Refund': '#A9DFBF',
        'Income': '#82E0AA',
        'Loan': '#F1948A',
        'Insurance': '#D7BDE2',
        'Housing': '#98D8C8',
        'Other': '#BDC3C7'
    };
    return colors[category] || colors['Other'];
}
// Function to get all available categories
export function getAvailableCategories() {
    const generalCategories = Object.keys(categoryPatterns);
    const opayCategories = Object.keys(opayPatterns);
    const specialCategories = ['Refund', 'Income', 'Loan', 'Insurance', 'Housing', 'Other'];
    return [...new Set([...generalCategories, ...opayCategories, ...specialCategories])].sort();
}
// Function to suggest category based on amount and type (for manual entry)
export function suggestCategory(description, amount, type) {
    const baseCategory = categorizeTransaction(description);
    const suggestions = [baseCategory];
    // Add contextual suggestions based on transaction type and amount
    if (type === 'credit') {
        if (amount > 50000) {
            suggestions.push('Income', 'Investment', 'Loan');
        }
        else if (amount < 1000) {
            suggestions.push('Cashback', 'Refund', 'Airtime');
        }
    }
    else {
        if (amount > 100000) {
            suggestions.push('Investment', 'Housing', 'Business');
        }
        else if (amount > 20000) {
            suggestions.push('Shopping', 'Bills', 'Healthcare');
        }
        else if (amount < 2000) {
            suggestions.push('Airtime', 'Transport', 'Food');
        }
    }
    // Remove duplicates and return top 3 suggestions
    return [...new Set(suggestions)].slice(0, 3);
}
//# sourceMappingURL=categorizer.js.map