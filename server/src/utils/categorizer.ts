/**
 * Categorize a transaction description into a simple category.
 * @param description transaction description text
 * @returns category name
 */
export function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase()

  if (desc.includes("salary") || desc.includes("payroll")) return "Income"
  if (desc.includes("transfer") || desc.includes("neft") || desc.includes("rtgs"))
    return "Transfers"
  if (desc.includes("atm") || desc.includes("withdrawal")) return "Cash Withdrawal"
  if (desc.includes("pos") || desc.includes("purchase")) return "Shopping"
  if (desc.includes("food") || desc.includes("restaurant") || desc.includes("meal"))
    return "Food & Dining"
  if (desc.includes("electricity") || desc.includes("water") || desc.includes("utility"))
    return "Utilities"
  if (desc.includes("loan") || desc.includes("emi")) return "Loans"
  if (desc.includes("school") || desc.includes("tuition") || desc.includes("fees"))
    return "Education"
  if (desc.includes("insurance")) return "Insurance"

  return "Other"
}
