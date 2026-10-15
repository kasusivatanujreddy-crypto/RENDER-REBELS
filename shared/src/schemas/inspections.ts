import { z } from "zod";
import { SeveritySchema, FindingCategorySchema } from "./ai.js";

export const DomainSchema = z.enum([
  "industrial_quality",
  "equipment_inspection",
  "document_intelligence",
  "retail_inventory",
  "facility_safety",
  "custom",
]);
export type Domain = z.infer<typeof DomainSchema>;

export const CreateProfileSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  domain: DomainSchema.default("industrial_quality"),
  inspectionObjective: z.string().min(10).max(2000),
  expectedComponents: z.array(z.string().min(1).max(100)).default([]),
  defectCategories: z.array(FindingCategorySchema).default([
    "surface_defect",
    "missing_component",
    "misalignment",
    "structural_damage",
  ]),
  severityThreshold: SeveritySchema.default("medium"),
  minConfidence: z.number().min(0).max(1).default(0.6),
  instructions: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
});
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;

export const CreateInspectionJobSchema = z.object({
  name: z.string().min(3).max(120),
  profileId: z.string().uuid(),
  assetId: z.string().uuid(),
  referenceAssetId: z.string().uuid().optional(),
  objective: z.string().min(5).max(1000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  notes: z.string().max(2000).optional(),
});
export type CreateInspectionJobInput = z.infer<typeof CreateInspectionJobSchema>;

export const FindingReviewDecisionSchema = z.object({
  decision: z.enum(["confirmed", "rejected", "corrected"]),
  correctedCategory: FindingCategorySchema.optional(),
  correctedSeverity: SeveritySchema.optional(),
  reviewerNotes: z.string().max(2000).optional(),
});
export type FindingReviewDecisionInput = z.infer<typeof FindingReviewDecisionSchema>;

export const CreateIncidentSchema = z.object({
  findingId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(4000).optional(),
  severity: SeveritySchema,
  status: z.enum(["open", "in_progress", "resolved", "dismissed"]).default("open"),
  assignedTo: z.string().optional(),
  recommendedAction: z.string().max(2000).optional(),
  dueAt: z.string().optional(),
});
export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;

export const UpdateIncidentSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "dismissed"]).optional(),
  assignedTo: z.string().nullable().optional(),
  resolutionNotes: z.string().max(4000).optional(),
});
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;
