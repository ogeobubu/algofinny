import React from "react"
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, HStack } from "@chakra-ui/react"
import type { AIAdvice } from "../../../types"

export function AdviceBanner({ message, severity = "low", fetchUrl }: { message?: string; severity?: AIAdvice["severity"]; fetchUrl?: string }) {
  const [text, setText] = React.useState<string | undefined>(message)

  async function refresh() {
    if (!fetchUrl) return
    const res = await fetch(fetchUrl)
    if (!res.ok) return
    const data = await res.json()
    setText(data?.message || data?.advice || "")
  }

  React.useEffect(() => {
    if (fetchUrl) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl])

  const status = severity === "high" ? "error" : severity === "medium" ? "warning" : "info"

  return (
    <Alert status={status} borderRadius="md" bg="white">
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>AI Advice</AlertTitle>
        <AlertDescription>{text || "Get insights to optimize your spending."}</AlertDescription>
      </Box>
      {fetchUrl && (
        <HStack>
          <Button size="sm" onClick={refresh}>
            Refresh
          </Button>
        </HStack>
      )}
    </Alert>
  )
}

export default AdviceBanner
