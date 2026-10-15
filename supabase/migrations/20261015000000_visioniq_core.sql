-- ==============================================================================
-- VisionIQ — Comprehensive Supabase Database Migration
-- Version: 20261015000000_visioniq_core.sql
-- Modules: Extensions, Schemas, Tables, Indexes, RLS Policies, Triggers & Seeds
-- ==============================================================================

-- 0. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Core Tables & Schemas
-- ==============================================================================

-- 1.1 Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 160),
    slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'analyst', 'viewer')),
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

-- 1.4 Inspection Profiles
CREATE TABLE IF NOT EXISTS public.inspection_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 160),
    description TEXT,
    domain TEXT NOT NULL CHECK (
        domain IN (
            'industrial_quality',
            'equipment_inspection',
            'document_intelligence',
            'retail_inventory',
            'facility_safety',
            'custom'
        )
    ),
    inspection_objective TEXT NOT NULL,
    expected_components JSONB NOT NULL DEFAULT '[]'::jsonb,
    defect_categories JSONB NOT NULL DEFAULT '["surface_defect", "missing_component", "misalignment", "structural_damage", "unexpected_object"]'::jsonb,
    severity_threshold TEXT NOT NULL DEFAULT 'medium' CHECK (severity_threshold IN ('low', 'medium', 'high', 'critical')),
    min_confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.60 CHECK (min_confidence BETWEEN 0 AND 1),
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inspection_profiles_org ON public.inspection_profiles(organization_id, is_active);

-- 1.5 Visual Assets
CREATE TABLE IF NOT EXISTS public.visual_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    uploaded_by UUID,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    asset_type TEXT NOT NULL DEFAULT 'image' CHECK (asset_type IN ('image', 'video', 'document', 'frame')),
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    sha256_hash TEXT,
    width INTEGER,
    height INTEGER,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('uploaded', 'validating', 'ready', 'processing', 'failed', 'deleted')),
    access_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visual_assets_org_created ON public.visual_assets(organization_id, created_at DESC);

-- 1.6 Inspection Jobs
CREATE TABLE IF NOT EXISTS public.inspection_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.inspection_profiles(id) ON DELETE RESTRICT,
    asset_id UUID NOT NULL REFERENCES public.visual_assets(id) ON DELETE RESTRICT,
    reference_asset_id UUID REFERENCES public.visual_assets(id) ON DELETE SET NULL,
    created_by UUID,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 160),
    objective TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
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

