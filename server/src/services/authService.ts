import bcrypt from "bcrypt";
import { User } from "../models/User";
import { HttpError } from "../utils/httpError";
import { signToken } from "../middleware/auth";

export async function register(email: string, password: string) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new HttpError(409, "Email is already registered");
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });
  return { token: signToken({ id: user.id, email: user.email }), user: { id: user.id, email: user.email } };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new HttpError(401, "Invalid credentials");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials");
  return { token: signToken({ id: user.id, email: user.email }), user: { id: user.id, email: user.email } };
}
