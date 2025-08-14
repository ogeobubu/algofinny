import { type Document, type Types } from "mongoose";
export interface IAccountInfo extends Document {
    userId: Types.ObjectId;
    account_name: string;
    account_number: string;
    bank_name: string;
    account_type: string;
    currency: string;
    statement_period: {
        start_date: Date;
        end_date: Date;
    };
    opening_balance: number;
    closing_balance: number;
    total_debits: number;
    total_credits: number;
    last_updated: Date;
}
export declare const AccountInfo: import("mongoose").Model<IAccountInfo, {}, {}, {}, Document<unknown, {}, IAccountInfo, {}, {}> & IAccountInfo & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default AccountInfo;
