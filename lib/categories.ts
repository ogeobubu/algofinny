export const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Utilities - Mobile",
  "Utilities - Power", 
  "Utilities - Water",
  "Utilities - Internet",
  "Transfer - Incoming",
  "Transfer - Outgoing",
  "Transfer - Self",
  "Entertainment",
  "Healthcare",
  "Education",
  "Investment",
  "Savings",
  "Other"
] as const
export type Category = (typeof DEFAULT_CATEGORIES)[number]
