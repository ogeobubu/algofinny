"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function AIAdvice({ advice, onRefresh }: { advice: string; onRefresh: () => void | Promise<void> }) {
  return (
    <div className="space-y-3">
      <Alert>
        <AlertTitle>Tip</AlertTitle>
        <AlertDescription>{advice || "No advice yet. Add some transactions."}</AlertDescription>
      </Alert>
      <Button variant="outline" onClick={onRefresh}>
        Refresh Advice
      </Button>
    </div>
  )
}
