// server/src/utils/categorizer.ts - Enhanced with Opay support
export function categorizeTransaction(description: string): string {
  if (!description) return "Other"
  
  const desc = description.toLowerCase().trim()
  
  // Opay-specific patterns first (more specific)
  if (desc.includes('opay wallet') || desc.includes('wallet topup') || desc.includes('wallet funding') ||
      desc.includes('wallet transfer') || desc.includes('fund wallet')) {
    return "Wallet Funding"
  }
  
  if (desc.includes('opay pos') || desc.includes('pos transaction') || desc.includes('pos withdrawal') ||
      desc.includes('pos payment') || desc.includes('agent pos')) {
    return "POS Transaction"
  }
  
  if (desc.includes('opay transfer') || desc.includes('p2p transfer') || desc.includes('send money') ||
      desc.includes('receive money') || desc.includes('money transfer') || desc.includes('peer to peer')) {
    return "Money Transfer"
  }
  
  if (desc.includes('opay bill') || desc.includes('bill payment') || desc.includes('utility payment') ||
      desc.includes('pay bills') || desc.includes('electricity bill') || desc.includes('water bill')) {
    return "Bill Payment"
  }
  
  if (desc.includes('opay airtime') || desc.includes('airtime purchase') || desc.includes('data purchase') ||
      desc.includes('buy airtime') || desc.includes('buy data') || desc.includes('mobile recharge')) {
    return "Airtime/Data"
  }
  
  if (desc.includes('opay merchant') || desc.includes('merchant payment') || desc.includes('qr payment') ||
      desc.includes('scan to pay') || desc.includes('qr code') || desc.includes('merchant pos')) {
    return "Merchant Payment"
  }
  
  if (desc.includes('opay savings') || desc.includes('ajo savings') || desc.includes('target savings') ||
      desc.includes('savings plan') || desc.includes('auto save') || desc.includes('opay save')) {
    return "Savings"
  }
  
  if (desc.includes('opay loan') || desc.includes('loan disbursement') || desc.includes('loan repayment') ||
      desc.includes('okash') || desc.includes('quick loan') || desc.includes('micro loan')) {
    return "Loan"
  }
  
  if (desc.includes('opay investment') || desc.includes('investment return') || desc.includes('mutual fund') ||
      desc.includes('investment plan') || desc.includes('wealth management')) {
    return "Investment"
  }
  
  if (desc.includes('cashback') || desc.includes('reward') || desc.includes('bonus') ||
      desc.includes('referral bonus') || desc.includes('loyalty points') || desc.includes('promo')) {
    return "Rewards"
  }
  
  if (desc.includes('refund') || desc.includes('reversal') || desc.includes('failed transaction') ||
      desc.includes('cancelled') || desc.includes('reversed') || desc.includes('chargeback')) {
    return "Refund/Reversal"
  }
  
  // Traditional banking patterns
  if (desc.includes('salary') || desc.includes('wage') || desc.includes('payment received') ||
      desc.includes('income') || desc.includes('earning') || desc.includes('freelance') ||
      desc.includes('consulting') || desc.includes('dividend') || desc.includes('interest') ||
      desc.includes('bonus') || desc.includes('commission')) {
    return "Income"
  }
  
  // Food and groceries
  if (desc.includes('shoprite') || desc.includes('spar') || desc.includes('market') || 
      desc.includes('grocery') || desc.includes('food') || desc.includes('restaurant') ||
      desc.includes('eatery') || desc.includes('cafeteria') || desc.includes('canteen') ||
      desc.includes('kfc') || desc.includes('dominos') || desc.includes('chicken republic') ||
      desc.includes('mr biggs') || desc.includes('tantalizers') || desc.includes('sweet sensation') ||
      desc.includes('jumia food') || desc.includes('uber eats') || desc.includes('glovo')) {
    return "Food"
  }
  
  // Transportation
  if (desc.includes('uber') || desc.includes('bolt') || desc.includes('taxi') ||
      desc.includes('bus') || desc.includes('transport') || desc.includes('fuel') ||
      desc.includes('petrol') || desc.includes('gas station') || desc.includes('filling station') ||
      desc.includes('brt') || desc.includes('danfo') || desc.includes('keke') ||
      desc.includes('okada') || desc.includes('car hire') || desc.includes('ride') ||
      desc.includes('gokada') || desc.includes('max.ng') || desc.includes('opride')) {
    return "Transport"
  }
  
  // Shopping and retail
  if (desc.includes('jumia') || desc.includes('konga') || desc.includes('mall') ||
      desc.includes('store') || desc.includes('shop') || desc.includes('purchase') ||
      desc.includes('buy') || desc.includes('clothing') || desc.includes('fashion') ||
      desc.includes('electronics') || desc.includes('computer village') ||
      desc.includes('palms') || desc.includes('ikeja city mall') || desc.includes('game') ||
      desc.includes('amazon') || desc.includes('aliexpress') || desc.includes('jiji')) {
    return "Shopping"
  }
  
  // Bills and utilities (traditional)
  if (desc.includes('phcn') || desc.includes('nepa') || desc.includes('electricity') ||
      desc.includes('water') || desc.includes('dstv') || desc.includes('gotv') ||
      desc.includes('startimes') || desc.includes('cable') || desc.includes('internet') ||
      desc.includes('utility') || desc.includes('bill') || desc.includes('subscription') ||
      desc.includes('netflix') || desc.includes('spotify') || desc.includes('amazon prime') ||
      desc.includes('spectranet') || desc.includes('smile') || desc.includes('swift')) {
    return "Bills"
  }
  
  // Airtime and data (traditional)
  if (desc.includes('airtime') || desc.includes('recharge') || desc.includes('data') ||
      desc.includes('mtn') || desc.includes('glo') || desc.includes('airtel') ||
      desc.includes('9mobile') || desc.includes('etisalat') || desc.includes('topup') ||
      desc.includes('top up') || desc.includes('credit') || desc.includes('load')) {
    return "Airtime"
  }
  
  // Banking and financial services
  if (desc.includes('transfer') || desc.includes('withdrawal') || desc.includes('deposit') ||
      desc.includes('atm') || desc.includes('pos charge') || desc.includes('bank charge') ||
      desc.includes('fee') || desc.includes('commission') || desc.includes('transaction charge') ||
      desc.includes('reversal') || desc.includes('stamp duty') || desc.includes('sms charge')) {
    return "Banking"
  }
  
  // Healthcare
  if (desc.includes('hospital') || desc.includes('clinic') || desc.includes('pharmacy') ||
      desc.includes('doctor') || desc.includes('medical') || desc.includes('health') ||
      desc.includes('medicine') || desc.includes('drug') || desc.includes('treatment') ||
      desc.includes('consultation') || desc.includes('lab test') || desc.includes('x-ray')) {
    return "Healthcare"
  }
  
  // Education
  if (desc.includes('school') || desc.includes('university') || desc.includes('tuition') ||
      desc.includes('education') || desc.includes('book') || desc.includes('course') ||
      desc.includes('training') || desc.includes('workshop') || desc.includes('seminar') ||
      desc.includes('exam') || desc.includes('certification') || desc.includes('udemy') ||
      desc.includes('coursera') || desc.includes('edx')) {
    return "Education"
  }
  
  // Entertainment and lifestyle
  if (desc.includes('cinema') || desc.includes('movie') || desc.includes('game') ||
      desc.includes('sport') || desc.includes('gym') || desc.includes('fitness') ||
      desc.includes('club') || desc.includes('bar') || desc.includes('lounge') ||
      desc.includes('party') || desc.includes('event') || desc.includes('concert') ||
      desc.includes('festival') || desc.includes('recreation') || desc.includes('youtube premium')) {
    return "Entertainment"
  }
  
  // Investment and savings (traditional)
  if (desc.includes('investment') || desc.includes('savings') || desc.includes('mutual fund') ||
      desc.includes('treasury') || desc.includes('bond') || desc.includes('stock') ||
      desc.includes('trading') || desc.includes('forex') || desc.includes('crypto') ||
      desc.includes('bitcoin') || desc.includes('piggybank') || desc.includes('cowrywise') ||
      desc.includes('bamboo') || desc.includes('rise vest') || desc.includes('trove')) {
    return "Investment"
  }
  
  // Insurance
  if (desc.includes('insurance') || desc.includes('premium') || desc.includes('policy') ||
      desc.includes('coverage') || desc.includes('claim') || desc.includes('leadway') ||
      desc.includes('aiico') || desc.includes('axa mansard')) {
    return "Insurance"
  }
  
  // Default category
  return "Other"
}

