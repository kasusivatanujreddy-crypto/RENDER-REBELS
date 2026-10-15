import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "../config/index.js";

const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), "./tmp/storage");

export class StorageService {
  private supabase: any = null;

  constructor() {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }

    if (isSupabaseConfigured && config.SUPABASE_URL) {
      const key = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY!;
      this.supabase = createClient(config.SUPABASE_URL, key);
    }
  }

  async saveFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    orgId: string
  ): Promise<{ storagePath: string; sizeBytes: number; sha256: string; accessUrl: string }> {
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const ext = path.extname(originalFilename) || ".jpg";
    const filename = `${orgId}/${sha256.slice(0, 16)}_${Date.now()}${ext}`;

    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from(config.STORAGE_BUCKET_ORIGINALS)
        .upload(filename, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicData } = this.supabase.storage
          .from(config.STORAGE_BUCKET_ORIGINALS)
          .getPublicUrl(filename);

        return {
          storagePath: filename,
          sizeBytes: buffer.length,
          sha256,
          accessUrl: publicData?.publicUrl || `/api/v1/assets/raw/${filename}`,
        };
      }
      console.warn("[Storage] Supabase upload failed, falling back to local storage:", error?.message);
    }

    // Local filesystem storage
    const localSubDir = path.join(LOCAL_STORAGE_DIR, orgId);
    if (!fs.existsSync(localSubDir)) {
      fs.mkdirSync(localSubDir, { recursive: true });
    }

    const localFilePath = path.join(LOCAL_STORAGE_DIR, filename);
    fs.writeFileSync(localFilePath, buffer);

    return {
      storagePath: filename,
      sizeBytes: buffer.length,
      sha256,
      accessUrl: `/api/v1/assets/raw/${filename}`,
    };
  }

  async getFileBuffer(storagePath: string): Promise<Buffer | null> {
    const localFilePath = path.join(LOCAL_STORAGE_DIR, storagePath);
    if (fs.existsSync(localFilePath)) {
      return fs.readFileSync(localFilePath);
    }

    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from(config.STORAGE_BUCKET_ORIGINALS)
        .download(storagePath);
      if (!error && data) {
        const arrayBuf = await data.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    }
    return null;
  }
}

export const storage = new StorageService();
