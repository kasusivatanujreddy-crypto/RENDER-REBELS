import { app } from "./app.js";
import { config, isSupabaseConfigured, isGeminiConfigured } from "./config/index.js";

const server = app.listen(config.PORT, () => {
  console.log("==================================================================");
  console.log(`🚀 VisionIQ Backend API Server running at http://localhost:${config.PORT}`);
  console.log(`📦 Environment: ${config.NODE_ENV}`);
  console.log(`🧠 AI Vision Provider: ${isGeminiConfigured ? `Gemini Active (${config.GEMINI_MODEL})` : "Local Benchmark Fixture (GEMINI_API_KEY unconfigured)"}`);
  console.log(`🗄️ Database & Storage: ${isSupabaseConfigured ? "Connected to Supabase" : "Local Development Mode (./tmp/visioniq-store.json)"}`);
  console.log("==================================================================");
});

process.on("SIGINT", () => {
  console.log("\nGracefully shutting down VisionIQ server...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("\nGracefully shutting down VisionIQ server...");
  server.close(() => process.exit(0));
});
