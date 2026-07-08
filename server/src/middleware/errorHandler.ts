import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "Not found"));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (typeof err === "object" && err && "code" in err && (err as { code: number }).code === 11000) {
    return res.status(409).json({ error: "Duplicate record" });
  }
  if (typeof err === "object" && err && "name" in err && (err as { name: string }).name === "CastError") {
    return res.status(400).json({ error: "Invalid id" });
  }
  return res.status(500).json({ error: "Internal server error" });
}
