import { type Document } from "mongoose";
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
}
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default User;
