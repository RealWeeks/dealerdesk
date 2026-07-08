import mongoose, { Schema } from "mongoose";

export interface UserDocument extends mongoose.Document {
  email: string;
  passwordHash: string;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>("User", userSchema);
