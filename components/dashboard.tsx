"use client"

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Moon, Sun, PlusCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { getProfileEmail, clearToken } from "@/lib/auth"
import { SummaryCards } from "@/components/summary-cards"
import { SpendingChart } from "@/components/spending-chart"
import { TransactionsTable } from "@/components/transactions-table"
import { AIAdvice } from "@/components/ai-advice"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction, fetchInsights } from "@/lib/api"
import type { Transaction } from "@/lib/types"

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const email = getProfileEmail() ?? "user@example.com"
  const initials = email.slice(0, 2).toUpperCase()
  const { theme, setTheme } = useTheme()

  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [advice, setAdvice] = React.useState<string>("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Transaction | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchTransactions()
      setTransactions(list)
      const tip = await fetchInsights()
      setAdvice(tip)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (payload: Omit<Transaction, "id">) => {
    const res = await createTransaction(payload)
    setTransactions((prev) => [res, ...prev])
  }
  const handleUpdate = async (id: string, payload: Omit<Transaction, "id">) => {
    const res = await updateTransaction(id, payload)
    setTransactions((prev) => prev.map((t) => (t.id === id ? res : t)))
  }
  const handleDelete = async (id: string) => {
    await deleteTransaction(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <SidebarProvider>
      <AppSidebar onAdd={() => setDialogOpen(true)} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-3 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="text-sm font-medium">AlgoFinny Dashboard</div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="bg-brand hover:bg-brand/90" onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    clearToken()
                    onLogout()
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-3 md:p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCards transactions={transactions} loading={loading} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-4 lg:col-span-2">
              <div className="mb-3 text-sm font-medium">Spending by Category (This Month)</div>
              <SpendingChart transactions={transactions} />
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-3 text-sm font-medium">AI Advice</div>
              <AIAdvice
                advice={advice}
                onRefresh={async () => {
                  setAdvice(await fetchInsights())
                }}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 text-sm font-medium">Recent Transactions</div>
            <TransactionsTable data={transactions} onEdit={(t) => setEditing(t)} onDelete={(id) => handleDelete(id)} />
          </div>
        </div>

        <AddTransactionDialog
          open={dialogOpen || !!editing}
          onOpenChange={(o) => {
            if (!o) setEditing(null)
            setDialogOpen(o)
          }}
          initial={editing ?? undefined}
          onSubmit={async (payload) => {
            if (editing) {
              await handleUpdate(editing.id, payload)
            } else {
              await handleCreate(payload)
            }
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
