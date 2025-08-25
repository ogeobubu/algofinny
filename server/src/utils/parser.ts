import type { ParsedStatement } from "../types/statement"

/**
 * Parse and normalize uploaded statement JSON
 * @param data raw parsed JSON
 * @returns normalized account info + transactions
 */
export function parseStatementData(
  data: ParsedStatement
): {
  accountInfo: ParsedStatement["accountInfo"]
  transactions: NonNullable<ParsedStatement["transactions"]>
} {
  const accountInfo = data.accountInfo ?? undefined
  const transactions = data.transactions ?? []

  return { accountInfo, transactions }
}
