import fs from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "../config/index.js";
import { DEFAULT_PROFILES } from "@visioniq/shared";

// Local in-memory / file-backed fallback store interface
interface VisionIQStore {
  organizations: any[];
  organization_members: any[];
  profiles: any[];
  inspection_profiles: any[];
  visual_assets: any[];
  inspection_jobs: any[];
  detections: any[];
  findings: any[];
  incidents: any[];
  audit_logs: any[];
}

const STORE_PATH = path.resolve(process.cwd(), "./tmp/visioniq-store.json");

function initDefaultStore(): VisionIQStore {
  return {
    organizations: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "VisionIQ Industrial Demo Workspace",
        slug: "visioniq-demo",
        settings: { domain: "industrial_quality" },
        created_at: new Date().toISOString(),
      },
    ],
    organization_members: [
      {
        organization_id: "00000000-0000-0000-0000-000000000001",
        user_id: "00000000-0000-0000-0000-000000000099",
        role: "owner",
        joined_at: new Date().toISOString(),
      },
    ],
    profiles: [
      {
        id: "00000000-0000-0000-0000-000000000099",
        display_name: "Lead Inspection Engineer",
        avatar_url: null,
      },
    ],
    inspection_profiles: DEFAULT_PROFILES.map((p) => ({
      ...p,
      organization_id: "00000000-0000-0000-0000-000000000001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
    visual_assets: [],
    inspection_jobs: [],
    detections: [],
    findings: [],
    incidents: [],
    audit_logs: [],
  };
}

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private localStore: VisionIQStore;

  constructor() {
    if (isSupabaseConfigured && config.SUPABASE_URL) {
      const key = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY!;
      this.supabase = createClient(config.SUPABASE_URL, key);
      console.log("[DB] Initialized with Supabase client:", config.SUPABASE_URL);
    } else {
      console.log("[DB] Operating in Local Fallback Database Mode (storage: ./tmp/visioniq-store.json)");
    }

    // Initialize local store
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(STORE_PATH)) {
      try {
        const content = fs.readFileSync(STORE_PATH, "utf-8");
        this.localStore = JSON.parse(content);
      } catch (err) {
        console.warn("[DB] Failed reading existing store, initializing default:", err);
        this.localStore = initDefaultStore();
        this.persistLocalStore();
      }
    } else {
      this.localStore = initDefaultStore();
      this.persistLocalStore();
    }
  }

  private persistLocalStore() {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.localStore, null, 2), "utf-8");
    } catch (e) {
      console.error("[DB] Could not write store to disk:", e);
    }
  }

  // --- Organizations ---
  async getOrganizations() {
    if (this.supabase) {
      const { data, error } = await this.supabase.from("organizations").select("*");
      if (!error && data && data.length > 0) return data;
    }
    return this.localStore.organizations;
  }

  async getOrganization(id: string) {
    if (this.supabase) {
      const { data } = await this.supabase.from("organizations").select("*").eq("id", id).single();
      if (data) return data;
    }
    return this.localStore.organizations.find((o) => o.id === id) || this.localStore.organizations[0];
  }

  // --- Profiles ---
  async getInspectionProfiles(orgId: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from("inspection_profiles")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true);
      if (!error && data && data.length > 0) return data;
    }
    return this.localStore.inspection_profiles.filter((p) => p.organization_id === orgId || !p.organization_id);
  }

  async getInspectionProfile(id: string) {
    if (this.supabase) {
      const { data } = await this.supabase.from("inspection_profiles").select("*").eq("id", id).single();
      if (data) return data;
    }
    return this.localStore.inspection_profiles.find((p) => p.id === id) || null;
  }

  async createInspectionProfile(profile: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from("inspection_profiles").insert(profile).select().single();
      if (!error && data) return data;
    }
    this.localStore.inspection_profiles.push(profile);
    this.persistLocalStore();
    return profile;
  }

  // --- Visual Assets ---
  async createAsset(asset: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from("visual_assets").insert(asset).select().single();
      if (!error && data) return data;
    }
    this.localStore.visual_assets.unshift(asset);
    this.persistLocalStore();
    return asset;
  }

  async getAssets(orgId: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from("visual_assets")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    }
    return this.localStore.visual_assets.filter((a) => a.organization_id === orgId);
  }

  async getAsset(id: string) {
    if (this.supabase) {
      const { data } = await this.supabase.from("visual_assets").select("*").eq("id", id).single();
      if (data) return data;
    }
    return this.localStore.visual_assets.find((a) => a.id === id) || null;
  }

  // --- Inspection Jobs ---
  async createJob(job: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from("inspection_jobs").insert(job).select().single();
      if (!error && data) return data;
    }
    this.localStore.inspection_jobs.unshift(job);
    this.persistLocalStore();
    return job;
  }

  async updateJob(id: string, updates: any) {
    updates.updated_at = new Date().toISOString();
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from("inspection_jobs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const idx = this.localStore.inspection_jobs.findIndex((j) => j.id === id);
    if (idx !== -1) {
      this.localStore.inspection_jobs[idx] = { ...this.localStore.inspection_jobs[idx], ...updates };
      this.persistLocalStore();
      return this.localStore.inspection_jobs[idx];
    }
    return null;
  }

  async getJobs(orgId: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from("inspection_jobs")
        .select("*, visual_assets:visual_assets!inspection_jobs_asset_id_fkey(original_filename, mime_type, storage_path), inspection_profiles(name, domain)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    }
    // Enrich local jobs
    return this.localStore.inspection_jobs
      .filter((j) => j.organization_id === orgId)
      .map((job) => {
        const asset = this.localStore.visual_assets.find((a) => a.id === job.asset_id);
        const profile = this.localStore.inspection_profiles.find((p) => p.id === job.profile_id);
        const findings = this.localStore.findings.filter((f) => f.job_id === job.id);
        return {
          ...job,
          visual_assets: asset || null,
          inspection_profiles: profile || null,
          findings_count: findings.length,
          critical_findings_count: findings.filter((f) => f.severity === "critical").length,
        };
      });
  }

  async getJob(id: string) {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from("inspection_jobs")
        .select("*, visual_assets:visual_assets!inspection_jobs_asset_id_fkey(*), inspection_profiles(*)")
        .eq("id", id)
        .single();
      if (!error && data) return data;
    }
    const job = this.localStore.inspection_jobs.find((j) => j.id === id);
    if (!job) return null;
    const asset = this.localStore.visual_assets.find((a) => a.id === job.asset_id);
    const profile = this.localStore.inspection_profiles.find((p) => p.id === job.profile_id);
    return {
      ...job,
      visual_assets: asset || null,
      inspection_profiles: profile || null,
    };
  }

  // --- Detections & Findings ---
  async createDetections(detections: any[]) {
    if (detections.length === 0) return [];
    if (this.supabase) {
      const { data } = await this.supabase.from("detections").insert(detections).select();
      if (data) return data;
    }
    this.localStore.detections.push(...detections);
    this.persistLocalStore();
    return detections;
  }

  async createFindings(findings: any[]) {
    if (findings.length === 0) return [];
    if (this.supabase) {
      const { data } = await this.supabase.from("findings").insert(findings).select();
      if (data) return data;
    }
    this.localStore.findings.push(...findings);
    this.persistLocalStore();
    return findings;
  }

  async getFindingsForJob(jobId: string) {
    if (this.supabase) {
      const { data } = await this.supabase
        .from("findings")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      if (data) return data;
    }
    return this.localStore.findings.filter((f) => f.job_id === jobId);
  }

  async getDetectionsForJob(jobId: string) {
    if (this.supabase) {
      const { data } = await this.supabase.from("detections").select("*").eq("job_id", jobId);
      if (data) return data;
    }
    return this.localStore.detections.filter((d) => d.job_id === jobId);
  }

  async updateFindingReview(
    findingId: string,
    decision: "confirmed" | "rejected" | "corrected",
    options: { correctedCategory?: string; correctedSeverity?: string; notes?: string; reviewerId?: string }
  ) {
    const updates: any = {
      review_status: decision,
      reviewer_notes: options.notes,
      reviewed_by: options.reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (decision === "corrected") {
      if (options.correctedCategory) updates.category = options.correctedCategory;
      if (options.correctedSeverity) updates.severity = options.correctedSeverity;
    }

    if (this.supabase) {
      const { data } = await this.supabase.from("findings").update(updates).eq("id", findingId).select().single();
      if (data) return data;
    }

    const idx = this.localStore.findings.findIndex((f) => f.id === findingId);
    if (idx !== -1) {
      this.localStore.findings[idx] = { ...this.localStore.findings[idx], ...updates };
      this.persistLocalStore();
      return this.localStore.findings[idx];
    }
    return null;
  }

  // --- Incidents ---
  async createIncident(incident: any) {
    if (this.supabase) {
      const { data, error } = await this.supabase.from("incidents").insert(incident).select().single();
      if (!error && data) return data;
    }
    this.localStore.incidents.unshift(incident);
    this.persistLocalStore();
    return incident;
  }

  async getIncidents(orgId: string) {
    if (this.supabase) {
      const { data } = await this.supabase
        .from("incidents")
        .select("*, findings(*)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (data) return data;
    }
    return this.localStore.incidents
      .filter((i) => i.organization_id === orgId)
      .map((inc) => {
        const finding = this.localStore.findings.find((f) => f.id === inc.finding_id);
        return { ...inc, findings: finding || null };
      });
  }

  async updateIncident(id: string, updates: any) {
    updates.updated_at = new Date().toISOString();
    if (updates.status === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }
    if (this.supabase) {
      const { data } = await this.supabase.from("incidents").update(updates).eq("id", id).select().single();
      if (data) return data;
    }
    const idx = this.localStore.incidents.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.localStore.incidents[idx] = { ...this.localStore.incidents[idx], ...updates };
      this.persistLocalStore();
      return this.localStore.incidents[idx];
    }
    return null;
  }

  // --- Analytics Overview ---
  async getAnalytics(orgId: string) {
    const jobs = this.localStore.inspection_jobs.filter((j) => j.organization_id === orgId);
    const findings = this.localStore.findings.filter((f) => f.organization_id === orgId);
    const incidents = this.localStore.incidents.filter((i) => i.organization_id === orgId);

    const severityCounts = {
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
    };

    const categoryCounts: Record<string, number> = {};
    for (const f of findings) {
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
    }

    const completedJobs = jobs.filter((j) => j.status === "completed").length;
    const cleanJobs = jobs.filter((j) => {
      const jf = findings.filter((f) => f.job_id === j.id);
      return j.status === "completed" && jf.length === 0;
    }).length;

    const passRate = completedJobs > 0 ? Math.round((cleanJobs / completedJobs) * 100) : 100;

    return {
      totalInspections: jobs.length,
      completedInspections: completedJobs,
      passRate,
      totalFindings: findings.length,
      openIncidents: incidents.filter((i) => i.status === "open" || i.status === "in_progress").length,
      severityCounts,
      categoryCounts,
      recentJobs: jobs.slice(0, 5),
    };
  }
}

export const db = new DatabaseService();
