import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../services/storage.service.js";
import { db } from "../services/db.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only JPEG, PNG, and WebP images are supported for MVP inspection."));
    }
  },
});

export const assetsRouter = Router();

// Upload image asset
assetsRouter.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_FILE", message: "No visual file provided in upload request." },
      });
    }

    const orgId = req.organizationId!;
    const userId = req.user!.id;

    // Save to storage
    const saved = await storage.saveFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      orgId
    );

    const assetRecord = {
      id: uuidv4(),
      organization_id: orgId,
      uploaded_by: userId,
      original_filename: req.file.originalname,
      storage_path: saved.storagePath,
      mime_type: req.file.mimetype,
      asset_type: "image",
      size_bytes: saved.sizeBytes,
      sha256_hash: saved.sha256,
      status: "ready",
      access_url: saved.accessUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const persisted = await db.createAsset(assetRecord);

    res.status(201).json({
      success: true,
      data: persisted,
    });
  } catch (err) {
    next(err);
  }
});

// List assets
assetsRouter.get("/", async (req, res, next) => {
  try {
    const orgId = req.organizationId!;
    const assets = await db.getAssets(orgId);
    res.json({
      success: true,
      data: assets,
    });
  } catch (err) {
    next(err);
  }
});

// Get asset by ID
assetsRouter.get("/:id", async (req, res, next) => {
  try {
    const asset = await db.getAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Asset not found." },
      });
    }
    res.json({
      success: true,
      data: asset,
    });
  } catch (err) {
    next(err);
  }
});

// Direct raw file serving for local fallback storage
assetsRouter.get("/raw/:orgId/:filename", (req, res) => {
  const { orgId, filename } = req.params;
  const filePath = path.resolve(process.cwd(), "./tmp/storage", orgId, filename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).send("File not found");
});