// Get category color for UI display - Enhanced with Opay categories
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Food': '#FF6B6B',
    'Transport': '#4ECDC4',
    'Shopping': '#45B7D1',
    'Bills': '#96CEB4',
    'Airtime': '#FFEAA7',
    'Banking': '#DDA0DD',
    'Healthcare': '#FF7675',
    'Education': '#74B9FF',
    'Entertainment': '#FD79A8',
    'Income': '#00B894',
    'Investment': '#6C5CE7',
    'Insurance': '#A29BFE',
    'POS Charges': '#FDCB6E',
    // Opay-specific categories
    'Wallet Funding': '#00D2FF',
    'POS Transaction': '#FF6B9D',
    'Money Transfer': '#C471ED',
    'Bill Payment': '#32D74B',
    'Airtime/Data': '#FF9F0A',
    'Merchant Payment': '#5856D6',
    'Savings': '#34C759',
    'Loan': '#FF3B30',
    'Rewards': '#FFD60A',
    'Refund/Reversal': '#8E8E93',
    'Other': '#B2BEC3'
  }
  
  return colors[category] || colors['Other']
}

// Get category icon for UI display - Enhanced with Opay categories
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Food': '🍽️',
    'Transport': '🚗',
    'Shopping': '🛒',
    'Bills': '💡',
    'Airtime': '📱',
    'Banking': '🏦',
    'Healthcare': '🏥',
    'Education': '📚',
    'Entertainment': '🎬',
    'Income': '💰',
    'Investment': '📈',
    'Insurance': '🛡️',
    'POS Charges': '💳',
    // Opay-specific icons
    'Wallet Funding': '💼',
    'POS Transaction': '🏪',
    'Money Transfer': '💸',
    'Bill Payment': '🧾',
    'Airtime/Data': '📲',
    'Merchant Payment': '🛍️',
    'Savings': '🏛️',
    'Loan': '💳',
    'Rewards': '🎁',
    'Refund/Reversal': '↩️',
    'Other': '📋'
  }
  
  return icons[category] || icons['Other']
}

