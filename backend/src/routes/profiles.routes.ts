import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../services/db.service.js";
import { CreateProfileSchema } from "@visioniq/shared";

export const profilesRouter = Router();

profilesRouter.get("/", async (req, res, next) => {
  try {
    const orgId = req.organizationId!;
    const profiles = await db.getInspectionProfiles(orgId);
    res.json({
      success: true,
      data: profiles,
    });
  } catch (err) {
    next(err);
  }
});

profilesRouter.get("/:id", async (req, res, next) => {
  try {
    const profile = await db.getInspectionProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Inspection profile not found." },
      });
    }
    res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
});

profilesRouter.post("/", async (req, res, next) => {
  try {
    const validated = CreateProfileSchema.parse(req.body);
    const orgId = req.organizationId!;
    const userId = req.user!.id;

    const newProfile = {
      id: uuidv4(),
      organization_id: orgId,
      name: validated.name,
      description: validated.description || null,
      domain: validated.domain,
      inspection_objective: validated.inspectionObjective,
      expected_components: validated.expectedComponents,
      defect_categories: validated.defectCategories,
      severity_threshold: validated.severityThreshold,
      min_confidence: validated.minConfidence,
      instructions: validated.instructions || null,
      is_active: validated.isActive,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await db.createInspectionProfile(newProfile);
    res.status(201).json({
      success: true,
      data: saved,
    });
  } catch (err) {
    next(err);
  }
});
