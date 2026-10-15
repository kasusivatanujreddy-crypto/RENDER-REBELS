-- ==============================================================================
-- VisionIQ — Single-Run Supabase Database Migration
-- Creates all 10 core tables, indexes, triggers, storage, and seed fixtures
-- in ONE single atomic execution without dependencies or policy errors.
-- ==============================================================================

-- 0. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. All 10 Core Tables (In Strict Dependency Order)
-- ==============================================================================

-- 1.1 Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- 1.3 User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 Inspection Profiles (Detection Criteria & Domains)
CREATE TABLE IF NOT EXISTS public.inspection_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    domain TEXT NOT NULL DEFAULT 'industrial_quality',
    inspection_objective TEXT NOT NULL,
    expected_components JSONB NOT NULL DEFAULT '[]'::jsonb,
    defect_categories JSONB NOT NULL DEFAULT '["surface_defect", "missing_component", "misalignment", "structural_damage", "unexpected_object"]'::jsonb,
    severity_threshold TEXT NOT NULL DEFAULT 'medium',
    min_confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.60,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inspection_profiles_org ON public.inspection_profiles(organization_id, is_active);

-- 1.5 Visual Assets (Images & Inspection Media)
CREATE TABLE IF NOT EXISTS public.visual_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    uploaded_by UUID,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    asset_type TEXT NOT NULL DEFAULT 'image',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    sha256_hash TEXT,
    width INTEGER,
    height INTEGER,
    status TEXT NOT NULL DEFAULT 'ready',
    access_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visual_assets_org_created ON public.visual_assets(organization_id, created_at DESC);

-- 1.6 Inspection Jobs (AI Inference Pipeline Execution)
CREATE TABLE IF NOT EXISTS public.inspection_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.inspection_profiles(id) ON DELETE RESTRICT,
    asset_id UUID NOT NULL REFERENCES public.visual_assets(id) ON DELETE RESTRICT,
    reference_asset_id UUID REFERENCES public.visual_assets(id) ON DELETE SET NULL,
    created_by UUID,
    name TEXT NOT NULL,
    objective TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    priority TEXT NOT NULL DEFAULT 'normal',
    progress INTEGER NOT NULL DEFAULT 0,
    model_provider TEXT DEFAULT 'google',
    model_name TEXT DEFAULT 'gemini-2.5-flash',
    processing_duration_ms INTEGER,
    error_message TEXT,
    result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inspection_jobs_org_status ON public.inspection_jobs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_inspection_jobs_org_created ON public.inspection_jobs(organization_id, created_at DESC);

