import { Schema, model, type Document, type Types } from "mongoose"

export type TransactionType = "income" | "expense"

export interface ITransaction extends Document {
  userId: Types.ObjectId
  amount: number
  category: string
  type: TransactionType
  date: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
)

export const Transaction = model<ITransaction>("Transaction", TransactionSchema)
export default Transaction
