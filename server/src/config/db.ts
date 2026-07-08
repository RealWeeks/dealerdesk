import mongoose from "mongoose";
import { env } from "./env";

export async function connectDb(uri = env.MONGODB_URI) {
  await mongoose.connect(uri);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
