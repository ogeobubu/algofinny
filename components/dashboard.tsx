"use client"

import React, { useState, useEffect } from "react"
import { Transaction } from "@/lib/types"
import { getAuthHeaders, removeToken } from "@/lib/auth"

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [advice, setAdvice] = useState<string>("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    category: "Other",
    type: "expense" as const
  })

  useEffect(() => {
    fetchTransactions()
    fetchAdvice()
  }, [])

  const fetchTransactions = async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || ""
      const endpoint = serverUrl 
        ? `${serverUrl}/api/transactions`
        : "/api/transactions"

      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      })

      if (!response.ok) throw new Error("Failed to fetch transactions")
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdvice = async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || ""
      const endpoint = serverUrl 
        ? `${serverUrl}/api/ai/advice`
        : "/api/insights"

      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setAdvice(data.advice)
      }
    } catch (error) {
      console.error("Error fetching advice:", error)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || ""
      const endpoint = serverUrl 
        ? `${serverUrl}/api/transactions`
        : "/api/transactions"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...newTransaction,
          amount: parseFloat(newTransaction.amount)
        })
      })

      if (!response.ok) throw new Error("Failed to add transaction")
      
      setNewTransaction({ description: "", amount: "", category: "Other", type: "expense" })
      setShowAddModal(false)
      fetchTransactions()
      fetchAdvice()
    } catch (error) {
      console.error("Error adding transaction:", error)
    }
  }

  const handleLogout = () => {
    removeToken()
    onLogout()
  }

  const calculateSummary = () => {
    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)
    
    return { income, expenses, balance: income - expenses }
  }

  const summary = calculateSummary()
  const formatCurrency = (amount: number) => `₦${Math.round(amount).toLocaleString()}`

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Loading your financial dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AlgoFinny
            </h1>
            <span className="text-gray-300">Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add Transaction
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-gray-300 text-sm font-medium mb-2">Total Balance</h3>
            <p className="text-3xl font-bold">{formatCurrency(summary.balance)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-gray-300 text-sm font-medium mb-2">Total Income</h3>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(summary.income)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-gray-300 text-sm font-medium mb-2">Total Expenses</h3>
            <p className="text-3xl font-bold text-red-400">{formatCurrency(summary.expenses)}</p>
          </div>
        </div>

        {/* AI Advice */}
        {advice && (
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-2">💡 AI Financial Advice</h3>
            <p className="text-gray-200">{advice}</p>
            <button
              onClick={fetchAdvice}
              className="mt-4 text-purple-300 hover:text-purple-200 text-sm font-medium"
            >
              Get New Advice →
            </button>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-purple-300 hover:text-purple-200 text-sm font-medium"
            >
              Add New
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Category</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{transaction.description}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === "income" 
                          ? "bg-green-500/20 text-green-300" 
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      transaction.type === "income" ? "text-green-400" : "text-red-400"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-6">Add Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter description"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={newTransaction.type === "income"}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as "income" | "expense" }))}
                      className="mr-2"
                    />
                    Income
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={newTransaction.type === "expense"}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as "income" | "expense" }))}
                      className="mr-2"
                    />
                    Expense
                  </label>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}