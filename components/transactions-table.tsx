import { Transaction } from "@/lib/types"

interface TransactionTableProps {
  transactions: Transaction[]
  onAddTransaction: () => void
}

const formatCurrency = (amount: number) => `₦${Math.round(amount).toLocaleString()}`

export function TransactionTable({ transactions, onAddTransaction }: TransactionTableProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <button
          onClick={onAddTransaction}
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
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No transactions yet. Add your first transaction to get started!
          </div>
        )}
      </div>
    </div>
  )
}