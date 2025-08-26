import mongoose, { Document } from "mongoose";
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    isActive: boolean;
    emailVerified: boolean;
    profile?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        dateOfBirth?: Date;
        avatar?: string;
    };
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default User;
