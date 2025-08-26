// server/src/utils/categorizer.ts - Enhanced with Opay & Traditional Banking support
export function categorizeTransaction(description) {
    if (!description)
        return "Other";
    const desc = description.toLowerCase().trim();
    // ================== OPay-specific patterns ==================
    if (desc.includes('opay wallet') || desc.includes('wallet topup') || desc.includes('wallet funding') ||
        desc.includes('wallet transfer') || desc.includes('fund wallet')) {
        return "Wallet Funding";
    }
    if (desc.includes('opay pos') || desc.includes('pos transaction') || desc.includes('pos withdrawal') ||
        desc.includes('pos payment') || desc.includes('agent pos')) {
        return "POS Transaction";
    }
    if (desc.includes('opay transfer') || desc.includes('p2p transfer') || desc.includes('send money') ||
        desc.includes('receive money') || desc.includes('money transfer') || desc.includes('peer to peer')) {
        return "Money Transfer";
    }
    if (desc.includes('opay bill') || desc.includes('bill payment') || desc.includes('utility payment') ||
        desc.includes('pay bills') || desc.includes('electricity bill') || desc.includes('water bill')) {
        return "Bill Payment";
    }
    if (desc.includes('opay airtime') || desc.includes('airtime purchase') || desc.includes('data purchase') ||
        desc.includes('buy airtime') || desc.includes('buy data') || desc.includes('mobile recharge')) {
        return "Airtime/Data";
    }
    if (desc.includes('opay merchant') || desc.includes('merchant payment') || desc.includes('qr payment') ||
        desc.includes('scan to pay') || desc.includes('qr code') || desc.includes('merchant pos')) {
        return "Merchant Payment";
    }
    if (desc.includes('opay savings') || desc.includes('ajo savings') || desc.includes('target savings') ||
        desc.includes('savings plan') || desc.includes('auto save') || desc.includes('opay save')) {
        return "Savings";
    }
    if (desc.includes('opay loan') || desc.includes('loan disbursement') || desc.includes('loan repayment') ||
        desc.includes('okash') || desc.includes('quick loan') || desc.includes('micro loan')) {
        return "Loan";
    }
    if (desc.includes('opay investment') || desc.includes('investment return') || desc.includes('mutual fund') ||
        desc.includes('investment plan') || desc.includes('wealth management')) {
        return "Investment";
    }
    if (desc.includes('cashback') || desc.includes('reward') || desc.includes('bonus') ||
        desc.includes('referral bonus') || desc.includes('loyalty points') || desc.includes('promo')) {
        return "Rewards";
    }
    if (desc.includes('refund') || desc.includes('reversal') || desc.includes('failed transaction') ||
        desc.includes('cancelled') || desc.includes('reversed') || desc.includes('chargeback')) {
        return "Refund/Reversal";
    }
    // ================== Traditional banking patterns ==================
    if (desc.includes('salary') || desc.includes('wage') || desc.includes('payment received') ||
        desc.includes('allowance') || desc.includes('stipend') || desc.includes('payroll')) {
        return "Salary/Income";
    }
    if (desc.includes('atm withdrawal') || desc.includes('cash withdrawal') || desc.includes('atm cash') ||
        desc.includes('atm dispense') || desc.includes('debit card withdrawal')) {
        return "ATM Withdrawal";
    }
    if (desc.includes('bank transfer') || desc.includes('neft') || desc.includes('rtgs') ||
        desc.includes('imps') || desc.includes('intrabank') || desc.includes('interbank')) {
        return "Bank Transfer";
    }
    if (desc.includes('debit card') || desc.includes('credit card') || desc.includes('card payment') ||
        desc.includes('pos debit') || desc.includes('online purchase') || desc.includes('card transaction')) {
        return "Card Payment";
    }
    if (desc.includes('loan repayment') || desc.includes('emi') || desc.includes('debt payment') ||
        desc.includes('mortgage') || desc.includes('instalment')) {
        return "Loan Repayment";
    }
    if (desc.includes('school fee') || desc.includes('tuition') || desc.includes('exam fee') ||
        desc.includes('education payment')) {
        return "Education";
    }
    if (desc.includes('hospital') || desc.includes('clinic') || desc.includes('pharmacy') ||
        desc.includes('medical') || desc.includes('health')) {
        return "Healthcare";
    }
    if (desc.includes('supermarket') || desc.includes('grocery') || desc.includes('store purchase') ||
        desc.includes('mall') || desc.includes('shopping')) {
        return "Shopping";
    }
    if (desc.includes('restaurant') || desc.includes('food') || desc.includes('cafe') ||
        desc.includes('bar') || desc.includes('eatery') || desc.includes('meal')) {
        return "Food & Drinks";
    }
    if (desc.includes('transport') || desc.includes('fuel') || desc.includes('bus') ||
        desc.includes('taxi') || desc.includes('ride') || desc.includes('transportation') || desc.includes('car')) {
        return "Transport";
    }
    if (desc.includes('rent') || desc.includes('lease') || desc.includes('accommodation') ||
        desc.includes('housing')) {
        return "Rent/Housing";
    }
    if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('cinema') ||
        desc.includes('concert') || desc.includes('event') || desc.includes('game')) {
        return "Entertainment";
    }
    if (desc.includes('travel') || desc.includes('airline') || desc.includes('ticket') ||
        desc.includes('hotel') || desc.includes('booking') || desc.includes('flight')) {
        return "Travel";
    }
    if (desc.includes('insurance') || desc.includes('premium') || desc.includes('policy')) {
        return "Insurance";
    }
    if (desc.includes('tax') || desc.includes('levy') || desc.includes('government charge')) {
        return "Tax";
    }
    // ================== Default fallback ==================
    return "Other";
}
//# sourceMappingURL=categorizer.js.map