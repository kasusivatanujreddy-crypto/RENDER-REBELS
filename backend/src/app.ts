import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";

// Routes
import { healthRouter, aiRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { profilesRouter } from "./routes/profiles.routes.js";
import { assetsRouter } from "./routes/assets.routes.js";
import { inspectionsRouter } from "./routes/inspections.routes.js";
import { findingsRouter } from "./routes/findings.routes.js";
import { incidentsRouter } from "./routes/incidents.routes.js";
import { analyticsRouter, reportsRouter } from "./routes/analytics.routes.js";

export const app = express();

// Global Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const configured = config.CORS_ORIGINS.split(",").map((s) => s.trim());
    if (
      configured.includes("*") ||
      configured.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Correlation ID middleware
app.use((req, res, next) => {
  req.requestId = (req.headers["x-request-id"] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// Root welcome & portal
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VisionIQ Engine & Workspace</title>
  <style>
    body { background: #090d16; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px; max-width: 520px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
    h1 { color: #38bdf8; margin: 0 0 12px 0; font-size: 26px; font-weight: 800; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #0284c7, #0ea5e9); color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.5); }
    .status { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: #34d399; margin-bottom: 20px; padding: 4px 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 9999px; }
    .dot { width: 8px; height: 8px; background: #34d399; border-radius: 50%; }
  </style>
</head>
<body>
  <div class="card">
    <div class="status"><span class="dot"></span> VisionIQ API Engine Online</div>
    <h1>VisionIQ Operations</h1>
    <p>Operational computer vision & AI anomaly detection backend is running. Gemini 3.8 Flash multimodal inference and Supabase PostgreSQL RLS are active.</p>
    <a href="https://render-rebels.vercel.app/app" class="btn">Open Web Frontend Dashboard &rarr;</a>
  </div>
</body>
</html>`);
});

// Health checks (no auth required)
app.use("/api/v1/health", healthRouter);

// Apply auth & tenant context to all protected routes
app.use(authMiddleware);

// API v1 Routes
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1", authRouter);
app.use("/api/v1/profiles", profilesRouter);
app.use("/api/v1/assets", assetsRouter);
app.use("/api/v1/inspections", inspectionsRouter);
app.use("/api/v1/findings", findingsRouter);
app.use("/api/v1/incidents", incidentsRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/reports", reportsRouter);

// Centralized error handler
app.use(errorHandler);