-- 1.7 Detections
CREATE TABLE IF NOT EXISTS public.detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.inspection_jobs(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.visual_assets(id) ON DELETE RESTRICT,
    label TEXT NOT NULL,
    description TEXT,
    confidence NUMERIC(4, 3) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
    bounding_box JSONB, -- normalized { x, y, width, height }
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_type TEXT NOT NULL DEFAULT 'model' CHECK (source_type IN ('model', 'deterministic', 'human', 'demo_fixture')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_detections_job ON public.detections(organization_id, job_id);

-- 1.8 Findings (Anomalies & Quality Observations)
CREATE TABLE IF NOT EXISTS public.findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.inspection_jobs(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.visual_assets(id) ON DELETE RESTRICT,
    category TEXT NOT NULL CHECK (
        category IN (
            'surface_defect',
            'missing_component',
            'misalignment',
            'structural_damage',
            'unexpected_object',
            'appearance_mismatch',
            'text_mismatch',
            'process_deviation',
            'unknown_anomaly'
        )
    ),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence NUMERIC(4, 3) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
    bounding_box JSONB,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_action TEXT DEFAULT 'Inspect and verify',
    uncertainty TEXT,
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed', 'rejected', 'corrected')),
    reviewer_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_findings_job ON public.findings(organization_id, job_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON public.findings(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_findings_review ON public.findings(organization_id, review_status);

-- 1.9 Incidents (Escalated from Findings)
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
    assigned_to UUID,
    recommended_action TEXT,
    resolution_notes TEXT,
    created_by UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON public.incidents(organization_id, status);

-- 1.10 Audit Logs
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
-- 2. Row Level Security (RLS) & Membership Helper
-- ==============================================================================

-- Helper function: verify caller is member of organization or service_role
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT 
        -- Service role always has access
        (auth.jwt() ->> 'role' = 'service_role')
        OR
        -- Allow anonymous/demo access during initial development
        (auth.uid() IS NULL)
        OR
        -- Authenticated member of organization
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = org_id
            AND user_id = auth.uid()
        );
$$;

-- Enable RLS across all tables
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

-- Clean existing policies before recreating to avoid duplicate error on re-run
DROP POLICY IF EXISTS "Organizations access policy" ON public.organizations;
CREATE POLICY "Organizations access policy"
    ON public.organizations FOR ALL
    USING (public.is_org_member(id));

DROP POLICY IF EXISTS "Organization members access policy" ON public.organization_members;
CREATE POLICY "Organization members access policy"
    ON public.organization_members FOR ALL
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "User profiles self access" ON public.profiles;
CREATE POLICY "User profiles self access"
    ON public.profiles FOR ALL
    USING (id = auth.uid() OR auth.uid() IS NULL OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Visual assets org access" ON public.visual_assets;
CREATE POLICY "Visual assets org access"
    ON public.visual_assets FOR ALL
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Inspection profiles org access" ON public.inspection_profiles;
CREATE POLICY "Inspection profiles org access"
    ON public.inspection_profiles FOR ALL
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Inspection jobs org access" ON public.inspection_jobs;
CREATE POLICY "Inspection jobs org access"
    ON public.inspection_jobs FOR ALL
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Detections org access" ON public.detections;
CREATE POLICY "Detections org access"
    ON public.detections FOR ALL
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Findings org access" ON public.findings;
CREATE POLICY "Findings org access"
    ON public.findings FOR ALL
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Incidents org access" ON public.incidents;
CREATE POLICY "Incidents org access"
    ON public.incidents FOR ALL
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Audit logs org access" ON public.audit_logs;
CREATE POLICY "Audit logs org access"
    ON public.audit_logs FOR ALL
    USING (public.is_org_member(organization_id));

-- ==============================================================================
-- 3. Triggers & Automation
-- ==============================================================================

-- Auto-update timestamps trigger
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

-- Auto-provision Profile on new Supabase Auth User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000001', NEW.id, 'analyst')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users if available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ==============================================================================
-- 4. Storage Buckets & Policies
-- ==============================================================================

-- Ensure visioniq storage buckets exist and are publicly readable for fast image rendering
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('visioniq-originals', 'visioniq-originals', true),
    ('visioniq-derived', 'visioniq-derived', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
    -- Public read policy for inspection assets
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'VisionIQ Storage Public Read'
    ) THEN
        CREATE POLICY "VisionIQ Storage Public Read"
            ON storage.objects FOR SELECT
            USING (bucket_id IN ('visioniq-originals', 'visioniq-derived'));
    END IF;

    -- Upload & Modify policy for inspection assets
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'VisionIQ Storage All Access'
    ) THEN
        CREATE POLICY "VisionIQ Storage All Access"
            ON storage.objects FOR ALL
            USING (bucket_id IN ('visioniq-originals', 'visioniq-derived'))
            WITH CHECK (bucket_id IN ('visioniq-originals', 'visioniq-derived'));
    END IF;
END $$;

-- ==============================================================================
-- 5. Seed Data: Default Organization & Industrial Quality Inspection Profiles
-- ==============================================================================

-- 5.1 Default Demo Organization
INSERT INTO public.organizations (id, name, slug, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'VisionIQ Precision Labs',
    'visioniq-precision-labs',
    '{"domain": "industrial_quality", "tier": "enterprise"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 5.2 Preconfigured Inspection Profiles
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
