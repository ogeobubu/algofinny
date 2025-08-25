// Enhanced transaction categorization for Nigerian context
export function categorizeTransaction(description: string): string {
  if (!description) return "Other"
  
  const desc = description.toLowerCase().trim()
  
  // Food and groceries
  if (desc.includes('shoprite') || desc.includes('spar') || desc.includes('market') || 
      desc.includes('grocery') || desc.includes('food') || desc.includes('restaurant') ||
      desc.includes('eatery') || desc.includes('cafeteria') || desc.includes('canteen') ||
      desc.includes('kfc') || desc.includes('dominos') || desc.includes('chicken republic') ||
      desc.includes('mr biggs') || desc.includes('tantalizers') || desc.includes('sweet sensation')) {
    return "Food"
  }
  
  // Transportation
  if (desc.includes('uber') || desc.includes('bolt') || desc.includes('taxi') ||
      desc.includes('bus') || desc.includes('transport') || desc.includes('fuel') ||
      desc.includes('petrol') || desc.includes('gas station') || desc.includes('filling station') ||
      desc.includes('brt') || desc.includes('danfo') || desc.includes('keke') ||
      desc.includes('okada') || desc.includes('car hire') || desc.includes('ride')) {
    return "Transport"
  }
  
  // Shopping and retail
  if (desc.includes('jumia') || desc.includes('konga') || desc.includes('mall') ||
      desc.includes('store') || desc.includes('shop') || desc.includes('purchase') ||
      desc.includes('buy') || desc.includes('clothing') || desc.includes('fashion') ||
      desc.includes('electronics') || desc.includes('computer village') ||
      desc.includes('palms') || desc.includes('ikeja city mall') || desc.includes('game')) {
    return "Shopping"
  }
  
  // Bills and utilities
  if (desc.includes('phcn') || desc.includes('nepa') || desc.includes('electricity') ||
      desc.includes('water') || desc.includes('dstv') || desc.includes('gotv') ||
      desc.includes('startimes') || desc.includes('cable') || desc.includes('internet') ||
      desc.includes('utility') || desc.includes('bill') || desc.includes('subscription') ||
      desc.includes('netflix') || desc.includes('spotify') || desc.includes('amazon prime')) {
    return "Bills"
  }
  
  // Airtime and data
  if (desc.includes('airtime') || desc.includes('recharge') || desc.includes('data') ||
      desc.includes('mtn') || desc.includes('glo') || desc.includes('airtel') ||
      desc.includes('9mobile') || desc.includes('etisalat') || desc.includes('topup') ||
      desc.includes('top up') || desc.includes('credit') || desc.includes('load')) {
    return "Airtime"
  }
  
  // Banking and financial services
  if (desc.includes('transfer') || desc.includes('withdrawal') || desc.includes('deposit') ||
      desc.includes('atm') || desc.includes('pos') || desc.includes('charge') ||
      desc.includes('fee') || desc.includes('commission') || desc.includes('bank') ||
      desc.includes('transaction') || desc.includes('reversal') || desc.includes('refund')) {
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
      desc.includes('exam') || desc.includes('certification')) {
    return "Education"
  }
  
  // Entertainment and lifestyle
  if (desc.includes('cinema') || desc.includes('movie') || desc.includes('game') ||
      desc.includes('sport') || desc.includes('gym') || desc.includes('fitness') ||
      desc.includes('club') || desc.includes('bar') || desc.includes('lounge') ||
      desc.includes('party') || desc.includes('event') || desc.includes('concert') ||
      desc.includes('festival') || desc.includes('recreation')) {
    return "Entertainment"
  }
  
  // Income sources
  if (desc.includes('salary') || desc.includes('wage') || desc.includes('payment') ||
      desc.includes('income') || desc.includes('earning') || desc.includes('freelance') ||
      desc.includes('consulting') || desc.includes('dividend') || desc.includes('interest') ||
      desc.includes('bonus') || desc.includes('commission') || desc.includes('refund')) {
    return "Income"
  }
  
  // Investment and savings
  if (desc.includes('investment') || desc.includes('savings') || desc.includes('mutual fund') ||
      desc.includes('treasury') || desc.includes('bond') || desc.includes('stock') ||
      desc.includes('trading') || desc.includes('forex') || desc.includes('crypto') ||
      desc.includes('bitcoin') || desc.includes('piggybank') || desc.includes('cowrywise')) {
    return "Investment"
  }
  
  // Insurance
  if (desc.includes('insurance') || desc.includes('premium') || desc.includes('policy') ||
      desc.includes('coverage') || desc.includes('claim')) {
    return "Insurance"
  }
  
  // POS and cash-related
  if (desc.includes('pos') || desc.includes('cash deposit') || desc.includes('cash withdrawal') ||
      desc.includes('agent') || desc.includes('kiosk')) {
    return "POS Charges"
  }
  
  // Default category
  return "Other"
}

// Get category color for UI display
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
    'Other': '#B2BEC3'
  }
  
  return colors[category] || colors['Other']
}

// Get category icon for UI display
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
    'Other': '📋'
  }
  
  return icons[category] || icons['Other']
}

// Get spending insights for a category
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
      `Communication costs are reasonable`
  }
  
  return insights[category]?.(amount, percentage) || 
    `${category}: ₦${Math.round(amount).toLocaleString()} (${percentage}% of expenses)`
}