// Enhanced spending insights with Opay categories
export function getCategoryInsight(category: string, amount: number, totalExpenses: number): string {
  const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
  
  const insights: Record<string, (amount: number, percentage: number) => string> = {
    'Food': (amt, pct) => pct > 30 ? 
      `Food is ${pct}% of expenses. Consider meal prep to save ₦${Math.round(amt * 0.2).toLocaleString()}` :
      `Food spending looks healthy at ${pct}% of expenses`,
    
    'Transport': (amt, pct) => pct > 20 ? 
      `Transport costs are high (${pct}%). Try BRT or carpooling to reduce by ₦${Math.round(amt * 0.15).toLocaleString()}` :
      `Transport expenses are manageable at ${pct}%`,
    
    'Shopping': (amt, pct) => pct > 25 ? 
      `Shopping is ${pct}% of expenses. Consider a monthly budget limit` :
      `Shopping habits look balanced`,
    
    'Bills': (amt, pct) => pct > 15 ? 
      `Bills are ${pct}% of expenses. Look for ways to reduce utility costs` :
      `Utility bills are within normal range`,
    
    'Airtime': (amt, pct) => pct > 5 ? 
      `Airtime/data is ${pct}% of expenses. Consider cheaper data plans` :
      `Communication costs are reasonable`,
      
    // Opay-specific insights
    'Wallet Funding': (amt, pct) => 
      `Wallet funding: ₦${Math.round(amt).toLocaleString()} (${pct}%). Good digital banking habits!`,
      
    'Money Transfer': (amt, pct) => pct > 15 ? 
      `P2P transfers are ${pct}% of expenses. Track who you're sending money to` :
      `Money transfers look reasonable at ${pct}%`,
      
    'Merchant Payment': (amt, pct) => 
      `QR/Merchant payments: ${pct}%. You're embracing cashless payments!`,
      
    'POS Transaction': (amt, pct) => pct > 10 ? 
      `POS transactions are ${pct}% of expenses. Consider using bank ATMs for lower fees` :
      `POS usage is within reasonable limits`,
      
    'Rewards': (amt, pct) => 
      `Great! You earned ₦${Math.round(amt).toLocaleString()} in cashbacks and rewards`,
      
    'Loan': (amt, pct) => pct > 20 ? 
      `Loan payments are ${pct}% of expenses. Focus on paying down debt` :
      `Loan obligations are manageable`
  }
  
  return insights[category]?.(amount, percentage) || 
    `${category}: ₦${Math.round(amount).toLocaleString()} (${percentage}% of expenses)`
}