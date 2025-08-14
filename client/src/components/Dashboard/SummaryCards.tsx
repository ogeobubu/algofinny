import React from "react"
import { SimpleGrid, Stat, StatLabel, StatNumber, Box } from "@chakra-ui/react"
import type { Transaction } from "../../../types"

export function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const { balance, income, expenses } = React.useMemo(() => {
    let income = 0
    let expenses = 0
    for (const t of transactions) {
      if (t.type === "income") income += t.amount
      else expenses += t.amount
    }
    const balance = income - expenses
    return { balance, income, expenses }
  }, [transactions])

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Stat p={4} borderWidth="1px" borderRadius="lg" bg="white">
          <StatLabel>Total Balance</StatLabel>
          <StatNumber>{fmt(balance)}</StatNumber>
        </Stat>
        <Stat p={4} borderWidth="1px" borderRadius="lg" bg="white">
          <StatLabel>Total Income</StatLabel>
          <StatNumber>{fmt(income)}</StatNumber>
        </Stat>
        <Stat p={4} borderWidth="1px" borderRadius="lg" bg="white">
          <StatLabel>Total Expenses</StatLabel>
          <StatNumber>{fmt(expenses)}</StatNumber>
        </Stat>
      </SimpleGrid>
    </Box>
  )
}

export default SummaryCards
