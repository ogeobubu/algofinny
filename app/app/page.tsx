"use client"

import React from "react"
import { Dashboard } from "@/components/dashboard"
import { AuthForm } from "@/components/auth-form"
import { getToken } from "@/lib/auth"

export default function AppHome() {
  const [token, setToken] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setToken(getToken())
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
      </div>
    )
  }

  return token ? (
    <Dashboard onLogout={() => setToken(null)} />
  ) : (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
       <AuthForm
        onAuthed={() => {
          setToken(getToken())
        }}
      />
      </div>
     
    </div>
  )
}
