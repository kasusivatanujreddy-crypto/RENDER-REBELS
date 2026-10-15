import { Router } from "express";
import { aiVision } from "../services/ai-vision.service.js";
import { isSupabaseConfigured, isGeminiConfigured } from "../config/index.js";

export const healthRouter = Router();

healthRouter.get("/live", (req, res) => {
  res.json({ status: "alive", uptime: process.uptime() });
});

healthRouter.get("/ready", (req, res) => {
  res.json({
    status: "ready",
    integrations: {
      supabase: isSupabaseConfigured ? "connected" : "local_fallback",
      gemini: isGeminiConfigured ? "configured" : "unconfigured",
    },
  });
});

export const aiRouter = Router();

aiRouter.get("/capabilities", (req, res) => {
  const capabilities = aiVision.getCapabilityStatus();
  res.json({
    success: true,
    data: capabilities,
  });
});
