"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, ArrowUpDown } from "lucide-react"
import type { Transaction } from "@/lib/types"
import { cn, formatCurrency } from "@/lib/utils"

type SortKey = "date" | "description" | "category" | "amount"
type SortDir = "asc" | "desc"

export function TransactionsTable({
  data,
  onEdit,
  onDelete,
}: {
  data: Transaction[]
  onEdit: (t: Transaction) => void
  onDelete: (id: string) => void
}) {
  const [sortKey, setSortKey] = React.useState<SortKey>("date")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")

  const sorted = React.useMemo(() => {
    const copy = [...data]
    copy.sort((a, b) => {
      let av: any, bv: any
      switch (sortKey) {
        case "date":
          av = new Date(a.date).getTime()
          bv = new Date(b.date).getTime()
          break
        case "description":
          av = a.description.toLowerCase()
          bv = b.description.toLowerCase()
          break
        case "category":
          av = a.category.toLowerCase()
          bv = b.category.toLowerCase()
          break
        case "amount":
          av = a.amount
          bv = b.amount
          break
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return copy
  }, [data, sortKey, sortDir])

  function header(key: SortKey, label: string) {
    return (
      <TableHead
        className="cursor-pointer select-none"
        onClick={() => {
          if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc")
          else {
            setSortKey(key)
            setSortDir("asc")
          }
        }}
      >
        <div className="inline-flex items-center gap-1">
          <span>{label}</span>
          <ArrowUpDown className="h-3.5 w-3.5 opacity-70" />
        </div>
      </TableHead>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {header("date", "Date")}
            {header("description", "Description")}
            {header("category", "Category")}
            {header("amount", "Amount (₦)")}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs",
                    item.type === "income"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                  )}
                >
                  {item.category}
                </span>
              </TableCell>
              <TableCell className={cn("text-right", item.type === "income" ? "text-green-600" : "text-red-500")}>
                {formatCurrency(item.amount)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => onEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    className="text-red-600"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
