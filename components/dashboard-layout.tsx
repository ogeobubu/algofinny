"use client"

import React from "react"
import {
  Box,
  Flex,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  VStack,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Button,
  useColorMode,
  useColorModeValue,
  Divider,
  Container,
} from "@chakra-ui/react"
import { MenuIcon, LogOut, Moon, Sun, PlusCircle, LayoutDashboard, List, Settings } from "lucide-react"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { SummaryCards } from "@/components/summary-cards"
import { SpendingChart } from "@/components/spending-chart"
import { TransactionsTable } from "@/components/transactions-table"
import { getProfileEmail, clearToken } from "@/lib/auth"
import { fetchTransactions, createTransaction, deleteTransaction, updateTransaction, fetchInsights } from "@/lib/api"
import type { Transaction } from "@/lib/types"
import { AIAdvice } from "@/components/ai-advice"

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const sidebar = useDisclosure()
  const { colorMode, toggleColorMode } = useColorMode()
  const bg = useColorModeValue("gray.50", "gray.900")
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Transaction | null>(null)
  const [advice, setAdvice] = React.useState<string>("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchTransactions()
      setTransactions(data)
      const tip = await fetchInsights()
      setAdvice(tip)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (input: Omit<Transaction, "id">) => {
    const res = await createTransaction(input)
    setTransactions((prev) => [res, ...prev])
  }
  const handleUpdate = async (id: string, input: Omit<Transaction, "id">) => {
    const res = await updateTransaction(id, input)
    setTransactions((prev) => prev.map((t) => (t.id === id ? res : t)))
  }
  const handleDelete = async (id: string) => {
    await deleteTransaction(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const email = getProfileEmail()

  return (
    <Flex minH="100vh" bg={bg}>
      {/* Sidebar - Desktop */}
      <Box
        display={{ base: "none", md: "block" }}
        w="260px"
        bg={useColorModeValue("white", "gray.800")}
        borderRightWidth="1px"
        position="sticky"
        top={0}
        minH="100vh"
      >
        <SidebarContent onAdd={() => setAddOpen(true)} />
      </Box>

      {/* Sidebar - Mobile Drawer */}
      <Drawer isOpen={sidebar.isOpen} onClose={sidebar.onClose} placement="left" size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <SidebarContent
              onAdd={() => {
                setAddOpen(true)
                sidebar.onClose()
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main */}
      <Flex direction="column" flex="1 1 0">
        <Flex
          as="header"
          align="center"
          justify="space-between"
          px={{ base: 4, md: 6 }}
          py={3}
          bg={useColorModeValue("white", "gray.800")}
          borderBottomWidth="1px"
          position="sticky"
          top={0}
          zIndex={1}
        >
          <HStack spacing={3}>
            <IconButton
              aria-label="Open menu"
              display={{ base: "inline-flex", md: "none" }}
              icon={<MenuIcon size={18} />}
              onClick={sidebar.onOpen}
              variant="ghost"
            />
            <HStack spacing={2}>
              <LayoutDashboard size={20} />
              <Text fontWeight="semibold">Dashboard</Text>
            </HStack>
          </HStack>
          <HStack spacing={2}>
            <Button leftIcon={<PlusCircle size={18} />} colorScheme="purple" size="sm" onClick={() => setAddOpen(true)}>
              Add Transaction
            </Button>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === "light" ? <Moon size={18} /> : <Sun size={18} />}
              onClick={toggleColorMode}
              variant="ghost"
            />
            <Menu>
              <MenuButton>
                <HStack>
                  <Avatar size="sm" name={email ?? "User"} />
                  <Text display={{ base: "none", md: "block" }} fontSize="sm">
                    {email ?? "user@example.com"}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<Settings size={16} />}>Settings</MenuItem>
                <MenuItem
                  icon={<LogOut size={16} />}
                  onClick={() => {
                    clearToken()
                    onLogout()
                  }}
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        <Box as="main" px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
          <Container maxW="7xl" p={0}>
            <SummaryCards transactions={transactions} loading={loading} />
            <Flex gap={4} direction={{ base: "column", lg: "row" }} mt={4}>
              <Box flex="1" borderWidth="1px" rounded="lg" bg={useColorModeValue("white", "gray.800")} p={4}>
                <Text fontWeight="semibold" mb={3}>
                  Spending by Category (This Month)
                </Text>
                <SpendingChart transactions={transactions} />
              </Box>
              <Box
                flex={{ base: "1", lg: "0 0 360px" }}
                borderWidth="1px"
                rounded="lg"
                bg={useColorModeValue("white", "gray.800")}
                p={4}
              >
                <Text fontWeight="semibold" mb={3}>
                  AI Advice
                </Text>
                <AIAdvice advice={advice} onRefresh={async () => setAdvice(await fetchInsights())} />
              </Box>
            </Flex>

            <Box mt={6} borderWidth="1px" rounded="lg" bg={useColorModeValue("white", "gray.800")} p={4}>
              <HStack justify="space-between" mb={3}>
                <HStack>
                  <List size={20} />
                  <Text fontWeight="semibold">Recent Transactions</Text>
                </HStack>
              </HStack>
              <TransactionsTable
                data={transactions}
                onEdit={(tx) => setEditing(tx)}
                onDelete={(id) => handleDelete(id)}
              />
            </Box>
          </Container>
        </Box>
      </Flex>

      <AddTransactionModal
        isOpen={addOpen || !!editing}
        onClose={() => {
          setAddOpen(false)
          setEditing(null)
        }}
        initial={editing ?? undefined}
        onSubmit={async (payload) => {
          if (editing) {
            await handleUpdate(editing.id, payload)
          } else {
            await handleCreate(payload)
          }
          setAddOpen(false)
          setEditing(null)
        }}
      />
    </Flex>
  )
}

function SidebarContent({ onAdd }: { onAdd: () => void }) {
  return (
    <VStack align="stretch" spacing={1} p={4}>
      <HStack px={2} py={2}>
        <Text fontSize="lg" fontWeight="bold">
          AI Budgeting
        </Text>
      </HStack>
      <Divider my={2} />
      <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
      <NavItem icon={<List size={18} />} label="Transactions" />
      <Button leftIcon={<PlusCircle size={18} />} mt={3} colorScheme="purple" onClick={onAdd}>
        Add Transaction
      </Button>
    </VStack>
  )
}

function NavItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  const activeBg = useColorModeValue("purple.50", "purple.900")
  return (
    <HStack px={3} py={2} rounded="md" _hover={{ bg: activeBg, cursor: "pointer" }}>
      {icon}
      <Text>{label}</Text>
    </HStack>
  )
}
