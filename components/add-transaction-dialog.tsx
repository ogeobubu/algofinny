"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Transaction } from "@/lib/types"
import { DEFAULT_CATEGORIES } from "@/lib/categories"

export function AddTransactionDialog({
  open,
  onOpenChange,
  onSubmit,
  initial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: Omit<Transaction, "id">) => Promise<void> | void
  initial?: Transaction
}) {
  const [amount, setAmount] = React.useState(initial ? String(initial.amount) : "")
  const [description, setDescription] = React.useState(initial?.description ?? "")
  const [category, setCategory] = React.useState(initial?.category ?? DEFAULT_CATEGORIES[0])
  const [type, setType] = React.useState<Transaction["type"]>(initial?.type ?? "expense")
  const [date, setDate] = React.useState(
    initial ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  )
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (initial) {
      setAmount(String(initial.amount))
      setDescription(initial.description)
      setCategory(initial.category)
      setType(initial.type)
      setDate(new Date(initial.date).toISOString().slice(0, 10))
    } else {
      setAmount("")
      setDescription("")
      setCategory(DEFAULT_CATEGORIES[0])
      setType("expense")
      setDate(new Date().toISOString().slice(0, 10))
    }
  }, [initial, open])

  async function handleSave() {
    const amt = Number(amount)
    if (!amt || isNaN(amt)) {
      alert("Enter a valid amount")
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        amount: amt,
        description: description || (type === "income" ? "Income" : "Expense"),
        category,
        type,
        date: new Date(date),
      } as any)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Jumia"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as Transaction["type"])} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income">Income</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense">Expense</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-brand hover:bg-brand/90" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : initial ? "Save Changes" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
