import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../services/db.service.js";
import { CreateIncidentSchema, UpdateIncidentSchema } from "@visioniq/shared";

export const incidentsRouter = Router();

// List incidents
incidentsRouter.get("/", async (req, res, next) => {
  try {
    const orgId = req.organizationId!;
    const incidents = await db.getIncidents(orgId);
    res.json({
      success: true,
      data: incidents,
    });
  } catch (err) {
    next(err);
  }
});

// Create incident from finding
incidentsRouter.post("/", async (req, res, next) => {
  try {
    const validated = CreateIncidentSchema.parse(req.body);
    const orgId = req.organizationId!;
    const userId = req.user!.id;

    const newIncident = {
      id: uuidv4(),
      organization_id: orgId,
      finding_id: validated.findingId,
      title: validated.title,
      description: validated.description || null,
      severity: validated.severity,
      status: validated.status || "open",
      assigned_to: validated.assignedTo || null,
      recommended_action: validated.recommendedAction || null,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await db.createIncident(newIncident);
    res.status(201).json({
      success: true,
      data: saved,
      message: "Incident successfully created from inspection finding.",
    });
  } catch (err) {
    next(err);
  }
});

// Update incident status or resolution notes
incidentsRouter.patch("/:id", async (req, res, next) => {
  try {
    const validated = UpdateIncidentSchema.parse(req.body);
    const incidentId = req.params.id;

    const updated = await db.updateIncident(incidentId, validated);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Incident not found." },
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});
