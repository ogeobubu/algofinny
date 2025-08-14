import { Schema, model } from "mongoose";
const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true, trim: true },
    password: { type: String, required: true },
}, { timestamps: true });
export const User = model("User", UserSchema);
export default User;
//# sourceMappingURL=User.js.map