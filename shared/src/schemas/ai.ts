import { z } from "zod";

export const SeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const FindingCategorySchema = z.enum([
  "surface_defect",
  "missing_component",
  "misalignment",
  "structural_damage",
  "unexpected_object",
  "appearance_mismatch",
  "text_mismatch",
  "process_deviation",
  "unknown_anomaly",
]);
export type FindingCategory = z.infer<typeof FindingCategorySchema>;

export const BoundingBoxSchema = z
  .object({
    x: z.number().finite().min(0).max(1),
    y: z.number().finite().min(0).max(1),
    width: z.number().finite().gt(0).max(1),
    height: z.number().finite().gt(0).max(1),
  })
  .refine(
    (box) => box.x + box.width <= 1.05 && box.y + box.height <= 1.05,
    {
      message: "Bounding box extends beyond image bounds.",
    }
  );
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const DetectionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  confidence: z.number().finite().min(0).max(1).nullable(),
  boundingBox: BoundingBoxSchema.nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  sourceType: z.enum(["model", "deterministic", "human", "demo_fixture"]).default("model"),
});
export type Detection = z.infer<typeof DetectionSchema>;

export const FindingEvidenceSchema = z.object({
  assetId: z.string().min(1).optional(),
  type: z.enum(["visual_region", "text_region", "frame", "reference_difference", "metadata"]).default("visual_region"),
  boundingBox: BoundingBoxSchema.nullable().optional(),
  description: z.string().max(2000).optional(),
});
export type FindingEvidence = z.infer<typeof FindingEvidenceSchema>;

export const FindingSchema = z.object({
  id: z.string().optional(),
  category: FindingCategorySchema,
  title: z.string().min(2).max(200),
  description: z.string().min(3).max(4000),
  severity: SeveritySchema,
  confidence: z.number().finite().min(0).max(1).nullable().optional(),
  boundingBox: BoundingBoxSchema.nullable().optional(),
  evidence: z.array(FindingEvidenceSchema).default([]),
  recommendedAction: z.string().max(2000).default("Inspect and verify"),
  uncertainty: z.string().max(2000).optional(),
  reviewStatus: z.enum(["pending", "confirmed", "rejected", "corrected"]).default("pending"),
  reviewerNotes: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
});
export type Finding = z.infer<typeof FindingSchema>;

export const AnalysisResultSchema = z.object({
  schemaVersion: z.literal("1.0").default("1.0"),
  status: z.enum(["completed", "insufficient_evidence", "failed"]).default("completed"),
  imageSummary: z.string().max(4000),
  detections: z.array(DetectionSchema).default([]),
  findings: z.array(FindingSchema).default([]),
  limitations: z.array(z.string().max(1000)).default([]),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
