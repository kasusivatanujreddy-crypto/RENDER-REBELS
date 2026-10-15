import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/index.js";
import { db } from "../services/db.service.js";
import { storage } from "../services/storage.service.js";
import { aiVision } from "../services/ai-vision.service.js";
import { CreateInspectionJobSchema } from "@visioniq/shared";

export const inspectionsRouter = Router();

// Asynchronous execution runner for an inspection job
async function executeInspectionJob(jobId: string) {
  const startTime = Date.now();
  console.log(`[Inspection Pipeline] Starting job: ${jobId}`);

  try {
    const job = await db.getJob(jobId);
    if (!job) return;

    await db.updateJob(jobId, { status: "processing", progress: 20 });

    const asset = await db.getAsset(job.asset_id);
    const profile = await db.getInspectionProfile(job.profile_id);

    if (!asset) {
      throw new Error(`Asset ${job.asset_id} not found.`);
    }

    const imageBuffer = await storage.getFileBuffer(asset.storage_path);
    if (!imageBuffer) {
      throw new Error(`Could not load visual asset file from storage path: ${asset.storage_path}`);
    }

    await db.updateJob(jobId, { progress: 50 });

    // Invoke Vision AI service
    const analysis = await aiVision.analyzeImage(imageBuffer, asset.mime_type, {
      profileName: profile?.name || "General Industrial Inspection",
      inspectionObjective: job.objective || profile?.inspection_objective || "Surface defect detection",
      expectedComponents: profile?.expected_components || [],
      instructions: profile?.instructions || "",
    });

    await db.updateJob(jobId, { progress: 80 });

    // Persist detections
    const detectionsToInsert = (analysis.detections || []).map((det) => ({
      id: uuidv4(),
      organization_id: job.organization_id,
      job_id: jobId,
      asset_id: job.asset_id,
      label: det.label,
      description: det.description || null,
      confidence: det.confidence,
      bounding_box: det.boundingBox || null,
      attributes: det.attributes || {},
      source_type: det.sourceType || "model",
      created_at: new Date().toISOString(),
    }));
    await db.createDetections(detectionsToInsert);

    // Persist findings
    const findingsToInsert = (analysis.findings || []).map((f) => ({
      id: uuidv4(),
      organization_id: job.organization_id,
      job_id: jobId,
      asset_id: job.asset_id,
      category: f.category,
      title: f.title,
      description: f.description,
      severity: f.severity,
      confidence: f.confidence || null,
      bounding_box: f.boundingBox || null,
      evidence: f.evidence || [],
      recommended_action: f.recommendedAction || "Inspect and verify",
      uncertainty: f.uncertainty || null,
      review_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    await db.createFindings(findingsToInsert);

    const durationMs = Date.now() - startTime;
    await db.updateJob(jobId, {
      status: "completed",
      progress: 100,
      processing_duration_ms: durationMs,
      result_summary: {
        imageSummary: analysis.imageSummary,
        totalDetections: detectionsToInsert.length,
        totalFindings: findingsToInsert.length,
        limitations: analysis.limitations,
      },
    });

    console.log(`[Inspection Pipeline] Job ${jobId} completed successfully in ${durationMs}ms with ${findingsToInsert.length} findings.`);
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[Inspection Pipeline] Job ${jobId} failed:`, err);
    await db.updateJob(jobId, {
      status: "failed",
      progress: 100,
      processing_duration_ms: durationMs,
      error_message: err.message || "Visual inspection processing failed",
    });
  }
}

// List inspection jobs
inspectionsRouter.get("/", async (req, res, next) => {
  try {
    const orgId = req.organizationId!;
    const jobs = await db.getJobs(orgId);
    res.json({
      success: true,
      data: jobs,
    });
  } catch (err) {
    next(err);
  }
});

// Create and trigger an inspection job
inspectionsRouter.post("/", async (req, res, next) => {
  try {
    const validated = CreateInspectionJobSchema.parse(req.body);
    const orgId = req.organizationId!;
    const userId = req.user!.id;

    const profile = await db.getInspectionProfile(validated.profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Inspection profile not found." },
      });
    }

    const asset = await db.getAsset(validated.assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Visual asset not found." },
      });
    }

    const jobId = uuidv4();
    const newJob = {
      id: jobId,
      organization_id: orgId,
      profile_id: validated.profileId,
      asset_id: validated.assetId,
      reference_asset_id: validated.referenceAssetId || null,
      created_by: userId,
      name: validated.name,
      objective: validated.objective || profile.inspection_objective,
      status: "queued",
      priority: validated.priority,
      progress: 0,
      model_provider: "google",
      model_name: config.GEMINI_MODEL,
      result_summary: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const savedJob = await db.createJob(newJob);

    // Asynchronously launch pipeline
    setImmediate(() => {
      executeInspectionJob(jobId);
    });

    res.status(202).json({
      success: true,
      data: savedJob,
      message: "Inspection job accepted and queued for AI vision analysis.",
    });
  } catch (err) {
    next(err);
  }
});

// Get job details with detections and findings
inspectionsRouter.get("/:id", async (req, res, next) => {
  try {
    const job = await db.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Inspection job not found." },
      });
    }

    const detections = await db.getDetectionsForJob(job.id);
    const findings = await db.getFindingsForJob(job.id);

    res.json({
      success: true,
      data: {
        ...job,
        detections,
        findings,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get job status
inspectionsRouter.get("/:id/status", async (req, res, next) => {
  try {
    const job = await db.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Inspection job not found." },
      });
    }

    res.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        durationMs: job.processing_duration_ms,
        errorMessage: job.error_message,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Re-run job
inspectionsRouter.post("/:id/run", async (req, res, next) => {
  try {
    const job = await db.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Inspection job not found." },
      });
    }

    await db.updateJob(job.id, {
      status: "queued",
      progress: 0,
      error_message: null,
    });

    setImmediate(() => {
      executeInspectionJob(job.id);
    });

    res.json({
      success: true,
      message: "Job restarted and queued for processing.",
    });
  } catch (err) {
    next(err);
  }
});
