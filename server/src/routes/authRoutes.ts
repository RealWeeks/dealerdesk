import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { login, register } from "../services/authService";

const router = Router();
const authSchema = z.object({ email: z.string().email().trim().toLowerCase(), password: z.string().min(8).max(128) });

router.post("/auth/register", async (req, res, next) => {
  try {
    const body = authSchema.parse(req.body);
    res.status(201).json(await register(body.email, body.password));
  } catch (error) {
    next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const body = authSchema.parse(req.body);
    res.json(await login(body.email, body.password));
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
