import { Schema, model } from "mongoose";
const AccountInfoSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true, unique: true },
    account_name: { type: String, required: true, trim: true },
    account_number: { type: String, required: true, trim: true },
    bank_name: { type: String, required: true, trim: true },
    account_type: { type: String, required: true, trim: true },
    currency: { type: String, required: true, default: "NGN" },
    statement_period: {
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true }
    },
    opening_balance: { type: Number, required: true, default: 0 },
    closing_balance: { type: Number, required: true, default: 0 },
    total_debits: { type: Number, required: true, default: 0 },
    total_credits: { type: Number, required: true, default: 0 },
    last_updated: { type: Date, default: Date.now }
}, { timestamps: true });
export const AccountInfo = model("AccountInfo", AccountInfoSchema);
export default AccountInfo;
//# sourceMappingURL=AccountInfo.js.map