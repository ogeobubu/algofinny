import React, { useState } from 'react'

const OpayUploadGuide = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showJsonTemplate, setShowJsonTemplate] = useState(false)

  const jsonTemplate = {
    "accountInfo": {
      "account_name": "John Doe",
      "account_number": "+2348012345678",
      "bank_name": "Opay",
      "account_type": "Digital Wallet",
      "currency": "NGN",
      "statement_period": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
      },
      "wallet_balance": 25000.00
    },
    "transactions": [
      {
        "date": "2024-01-15",
        "time": "14:30:00",
        "description": "Transfer to John Smith",
        "type": "debit",
        "amount": 5000.00,
        "category": "Money Transfer",
        "transaction_reference": "OP123456789",
        "channel": "Opay Mobile App"
      },
      {
        "date": "2024-01-16",
        "time": "09:15:00", 
        "description": "Cashback from merchant payment",
        "type": "credit",
        "amount": 100.00,
        "category": "Rewards",
        "transaction_reference": "CB987654321"
      }
    ],
    "bankType": "opay"
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonTemplate, null, 2))
    alert('Template copied to clipboard!')
  }

  const downloadTemplate = () => {
    const blob = new Blob([JSON.stringify(jsonTemplate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'opay-statement-template.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white rounded-xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          🏦 Opay Bank Statement Upload Guide
        </h2>
        <p className="text-gray-300">
          AlgoFinny now supports Opay digital wallet statements! Follow this guide to upload your Opay transactions.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-white/10 rounded-lg p-1">
        {[
          { key: 'overview', label: '📊 Overview', desc: 'What we support' },
          { key: 'formats', label: '📄 Formats', desc: 'File types' },
          { key: 'json', label: '🔧 JSON Guide', desc: 'Manual format' },
          { key: 'categories', label: '🏷️ Categories', desc: 'How we categorize' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <div>{tab.label}</div>
            <div className="text-xs opacity-70">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-300">✅ What AlgoFinny Supports</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-green-300 mb-2">🏦 Supported Banks</h4>
                  <ul className="text-sm text-green-200 space-y-1">
                    <li>• <strong>Opay Digital Wallet</strong> ⭐</li>
                    <li>• Access Bank</li>
                    <li>• GTBank</li>
                    <li>• First Bank</li>
                    <li>• Zenith Bank</li>
                    <li>• UBA, Fidelity, Sterling, Wema</li>
                  </ul>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">💳 Opay Features</h4>
                  <ul className="text-sm text-blue-200 space-y-1">
                    <li>• Wallet funding & transfers</li>
                    <li>• POS transactions</li>
                    <li>• Bill payments</li>
                    <li>• Merchant payments</li>
                    <li>• Airtime/Data purchases</li>
                    <li>• Cashback & rewards</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-300 mb-2">🚀 Why Use AlgoFinny with Opay?</h4>
              <div className="text-sm text-yellow-200 grid md:grid-cols-3 gap-4">
                <div>
                  <strong>Smart Categorization</strong><br/>
                  Automatically categorizes your Opay transactions into meaningful groups
                </div>
                <div>
                  <strong>AI Financial Advice</strong><br/>
                  Get personalized insights based on your digital wallet habits
                </div>
                <div>
                  <strong>Spending Analytics</strong><br/>
                  Track your cashless lifestyle with detailed charts and trends
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'formats' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-300">📄 Supported File Formats</h3>
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-300">📄 PDF Statements</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">RECOMMENDED</span>
                  </div>
                  <p className="text-sm text-green-200 mb-3">
                    Export your Opay statement as PDF from the mobile app and upload directly.
                  </p>
                  <div className="bg-green-900/30 rounded p-3 text-xs text-green-100">
                    <strong>How to get PDF from Opay:</strong><br/>
                    1. Open Opay app → Profile → Account Statement<br/>
                    2. Select date range<br/>
                    3. Choose "Export as PDF"<br/>
                    4. Upload the downloaded PDF here
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-300">🔧 JSON Format</h4>
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">ADVANCED</span>
                  </div>
                  <p className="text-sm text-blue-200 mb-3">
                    For advanced users who want to format their own transaction data.
                  </p>
                  <button 
                    onClick={() => setActiveTab('json')}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    See JSON Guide →
                  </button>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-yellow-300">📊 CSV Support</h4>
                    <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium">COMING SOON</span>
                  </div>
                  <p className="text-sm text-yellow-200">
                    CSV support for Opay statements is in development. Use PDF or JSON for now.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-300">🔧 JSON Format Guide</h3>
              <p className="text-gray-300 mb-4">
                Use this template to manually format your Opay transaction data. Perfect for developers or advanced users.
              </p>
              
              <div className="flex space-x-3 mb-4">
                <button
                  onClick={copyToClipboard}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  📋 Copy Template
                </button>
                <button
                  onClick={downloadTemplate}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  💾 Download Template
                </button>
                <button
                  onClick={() => setShowJsonTemplate(!showJsonTemplate)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  {showJsonTemplate ? '🙈 Hide' : '👁️ Show'} Template
                </button>
              </div>

              {showJsonTemplate && (
                <div className="bg-black/30 rounded-lg p-4 border border-gray-600">
                  <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(jsonTemplate, null, 2)}
                  </pre>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-blue-300">📝 Field Explanations</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 rounded p-3">
                    <strong className="text-green-300">Account Info</strong>
                    <ul className="mt-2 space-y-1 text-gray-300">
                      <li><code>account_number</code>: Your phone number</li>
                      <li><code>bank_name</code>: "Opay"</li>
                      <li><code>account_type</code>: "Digital Wallet"</li>
                      <li><code>wallet_balance</code>: Current balance</li>
                    </ul>
                  </div>
                  <div className="bg-white/5 rounded p-3">
                    <strong className="text-blue-300">Transaction Fields</strong>
                    <ul className="mt-2 space-y-1 text-gray-300">
                      <li><code>type</code>: "credit" or "debit"</li>
                      <li><code>amount</code>: Transaction amount (positive)</li>
                      <li><code>description</code>: Transaction details</li>
                      <li><code>category</code>: Auto-categorized if empty</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-300">🏷️ Opay Transaction Categories</h3>
              <p className="text-gray-300 mb-4">
                AlgoFinny automatically categorizes your Opay transactions for better insights. Here's how:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">💼</span>
                      <strong className="text-blue-300">Wallet Funding</strong>
                    </div>
                    <p className="text-xs text-blue-200">Wallet topups, funding from banks</p>
                  </div>
                  
                  <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🏪</span>
                      <strong className="text-pink-300">POS Transaction</strong>
                    </div>
                    <p className="text-xs text-pink-200">POS withdrawals, agent transactions</p>
                  </div>
                  
                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">💸</span>
                      <strong className="text-purple-300">Money Transfer</strong>
                    </div>
                    <p className="text-xs text-purple-200">P2P transfers, send/receive money</p>
                  </div>
                  
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🧾</span>
                      <strong className="text-green-300">Bill Payment</strong>
                    </div>
                    <p className="text-xs text-green-200">Electricity, water, cable TV bills</p>
                  </div>
                  
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">📲</span>
                      <strong className="text-orange-300">Airtime/Data</strong>
                    </div>
                    <p className="text-xs text-orange-200">Mobile recharge, data purchases</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🛍️</span>
                      <strong className="text-indigo-300">Merchant Payment</strong>
                    </div>
                    <p className="text-xs text-indigo-200">QR payments, store purchases</p>
                  </div>
                  
                  <div className="bg-teal-500/20 border border-teal-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🏛️</span>
                      <strong className="text-teal-300">Savings</strong>
                    </div>
                    <p className="text-xs text-teal-200">Ajo savings, target savings plans</p>
                  </div>
                  
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">💳</span>
                      <strong className="text-red-300">Loan</strong>
                    </div>
                    <p className="text-xs text-red-200">OKash loans, repayments</p>
                  </div>
                  
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🎁</span>
                      <strong className="text-yellow-300">Rewards</strong>
                    </div>
                    <p className="text-xs text-yellow-200">Cashbacks, bonuses, referral rewards</p>
                  </div>
                  
                  <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">↩️</span>
                      <strong className="text-gray-300">Refund/Reversal</strong>
                    </div>
                    <p className="text-xs text-gray-200">Failed transactions, refunds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center mb-3">
          <span className="text-2xl mr-3">🚀</span>
          <h3 className="text-lg font-semibold text-purple-300">Ready to Upload?</h3>
        </div>
        <p className="text-gray-300 mb-4">
          Your Opay statement will be automatically analyzed and categorized. Get insights into your digital spending patterns!
        </p>
        <div className="flex space-x-3">
          <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition-colors">
            📄 Upload PDF Statement
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors">
            🔧 Upload JSON Data
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Need help? Contact us at <span className="text-purple-300">support@algofinny.com</span>
        </p>
      </div>
    </div>
  )
}

export default OpayUploadGuide