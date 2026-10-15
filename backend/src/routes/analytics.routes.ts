import { Router } from "express";
import { db } from "../services/db.service.js";

export const analyticsRouter = Router();

analyticsRouter.get("/overview", async (req, res, next) => {
  try {
    const orgId = req.organizationId!;
    const metrics = await db.getAnalytics(orgId);
    res.json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    next(err);
  }
});

export const reportsRouter = Router();

reportsRouter.get("/export-csv", async (req, res, next) => {
  try {
    const orgId = req.organizationId!;
    const jobs = await db.getJobs(orgId);

    // Build CSV
    const headers = ["Job ID", "Job Name", "Status", "Priority", "Duration (ms)", "Created At"];
    const rows = jobs.map((j: any) => [
      `"${j.id}"`,
      `"${j.name.replace(/"/g, '""')}"`,
      `"${j.status}"`,
      `"${j.priority}"`,
      j.processing_duration_ms || 0,
      `"${j.created_at}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=visioniq-inspections-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});
