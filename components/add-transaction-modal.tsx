"use client"

import React from "react"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  RadioGroup,
  HStack,
  Radio,
  VStack,
  useToast,
} from "@chakra-ui/react"
import type { Transaction } from "@/lib/types"
import { DEFAULT_CATEGORIES } from "@/lib/categories"

export function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initial,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: Omit<Transaction, "id">) => Promise<void> | void
  initial?: Transaction
}) {
  const toast = useToast()
  const [amount, setAmount] = React.useState(initial ? String(initial.amount) : "")
  const [description, setDescription] = React.useState(initial?.description ?? "")
  const [category, setCategory] = React.useState(initial?.category ?? DEFAULT_CATEGORIES[0])
  const [type, setType] = React.useState<Transaction["type"]>(initial?.type ?? "expense")
  const [date, setDate] = React.useState(
    initial ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  )
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (initial) {
      setAmount(String(initial.amount))
      setDescription(initial.description)
      setCategory(initial.category)
      setType(initial.type)
      setDate(new Date(initial.date).toISOString().slice(0, 10))
    }
  }, [initial])

  const handleSubmit = async () => {
    const num = Number(amount)
    if (!num || isNaN(num)) {
      toast({ title: "Enter a valid amount", status: "warning" })
      return
    }
    setLoading(true)
    try {
      await onSubmit({
        amount: num,
        description: description || (type === "income" ? "Income" : "Expense"),
        category,
        type,
        date: new Date(date),
        id: "tmp", // will be ignored on create/update
      } as any)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{initial ? "Edit Transaction" : "Add Transaction"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Amount (₦)</FormLabel>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Jumia" />
            </FormControl>
            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Type</FormLabel>
              <RadioGroup value={type} onChange={(val) => setType(val as Transaction["type"])}>
                <HStack spacing={6}>
                  <Radio value="income" colorScheme="green">
                    Income
                  </Radio>
                  <Radio value="expense" colorScheme="red">
                    Expense
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel>Date</FormLabel>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="purple" onClick={handleSubmit} isLoading={loading}>
            {initial ? "Save Changes" : "Add"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
