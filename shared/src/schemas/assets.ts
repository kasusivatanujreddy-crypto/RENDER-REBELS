import { z } from "zod";

export const AssetTypeSchema = z.enum(["image", "video", "document", "frame"]);
export type AssetType = z.infer<typeof AssetTypeSchema>;

export const VisualAssetSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  uploadedBy: z.string().uuid(),
  originalFilename: z.string(),
  storagePath: z.string(),
  mimeType: z.string(),
  assetType: AssetTypeSchema,
  sizeBytes: z.number().int().positive(),
  sha256Hash: z.string().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  status: z.enum(["uploaded", "validating", "ready", "processing", "failed", "deleted"]).default("ready"),
  createdAt: z.string(),
  updatedAt: z.string(),
  accessUrl: z.string().optional(),
});
export type VisualAsset = z.infer<typeof VisualAssetSchema>;

export const UploadAssetSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/jpg"]),
  sizeBytes: z.number().max(15 * 1024 * 1024, "Image exceeds maximum allowed size of 15MB"),
});
