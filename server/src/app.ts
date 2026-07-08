import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import aiRoutes from "./routes/aiRoutes";
import authRoutes from "./routes/authRoutes";
import carSearchRoutes from "./routes/carSearchRoutes";
import dealerTimelineRoutes from "./routes/dealerTimelineRoutes";
import dealerSeedRoutes from "./routes/dealerSeedRoutes";
import messageTemplateRoutes from "./routes/messageTemplateRoutes";
import outreachRoutes from "./routes/outreachRoutes";
import resourceRoutes from "./routes/resourceRoutes";
import { errorHandler, notFound } from "./middleware/errorHandler";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  if (env.NODE_ENV !== "test") app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "dealdesk-server" }));
  app.use(authRoutes);
  app.use(carSearchRoutes);
  app.use(dealerSeedRoutes);
  app.use(resourceRoutes);
  app.use(messageTemplateRoutes);
  app.use(dealerTimelineRoutes);
  app.use(outreachRoutes);
  app.use(aiRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
