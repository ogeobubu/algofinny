import { type Document, type Types } from "mongoose";
export type TransactionType = "credit" | "debit";
export interface ITransaction extends Document {
    userId: Types.ObjectId;
    date: Date;
    time?: string;
    description: string;
    type: TransactionType;
    amount: number;
    balance_after?: number;
    channel?: string;
    transaction_reference?: string;
    counterparty?: string | null;
    category: string;
    legacy_type?: "income" | "expense";
}
export declare const Transaction: import("mongoose").Model<ITransaction, {}, {}, {}, Document<unknown, {}, ITransaction, {}, {}> & ITransaction & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Transaction;
