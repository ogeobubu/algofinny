"use client"

import React, { useState, useEffect } from "react"
import { Transaction } from "@/lib/types"
import { getAuthHeaders, removeToken } from "@/lib/auth"
import { SummaryCards } from "./summary-cards"
import OpayUploadGuide from "./opay-upload"

interface DashboardProps {
  onLogout: () => void
}

interface AIAdvice {
  advice: string
  model: string
  transactionCount?: number
  timestamp?: string
}

interface FileUploadResult {
  success: boolean
  message: string
  processed?: {
    total_transactions: number
    saved_transactions: number
    skipped_transactions: number
  }
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null)
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedAiModel, setSelectedAiModel] = useState<'openai' | 'deepseek' | 'rules'>('openai')
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    category: "Other",
    type: "expense" as const
  })

  useEffect(() => {
    fetchTransactions()
    fetchAIAdvice()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions", {
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

  const fetchAIAdvice = async (model?: string) => {
    setAdviceLoading(true)
    try {
      const params = new URLSearchParams()
      if (model) params.append('model', model)
      
      const response = await fetch(`/api/insights?${params}`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setAiAdvice({
          advice: data.advice,
          model: data.model,
          transactionCount: data.insights?.totalTransactions,
          timestamp: data.timestamp
        })
      }
    } catch (error) {
      console.error("Error fetching AI advice:", error)
      setAiAdvice({
        advice: "Unable to generate advice at the moment. Please try again later.",
        model: "error"
      })
    } finally {
      setAdviceLoading(false)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/transactions", {
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
      fetchAIAdvice()
    } catch (error) {
      console.error("Error adding transaction:", error)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadError("Please select a file first")
      return
    }

    setUploadLoading(true)
    setUploadError("")
    setUploadSuccess("")

    try {
      const formData = new FormData()
      formData.append("statement", selectedFile)

      const response = await fetch("/api/bank/upload", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      })

      const result: FileUploadResult = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to upload statement")
      }

      if (result.processed) {
        setUploadSuccess(
          `✅ Successfully processed ${result.processed.saved_transactions} transactions! ` +
          `(${result.processed.skipped_transactions} duplicates skipped)`
        )
      } else {
        setUploadSuccess(`✅ ${result.message}`)
      }
      
      // Refresh data after successful upload
      setTimeout(() => {
        setShowUploadModal(false)
        setSelectedFile(null)
        setUploadError("")
        setUploadSuccess("")
        fetchTransactions()
        fetchAIAdvice()
      }, 3000)
      
    } catch (error) {
      console.error("Error uploading statement:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload statement")
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ["application/pdf", "text/csv", "application/vnd.ms-excel", "application/json"]
      if (!validTypes.includes(file.type)) {
        setUploadError("Please upload a PDF, CSV, or JSON file")
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size must be less than 10MB")
        return
      }
      
      setSelectedFile(file)
      setUploadError("")
    }
  }

  const handleAIModelChange = (model: 'openai' | 'deepseek' | 'rules') => {
    setSelectedAiModel(model)
    fetchAIAdvice(model)
  }

  const handleLogout = () => {
    removeToken()
    onLogout()
  }

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
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Upload Statement
            </button>
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
          <SummaryCards transactions={transactions} loading={loading} />
        </div>

        {/* Enhanced AI Advice Section */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              🤖 AI Financial Advisor
              {adviceLoading && (
                <div className="ml-2 w-4 h-4 border-2 border-purple-400/20 border-t-purple-400 rounded-full animate-spin" />
              )}
            </h3>
            <div className="flex space-x-2">
              <select
                value={selectedAiModel}
                onChange={(e) => handleAIModelChange(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={adviceLoading}
              >
                <option value="openai">OpenAI GPT</option>
                <option value="deepseek">DeepSeek AI</option>
                <option value="rules">Quick Analysis</option>
              </select>
              <button
                onClick={() => fetchAIAdvice(selectedAiModel)}
                disabled={adviceLoading}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-4 mb-4">
            <p className="text-gray-200 leading-relaxed">
              {aiAdvice?.advice || "Getting personalized financial advice..."}
            </p>
          </div>
          
          {aiAdvice && (
            <div className="flex justify-between items-center text-sm text-gray-300">
              <span>
                Model: {aiAdvice.model} 
                {aiAdvice.transactionCount && ` • ${aiAdvice.transactionCount} transactions analyzed`}
              </span>
              {aiAdvice.timestamp && (
                <span>
                  Updated: {new Date(aiAdvice.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-blue-300 hover:text-blue-200 text-sm font-medium"
              >
                Upload Statement
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-purple-300 hover:text-purple-200 text-sm font-medium"
              >
                Add New
              </button>
            </div>
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
                        transaction.type === "income" || transaction.legacy_type === "income"
                          ? "bg-green-500/20 text-green-300" 
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      transaction.type === "income" || transaction.legacy_type === "income" 
                        ? "text-green-400" : "text-red-400"
                    }`}>
                      {(transaction.type === "income" || transaction.legacy_type === "income") ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="mb-4 text-4xl">📊</div>
                <h4 className="text-lg font-medium mb-2">No transactions yet</h4>
                <p className="text-sm mb-4">Upload a bank statement or add your first transaction to get started!</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Upload Statement
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add Transaction
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <OpayUploadGuide />
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
                  min="0"
                  step="0.01"
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
                  <option value="Food">🍽️ Food</option>
                  <option value="Transport">🚗 Transport</option>
                  <option value="Shopping">🛒 Shopping</option>
                  <option value="Bills">💡 Bills</option>
                  <option value="Airtime">📱 Airtime</option>
                  <option value="Healthcare">🏥 Healthcare</option>
                  <option value="Education">📚 Education</option>
                  <option value="Entertainment">🎬 Entertainment</option>
                  <option value="Other">📋 Other</option>
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
                      className="mr-2 text-green-500"
                    />
                    💰 Income
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={newTransaction.type === "expense"}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as "income" | "expense" }))}
                      className="mr-2 text-red-500"
                    />
                    💸 Expense
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

      {/* Enhanced Upload Statement Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-6">Upload Bank Statement</h3>
            
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <h4 className="font-medium text-blue-300 mb-2">Supported Formats:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• PDF bank statements</li>
                <li>• CSV transaction exports</li>
                <li>• JSON structured data</li>
                <li>• Max file size: 10MB</li>
              </ul>
            </div>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Bank Statement
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, CSV, or JSON (MAX. 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange}
                      accept=".pdf,.csv,application/pdf,text/csv,application/json"
                    />
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-400">
                      ✅ Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                    </p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-sm">❌ {uploadError}</p>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-300 text-sm">{uploadSuccess}</p>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false)
                    setUploadError("")
                    setUploadSuccess("")
                    setSelectedFile(null)
                  }}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading || !selectedFile}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Processing...
                    </span>
                  ) : (
                    "Upload Statement"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}