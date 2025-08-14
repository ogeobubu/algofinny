"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Transaction } from "@/lib/types"
import { formatCurrency, getMonthRange } from "@/lib/utils"

export function SummaryCards({ transactions, loading }: { transactions: Transaction[]; loading: boolean }) {
  const monthly = React.useMemo(() => {
    const { start, end } = getMonthRange(new Date())
    const thisMonth = transactions.filter((t) => new Date(t.date) >= start && new Date(t.date) <= end)
    const income = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expenses = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const balance = transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0)
    const savings = income - expenses
    const goal = Math.max(1, Math.round(income * 0.2))
    const progress = Math.max(0, Math.min(100, Math.round((savings / goal) * 100)))
    return { income, expenses, balance, savings, goal, progress }
  }, [transactions])

  return (
    <>
      <StatCard title="Total Balance" hint="All-time" loading={loading}>
        <div className="text-2xl font-semibold">{formatCurrency(monthly.balance)}</div>
      </StatCard>

      <StatCard title="This Month" hint="Income vs Expenses" loading={loading}>
        <div className="text-2xl font-semibold">
          {formatCurrency(monthly.income)} income • {formatCurrency(monthly.expenses)} expenses
        </div>
      </StatCard>

      <Card>
        <CardHeader>
          <CardTitle>Savings Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold">{formatCurrency(monthly.savings)} saved</div>
                <div className="text-sm text-muted-foreground">Goal: {formatCurrency(monthly.goal)}</div>
              </div>
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
                    fill="none"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="4"
                    opacity="0.2"
                  />
                  <path
                    d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
                    fill="none"
                    stroke="rgb(41,98,255)" // Updated stroke color
                    strokeWidth="4"
                    strokeDasharray={`${monthly.progress}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                  {monthly.progress}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function StatCard({
  title,
  hint,
  children,
  loading,
}: {
  title: string
  hint: string
  children: React.ReactNode
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <>
            {children}
            <div className="mt-1 text-sm text-muted-foreground">{hint}</div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
