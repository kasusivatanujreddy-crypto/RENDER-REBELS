import { FindingCategory, Severity } from "../schemas/ai.js";

export const CATEGORY_LABELS: Record<FindingCategory, string> = {
  surface_defect: "Surface Defect / Scratch",
  missing_component: "Missing Component",
  misalignment: "Misaligned Part",
  structural_damage: "Structural Damage / Dent",
  unexpected_object: "Foreign / Unexpected Object",
  appearance_mismatch: "Appearance Mismatch",
  text_mismatch: "Label / Text Mismatch",
  process_deviation: "Process Deviation",
  unknown_anomaly: "Unknown Anomaly",
};

export const SEVERITY_COLORS: Record<
  Severity,
  { bg: string; text: string; border: string; badge: string; hex: string }
> = {
  low: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    hex: "#3b82f6",
  },
  medium: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    hex: "#f59e0b",
  },
  high: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    hex: "#f97316",
  },
  critical: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    hex: "#f43f5e",
  },
};

export const DEFAULT_PROFILES = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Industrial PCBA & Electronics Quality Inspection",
    domain: "industrial_quality",
    inspectionObjective:
      "Inspect printed circuit board assembly for solder bridge, missing capacitor/resistor, component misalignment, surface burn, or foreign debris.",
    expectedComponents: ["Capacitor", "IC Chip", "Resistor", "Solder Joint", "Connector"],
    defectCategories: [
      "surface_defect",
      "missing_component",
      "misalignment",
      "structural_damage",
      "unexpected_object",
    ],
    severityThreshold: "medium",
    minConfidence: 0.65,
    instructions:
      "Strictly check solder pads and chip alignments. Flag any bridging, lifted pins, or cracked components as high/critical severity.",
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Precision Metal & Casting Surface Integrity",
    domain: "industrial_quality",
    inspectionObjective:
      "Detect surface scratches, porosity, cracks, burrs, dents, or machining irregularities on precision fabricated metal components.",
    expectedComponents: ["Casting Body", "Machined Bore", "Mounting Flange", "Bevel Edge"],
    defectCategories: [
      "surface_defect",
      "structural_damage",
      "appearance_mismatch",
    ],
    severityThreshold: "low",
    minConfidence: 0.6,
    instructions:
      "Examine surface texture and reflection. Differentiate between normal tooling marks and anomalous cracks or gouges.",
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Packaging, Seal & Label Integrity",
    domain: "industrial_quality",
    inspectionObjective:
      "Verify container cap tightness, seal continuity, label positioning, tear presence, and barcode legibility.",
    expectedComponents: ["Cap", "Seal Band", "Primary Label", "Bottle Neck"],
    defectCategories: [
      "misalignment",
      "missing_component",
      "surface_defect",
      "text_mismatch",
    ],
    severityThreshold: "medium",
    minConfidence: 0.7,
    instructions:
      "Ensure seals are unbroken and caps are seated completely horizontal. Check that labels are not skewed beyond 5 degrees.",
    isActive: true,
  },
];
