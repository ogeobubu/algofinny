"use client"

import { useRef, useState } from "react"

export default function BankStatementUpload() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!fileInput.current?.files?.[0]) return
    setUploading(true)
    setResult(null)
    const formData = new FormData()
    formData.append("statement", fileInput.current.files[0])
    const res = await fetch("/api/bank/upload", { method: "POST", body: formData })
    const data = await res.json()
    setUploading(false)
    setResult(data.error ? data.error : `Uploaded: ${data.filename} (${data.size} bytes)`)
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">Upload Bank Statement</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <input ref={fileInput} type="file" name="statement" accept=".pdf,.csv" className="block w-full" required />
        <button type="submit" className="bg-brand text-white px-6 py-2 rounded" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {result && <div className="mt-4 text-sm text-center">{result}</div>}
    </div>
  )
}
