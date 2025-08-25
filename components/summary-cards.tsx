"use client"

import React from "react"
import type { Transaction } from "@/lib/types"
import { formatCurrency, getMonthRange } from "@/lib/utils"

export function SummaryCards({ transactions, loading }: { transactions: Transaction[]; loading: boolean }) {
  const monthly = React.useMemo(() => {
    const { start, end } = getMonthRange(new Date())
    
    // Filter transactions for current month
    const thisMonth = transactions.filter((t) => {
      const transactionDate = new Date(t.date)
      return transactionDate >= start && transactionDate <= end
    })

    // Calculate income and expenses
    const income = thisMonth
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = thisMonth
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    // Calculate all-time balance
    const balance = transactions.reduce((sum, t) => {
      return t.type === "income" ? sum + t.amount : sum - t.amount
    }, 0)

    // Calculate savings and progress
    const savings = income > 0 ? income - expenses : 0
    const goal = Math.max(1, Math.round(income * 0.2)) // 20% savings goal
    const progress = income > 0 ? Math.max(0, Math.min(100, Math.round((savings / goal) * 100))) : 0

    return { 
      income, 
      expenses, 
      balance, 
      savings, 
      goal, 
      progress,
      hasData: thisMonth.length > 0
    }
  }, [transactions])

  if (loading) {
    return (
      <>
        {/* Loading Skeletons */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-gray-300 text-sm font-medium mb-2">Total Balance</h3>
          <div className="w-32 h-8 bg-white/10 rounded animate-pulse"></div>
          <p className="text-xs text-gray-400 mt-1">All-time net worth</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-gray-300 text-sm font-medium mb-2">This Month</h3>
          <div className="space-y-2">
            <div className="w-full h-4 bg-white/10 rounded animate-pulse"></div>
            <div className="w-3/4 h-4 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-gray-300 text-sm font-medium mb-2">Savings Progress</h3>
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="w-20 h-6 bg-white/10 rounded animate-pulse"></div>
              <div className="w-32 h-4 bg-white/10 rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Total Balance Card */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-gray-300 text-sm font-medium mb-2">Total Balance</h3>
        <div className="text-3xl font-bold text-white">{formatCurrency(monthly.balance)}</div>
        <p className="text-xs text-gray-400 mt-1">All-time net worth</p>
      </div>

      {/* Monthly Summary Card */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-gray-300 text-sm font-medium mb-2">This Month</h3>
        {monthly.hasData ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-400">Income:</span>
              <span className="font-medium text-green-400">{formatCurrency(monthly.income)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-400">Expenses:</span>
              <span className="font-medium text-red-400">{formatCurrency(monthly.expenses)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-sm font-medium text-white">Net:</span>
              <span className={`font-bold ${monthly.income - monthly.expenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(monthly.income - monthly.expenses)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">No transactions this month</div>
        )}
      </div>

      {/* Savings Progress Card */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-gray-300 text-sm font-medium mb-2">Savings Progress</h3>
        {monthly.hasData ? (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-2xl font-bold text-white">{formatCurrency(monthly.savings)}</div>
              <div className="text-xs text-gray-400 mt-1">
                {monthly.savings >= monthly.goal ? '🎉 Goal achieved!' : `${formatCurrency(monthly.goal - monthly.savings)} to go`}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Goal: {formatCurrency(monthly.goal)}
              </div>
            </div>
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
                  fill="none"
                  stroke={monthly.progress >= 100 ? "#10b981" : "#8b5cf6"} // Purple to match your theme
                  strokeWidth="3"
                  strokeDasharray={`${monthly.progress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {monthly.progress}%
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">No data for savings calculation</div>
        )}
      </div>
    </>
  )
}