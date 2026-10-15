import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load root and backend .env files
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default("4000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_BASE_URL: z.string().default("http://localhost:4000/api/v1"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  // Gemini
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  // Supabase
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Storage
  STORAGE_BUCKET_ORIGINALS: z.string().default("visioniq-originals"),
  STORAGE_BUCKET_DERIVED: z.string().default("visioniq-derived"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;

export const isSupabaseConfigured = Boolean(
  config.SUPABASE_URL && (config.SUPABASE_ANON_KEY || config.SUPABASE_SERVICE_ROLE_KEY)
);

export const isGeminiConfigured = Boolean(config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== "");
