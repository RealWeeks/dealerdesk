import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/dealdesk"),
  JWT_SECRET: z.string().default("dev-secret"),
  CORS_ORIGIN: z.string().default("http://localhost:8081"),
  OPENAI_API_KEY: z.string().optional(),
  NODE_ENV: z.string().default("development")
});

export const env = envSchema.parse(process.env);
