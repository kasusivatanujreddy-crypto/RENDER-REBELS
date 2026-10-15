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
  origin: config.CORS_ORIGINS.split(",").map((s) => s.trim()),
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
