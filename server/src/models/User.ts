import { Schema, model, type Document, type Types } from "mongoose"

export interface IUser extends Document {
  _id: Types.ObjectId
  name: string
  email: string
  password: string
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    password: { type: String, required: true },
  },
  { timestamps: true }
)

export const User = model<IUser>("User", UserSchema)
export default User
