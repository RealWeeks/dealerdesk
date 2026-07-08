import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

export interface AuthRequest extends Request<Record<string, string>> {
  user?: { id: string; email: string };
}

export function signToken(user: { id: string; email: string }) {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return next(new HttpError(401, "Authentication required"));
  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid token"));
  }
}
