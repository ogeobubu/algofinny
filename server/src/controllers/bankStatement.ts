import formidable from "formidable"
import type { Request, Response } from "express"
import fs from "fs/promises"
import path from "path"

// Utility: parse uploaded file
export async function handleBankStatementUpload(req: Request, res: Response) {
  const form = formidable({ multiples: false, uploadDir: path.join(process.cwd(), "uploads"), keepExtensions: true })
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Upload failed" })
    const file = files.statement
    if (!file || Array.isArray(file)) return res.status(400).json({ error: "No file uploaded" })
    // Read file content
    const filePath = file.filepath || file.path
    const buffer = await fs.readFile(filePath)
    // TODO: Extract transactions from buffer (PDF/CSV parser)
    // For now, just return file info
    return res.json({ filename: file.originalFilename, size: file.size })
  })
}
