-- ==============================================================================
-- VisionIQ Seed Data: Demo Organization, Inspection Profiles & Test Fixtures
-- ==============================================================================

-- 1. Demo Organization
INSERT INTO public.organizations (id, name, slug, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'VisionIQ Precision Labs',
    'visioniq-precision-labs',
    '{"domain": "industrial_quality", "tier": "enterprise"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 2. Inspection Profiles
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