-- 1.7 Detections (Object Detections with Normalized Coordinates)
CREATE TABLE IF NOT EXISTS public.detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.inspection_jobs(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.visual_assets(id) ON DELETE RESTRICT,
    label TEXT NOT NULL,
    description TEXT,
    confidence NUMERIC(4, 3),
    bounding_box JSONB, -- normalized { x, y, width, height }
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_type TEXT NOT NULL DEFAULT 'model',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_detections_job ON public.detections(organization_id, job_id);

-- 1.8 Findings (Anomalies, Defects & Quality Violations)
CREATE TABLE IF NOT EXISTS public.findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.inspection_jobs(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.visual_assets(id) ON DELETE RESTRICT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    confidence NUMERIC(4, 3),
    bounding_box JSONB,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_action TEXT DEFAULT 'Inspect and verify',
    uncertainty TEXT,
    review_status TEXT NOT NULL DEFAULT 'pending',
    reviewer_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_findings_job ON public.findings(organization_id, job_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON public.findings(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_findings_review ON public.findings(organization_id, review_status);

-- 1.9 Incidents (Escalated Findings for Corrective Action)
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    assigned_to UUID,
    recommended_action TEXT,
    resolution_notes TEXT,
    created_by UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON public.incidents(organization_id, status);

-- 1.10 Audit Logs (Full Traceability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);

-- ==============================================================================
-- 2. Row Level Security (RLS) Policies (Clean & Idempotent)
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "allow_all_organizations" ON public.organizations;
    CREATE POLICY "allow_all_organizations" ON public.organizations FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "allow_all_members" ON public.organization_members;
    CREATE POLICY "allow_all_members" ON public.organization_members FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
    CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "allow_all_inspection_profiles" ON public.inspection_profiles;
    CREATE POLICY "allow_all_inspection_profiles" ON public.inspection_profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "allow_all_visual_assets" ON public.visual_assets;
    CREATE POLICY "allow_all_visual_assets" ON public.visual_assets FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "allow_all_inspection_jobs" ON public.inspection_jobs;
    CREATE POLICY "allow_all_inspection_jobs" ON public.inspection_jobs FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "allow_all_detections" ON public.detections;
    CREATE POLICY "allow_all_detections" ON public.detections FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "allow_all_findings" ON public.findings;
    CREATE POLICY "allow_all_findings" ON public.findings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "allow_all_incidents" ON public.incidents;
    CREATE POLICY "allow_all_incidents" ON public.incidents FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "allow_all_audit_logs" ON public.audit_logs;
    CREATE POLICY "allow_all_audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ==============================================================================
-- 3. Automatic Timestamps Triggers
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_inspection_profiles_updated_at ON public.inspection_profiles;
CREATE TRIGGER trg_inspection_profiles_updated_at BEFORE UPDATE ON public.inspection_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_visual_assets_updated_at ON public.visual_assets;
CREATE TRIGGER trg_visual_assets_updated_at BEFORE UPDATE ON public.visual_assets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_inspection_jobs_updated_at ON public.inspection_jobs;
CREATE TRIGGER trg_inspection_jobs_updated_at BEFORE UPDATE ON public.inspection_jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_findings_updated_at ON public.findings;
CREATE TRIGGER trg_findings_updated_at BEFORE UPDATE ON public.findings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON public.incidents;
CREATE TRIGGER trg_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. Storage Buckets Setup (Safely Handled with Exceptions)
-- ==============================================================================

DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
        ('visioniq-originals', 'visioniq-originals', true),
        ('visioniq-derived', 'visioniq-derived', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage bucket initialization notice: %', SQLERRM;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'VisionIQ Storage Public Read'
    ) THEN
        CREATE POLICY "VisionIQ Storage Public Read"
            ON storage.objects FOR SELECT
            USING (bucket_id IN ('visioniq-originals', 'visioniq-derived'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'VisionIQ Storage All Access'
    ) THEN
        CREATE POLICY "VisionIQ Storage All Access"
            ON storage.objects FOR ALL
            USING (bucket_id IN ('visioniq-originals', 'visioniq-derived'))
            WITH CHECK (bucket_id IN ('visioniq-originals', 'visioniq-derived'));
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage object policies notice: %', SQLERRM;
END $$;

-- ==============================================================================
-- 5. Default Workspace & Industrial Inspection Profiles Seed
-- ==============================================================================

-- 5.1 Demo Organization
INSERT INTO public.organizations (id, name, slug, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'VisionIQ Precision Labs',
    'visioniq-precision-labs',
    '{"domain": "industrial_quality", "tier": "enterprise"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 5.2 Demo Workspace Owner
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000099',
    'owner'
) ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 5.3 Demo Engineer Profile
INSERT INTO public.profiles (id, display_name, preferences)
VALUES (
    '00000000-0000-0000-0000-000000000099',
    'Lead Inspection Engineer',
    '{"theme": "dark", "notifications": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 5.4 Industrial Vision Profiles
INSERT INTO public.inspection_profiles (
    id, organization_id, name, description, domain,
    inspection_objective, expected_components, defect_categories,
    severity_threshold, min_confidence, instructions, is_active
) VALUES 
(
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Industrial PCBA & Electronics Quality Inspection',
    'Standard quality inspection profile for high-density SMT and through-hole circuit boards.',
    'industrial_quality',
    'Inspect printed circuit board assembly for solder bridge, missing capacitor/resistor, component misalignment, surface burn, or foreign debris.',
    '["Capacitor", "IC Chip", "Resistor", "Solder Joint", "Connector"]'::jsonb,
    '["surface_defect", "missing_component", "misalignment", "structural_damage", "unexpected_object"]'::jsonb,
    'medium',
    0.65,
    'Strictly check solder pads and chip alignments. Flag any bridging, lifted pins, or cracked components as high/critical severity.',
    true
),
(
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Precision Metal & Casting Surface Integrity',
    'High-resolution surface analysis for aerospace and automotive precision castings.',
    'industrial_quality',
    'Detect surface scratches, porosity, cracks, burrs, dents, or machining irregularities on precision fabricated metal components.',
    '["Casting Body", "Machined Bore", "Mounting Flange", "Bevel Edge"]'::jsonb,
    '["surface_defect", "structural_damage", "appearance_mismatch"]'::jsonb,
    'low',
    0.60,
    'Examine surface texture and reflection. Differentiate between normal tooling marks and anomalous cracks or gouges.',
    true
),
(
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Packaging, Seal & Label Integrity',
    'Inspection profile for pharmaceutical and consumer goods packaging lines.',
    'industrial_quality',
    'Verify container cap tightness, seal continuity, label positioning, tear presence, and barcode legibility.',
    '["Cap", "Seal Band", "Primary Label", "Bottle Neck"]'::jsonb,
    '["misalignment", "missing_component", "surface_defect", "text_mismatch"]'::jsonb,
    'medium',
    0.70,
    'Ensure seals are unbroken and caps are seated completely horizontal. Check that labels are not skewed beyond 5 degrees.',
    true
)
ON CONFLICT (id) DO NOTHING;
