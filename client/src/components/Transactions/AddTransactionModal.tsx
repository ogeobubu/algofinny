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
  Select as CSelect,
  RadioGroup,
  Radio,
  Stack,
} from "@chakra-ui/react"
import type { Transaction } from "../../../types"

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Airtime",
  "Bills",
  "Other",
]

export function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: Omit<Transaction, "id">) => Promise<void> | void
}) {
  const [amount, setAmount] = React.useState(0)
  const [category, setCategory] = React.useState(CATEGORIES[0])
  const [type, setType] = React.useState<Transaction["type"]>("expense")
  const [date, setDate] = React.useState<string>(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = React.useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      await onSubmit({ userId: "", amount: Number(amount), category, type, date: new Date(date) } as any)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Transaction</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Amount (₦)</FormLabel>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </FormControl>
            <FormControl>
              <FormLabel>Category</FormLabel>
              <CSelect value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </CSelect>
            </FormControl>
            <FormControl>
              <FormLabel>Type</FormLabel>
              <RadioGroup onChange={(v) => setType(v as Transaction["type"])} value={type}>
                <Stack direction="row">
                  <Radio value="income">Income</Radio>
                  <Radio value="expense">Expense</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel>Date</FormLabel>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddTransactionModal
