import { Schema, model } from "mongoose";
const TransactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    time: { type: String }, // HH:MM:SS format
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0 },
    balance_after: { type: Number },
    channel: { type: String, default: "Manual Entry" },
    transaction_reference: { type: String },
    counterparty: { type: String, default: null },
    category: { type: String, required: true, trim: true, default: "Other" },
    legacy_type: { type: String, enum: ["income", "expense"] }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            // Convert to legacy format for backward compatibility
            if (ret.type === "credit" && !ret.legacy_type) {
                ret.legacy_type = "income";
            }
            else if (ret.type === "debit" && !ret.legacy_type) {
                ret.legacy_type = "expense";
            }
            return ret;
        }
    }
});
TransactionSchema.virtual('income_expense_type').get(function () {
    return this.type === 'credit' ? 'income' : 'expense';
});
export const Transaction = model("Transaction", TransactionSchema);
export default Transaction;
//# sourceMappingURL=Transaction.js.map