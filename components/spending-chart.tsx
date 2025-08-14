"use client"

import React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { Transaction } from "@/lib/types"
import { getMonthRange } from "@/lib/utils"

export function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const data = React.useMemo(() => {
    const { start, end } = getMonthRange(new Date())
    const thisMonth = transactions.filter(
      (t) => new Date(t.date) >= start && new Date(t.date) <= end && t.type === "expense",
    )
    const byCategory: Record<string, number> = {}
    for (const t of thisMonth) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
    }
    const items = Object.entries(byCategory).map(([name, value]) => ({ name, value }))
    items.sort((a, b) => b.value - a.value)
    return items
  }, [transactions])

  return (
    <ChartContainer
      config={{
        value: { label: "Spent (₦)", color: "hsl(var(--chart-1))" },
      }}
      className="h-[280px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
