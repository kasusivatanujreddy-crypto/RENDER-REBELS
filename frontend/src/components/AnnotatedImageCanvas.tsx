import React, { useState, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Layers, Maximize2 } from "lucide-react";
import { SEVERITY_COLORS, CATEGORY_LABELS } from "@visioniq/shared";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Finding {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence?: number | null;
  boundingBox?: BoundingBox | null;
  reviewStatus?: string;
}

interface Detection {
  id?: string;
  label: string;
  confidence?: number | null;
  boundingBox?: BoundingBox | null;
}

interface Props {
  imageUrl: string;
  findings: Finding[];
  detections?: Detection[];
  selectedFindingId?: string | null;
  onSelectFinding?: (id: string) => void;
}

export const AnnotatedImageCanvas: React.FC<Props> = ({
  imageUrl,
  findings,
  detections = [],
  selectedFindingId,
  onSelectFinding,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showFindings, setShowFindings] = useState(true);
  const [showDetections, setShowDetections] = useState(true);
  const [hoveredFindingId, setHoveredFindingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-850 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 font-semibold text-slate-200">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span>Inspection Canvas</span>
          </span>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => setShowFindings(!showFindings)}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              showFindings
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {showFindings ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Anomalies ({findings.filter((f) => f.boundingBox).length})</span>
          </button>
          <button
            onClick={() => setShowDetections(!showDetections)}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              showDetections
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {showDetections ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Components ({detections.filter((d) => d.boundingBox).length})</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 font-mono mr-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative overflow-auto max-h-[640px] flex items-center justify-center p-4 bg-slate-950/70 bg-grid-pattern"
      >
        <div
          className="relative inline-block transition-transform duration-150 origin-center select-none"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Base Inspection Image */}
          <img
            src={imageUrl}
            alt="Inspected target asset"
            className="block max-w-full max-h-[580px] object-contain rounded-lg shadow-md border border-slate-800"
            draggable={false}
          />

          {/* SVG Overlay for Bounding Boxes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Detection Bounding Boxes (Neutral Blue/Slate) */}
            {showDetections &&
              detections.map((det, idx) => {
                if (!det.boundingBox) return null;
                const { x, y, width, height } = det.boundingBox;
                return (
                  <g key={`det-${idx}`}>
                    <rect
                      x={`${x * 100}%`}
                      y={`${y * 100}%`}
                      width={`${width * 100}%`}
                      height={`${height * 100}%`}
                      fill="rgba(14, 165, 233, 0.05)"
                      stroke="#0ea5e9"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      className="transition-all"
                    />
                    <text
                      x={`${x * 100}%`}
                      y={`${Math.max(y * 100 - 1, 3)}%`}
                      fill="#38bdf8"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      className="font-medium bg-slate-900"
                    >
                      {det.label} {det.confidence ? `(${Math.round(det.confidence * 100)}%)` : ""}
                    </text>
                  </g>
                );
              })}

            {/* Findings Bounding Boxes (Color-coded by severity) */}
            {showFindings &&
              findings.map((finding) => {
                if (!finding.boundingBox) return null;
                const { x, y, width, height } = finding.boundingBox;
                const colorHex = SEVERITY_COLORS[finding.severity]?.hex || "#f59e0b";
                const isSelected = selectedFindingId === finding.id;
                const isHovered = hoveredFindingId === finding.id;

                return (
                  <g
                    key={finding.id}
                    className="cursor-pointer pointer-events-auto"
                    onClick={() => onSelectFinding && onSelectFinding(finding.id)}
                    onMouseEnter={() => setHoveredFindingId(finding.id)}
                    onMouseLeave={() => setHoveredFindingId(null)}
                  >
                    {/* Bounding box glow when active or hovered */}
                    {(isSelected || isHovered) && (
                      <rect
                        x={`${x * 100}%`}
                        y={`${y * 100}%`}
                        width={`${width * 100}%`}
                        height={`${height * 100}%`}
                        fill="none"
                        stroke={colorHex}
                        strokeWidth="8"
                        strokeOpacity="0.3"
                        className="animate-pulse"
                      />
                    )}

                    {/* Primary Bounding Box */}
                    <rect
                      x={`${x * 100}%`}
                      y={`${y * 100}%`}
                      width={`${width * 100}%`}
                      height={`${height * 100}%`}
                      fill={isHovered || isSelected ? `${colorHex}22` : `${colorHex}11`}
                      stroke={colorHex}
                      strokeWidth={isSelected ? "3" : isHovered ? "2.5" : "1.8"}
                      className="transition-all duration-150"
                    />

                    {/* Corner Reticle Markers */}
                    <circle cx={`${x * 100}%`} cy={`${y * 100}%`} r="3" fill={colorHex} />
                    <circle cx={`${(x + width) * 100}%`} cy={`${y * 100}%`} r="3" fill={colorHex} />
                    <circle cx={`${x * 100}%`} cy={`${(y + height) * 100}%`} r="3" fill={colorHex} />
                    <circle cx={`${(x + width) * 100}%`} cy={`${(y + height) * 100}%`} r="3" fill={colorHex} />
                  </g>
                );
              })}
          </svg>

          {/* Floating Tooltip for Hovered Finding */}
          {hoveredFindingId && (
            (() => {
              const finding = findings.find((f) => f.id === hoveredFindingId);
              if (!finding || !finding.boundingBox) return null;
              const { x, y, height } = finding.boundingBox;
              const severityBadge = SEVERITY_COLORS[finding.severity]?.badge;

              return (
                <div
                  className="absolute z-20 pointer-events-none transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-900/95 border border-slate-700 backdrop-blur-md rounded-lg shadow-xl text-left w-64 text-xs"
                  style={{
                    left: `${(x + finding.boundingBox.width / 2) * 100}%`,
                    top: `${(y + height) * 100}%`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${severityBadge}`}>
                      {finding.severity}
                    </span>
                    {finding.confidence && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        {Math.round(finding.confidence * 100)}% conf
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-100 truncate">{finding.title}</div>
                  <div className="text-slate-400 text-[11px] truncate">
                    {CATEGORY_LABELS[finding.category as keyof typeof CATEGORY_LABELS] || finding.category}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-850/80 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="text-slate-500 font-medium">Severity Legend:</span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Critical</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span>High</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Medium</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>Low</span>
          </span>
        </div>
        <div>
          <span className="text-slate-500">Click any box to inspect & review</span>
        </div>
      </div>
    </div>
  );
};
