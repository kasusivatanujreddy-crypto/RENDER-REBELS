import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ScanEye,
  CheckCircle2,
  XCircle,
  Edit3,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowLeft,
  ShieldAlert,
  ChevronRight,
  Info,
  Check,
} from "lucide-react";
import { api } from "../lib/api-client";
import { AnnotatedImageCanvas } from "../components/AnnotatedImageCanvas";
import { SEVERITY_COLORS, CATEGORY_LABELS } from "@visioniq/shared";

export const InspectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [reviewModalFinding, setReviewModalFinding] = useState<any | null>(null);
  const [incidentModalFinding, setIncidentModalFinding] = useState<any | null>(null);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentNotes, setIncidentNotes] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchJob = () => {
    if (!id) return;
    api
      .getInspection(id)
      .then((res) => {
        setJob(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load inspection:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  // Polling if processing
  useEffect(() => {
    if (!job || (job.status !== "queued" && job.status !== "processing")) return;
    const interval = setInterval(fetchJob, 2000);
    return () => clearInterval(interval);
  }, [job?.status]);

  const handleReview = async (findingId: string, decision: "confirmed" | "rejected" | "corrected", options?: any) => {
    try {
      await api.reviewFinding(findingId, decision, options);
      setActionSuccess(`Finding review recorded as ${decision}.`);
      setTimeout(() => setActionSuccess(null), 3000);
      setReviewModalFinding(null);
      fetchJob();
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentModalFinding) return;

    try {
      await api.createIncident({
        findingId: incidentModalFinding.id,
        title: incidentTitle || incidentModalFinding.title,
        description: incidentNotes || incidentModalFinding.description,
        severity: incidentModalFinding.severity,
        status: "open",
        recommendedAction: incidentModalFinding.recommended_action,
      });

      setActionSuccess("Operational incident created successfully.");
      setTimeout(() => setActionSuccess(null), 3000);
      setIncidentModalFinding(null);
      setIncidentTitle("");
      setIncidentNotes("");
    } catch (err: any) {
      alert(`Failed to create incident: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Inspection job not found.</p>
        <Link to="/app/inspections" className="text-brand-400 hover:underline mt-2 inline-block">
          &larr; Back to Inspections
        </Link>
      </div>
    );
  }

  const assetUrl = job.visual_assets?.access_url || `/api/v1/assets/raw/${job.visual_assets?.storage_path}`;
  const findings: any[] = job.findings || [];
  const detections: any[] = job.detections || [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <Link to="/app/inspections" className="hover:text-slate-200 flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Inspections</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-300 truncate max-w-sm">{job.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-3">
            <span>{job.name}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                job.status === "completed"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : job.status === "processing"
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30 animate-pulse"
                  : job.status === "failed"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {job.status}
            </span>
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => api.runInspection(job.id).then(fetchJob)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
            <span>Re-run Analysis</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Inspection Metadata Info Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block mb-0.5">Profile Applied:</span>
          <span className="font-semibold text-slate-200">{job.inspection_profiles?.name || "Industrial Defect Profile"}</span>
        </div>
        <div>
          <span className="text-slate-500 block mb-0.5">Duration:</span>
          <span className="font-semibold text-slate-200">
            {job.processing_duration_ms ? `${job.processing_duration_ms} ms` : "Processing..."}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block mb-0.5">Anomalies Detected:</span>
          <span className="font-semibold text-rose-400 font-mono text-sm">{findings.length} findings</span>
        </div>
        <div>
          <span className="text-slate-500 block mb-0.5">Objective:</span>
          <span className="font-medium text-slate-300 truncate block">{job.objective}</span>
        </div>
      </div>

      {/* Main Inspection Grid: Left Canvas, Right Findings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Image Canvas (7 cols) */}
        <div className="lg:col-span-7">
          <AnnotatedImageCanvas
            imageUrl={assetUrl}
            findings={findings.map((f) => ({
              id: f.id,
              category: f.category,
              title: f.title,
              description: f.description,
              severity: f.severity,
              confidence: f.confidence,
              boundingBox: f.bounding_box,
              reviewStatus: f.review_status,
            }))}
            detections={detections.map((d) => ({
              id: d.id,
              label: d.label,
              confidence: d.confidence,
              boundingBox: d.bounding_box,
            }))}
            selectedFindingId={selectedFindingId}
            onSelectFinding={(id) => {
              setSelectedFindingId(id);
              const element = document.getElementById(`finding-card-${id}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
          />

          {/* AI Summary and Limitations Banner */}
          {job.result_summary && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
                <Info className="w-4 h-4 text-brand-400" />
                <span>AI Vision Summary & Methodology</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {job.result_summary.imageSummary || "Visual inspection completed."}
              </p>
              {job.result_summary.limitations && job.result_summary.limitations.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 text-slate-400 text-[11px]">
                  <span className="font-semibold text-slate-400">Limitations noted: </span>
                  {job.result_summary.limitations.join(" • ")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Findings & Evidence Review (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <span>Observed Findings</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-mono text-slate-300">
                {findings.length}
              </span>
            </h2>
            <span className="text-[11px] text-slate-400">Human Review Required</span>
          </div>

          {findings.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No Defects Detected</p>
              <p className="text-xs text-slate-400 mt-1">
                Visual inspection concluded clean with no anomalous irregularities violating tolerance.
              </p>
            </div>
          ) : (
            findings.map((finding) => {
              const isSelected = selectedFindingId === finding.id;
              const severityMeta = SEVERITY_COLORS[finding.severity as keyof typeof SEVERITY_COLORS];
              const categoryLabel = CATEGORY_LABELS[finding.category as keyof typeof CATEGORY_LABELS] || finding.category;

              return (
                <div
                  id={`finding-card-${finding.id}`}
                  key={finding.id}
                  onClick={() => setSelectedFindingId(finding.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-850 border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/40"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Finding Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${severityMeta?.badge}`}>
                          {finding.severity}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {categoryLabel}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{finding.title}</h3>
                    </div>

                    {finding.confidence && (
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {Math.round(finding.confidence * 100)}% conf
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {finding.description}
                  </p>

                  {/* Recommendation */}
                  {finding.recommended_action && (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs mb-3">
                      <span className="text-slate-400 font-semibold block mb-0.5">Recommended Action:</span>
                      <span className="text-slate-200">{finding.recommended_action}</span>
                    </div>
                  )}

                  {/* Uncertainty limitation note */}
                  {finding.uncertainty && (
                    <p className="text-[11px] text-slate-400 italic mb-3">
                      <span className="font-semibold text-slate-400">Uncertainty: </span>
                      {finding.uncertainty}
                    </p>
                  )}

                  {/* Review Status & Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] text-slate-500">Status:</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          finding.review_status === "confirmed"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : finding.review_status === "rejected"
                            ? "bg-rose-500/20 text-rose-300"
                            : finding.review_status === "corrected"
                            ? "bg-brand-500/20 text-brand-300"
                            : "bg-slate-800 text-amber-300"
                        }`}
                      >
                        {finding.review_status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReview(finding.id, "confirmed");
                        }}
                        title="Confirm finding as genuine defect"
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReview(finding.id, "rejected");
                        }}
                        title="Mark finding as false positive"
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-600/30 text-rose-400 text-xs font-medium transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIncidentModalFinding(finding);
                          setIncidentTitle(finding.title);
                        }}
                        title="Escalate to operational incident"
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-600/30 text-amber-400 text-xs font-medium transition-colors flex items-center space-x-1"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>Incident</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Incident Escalation Modal */}
      {incidentModalFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Escalate Finding to Incident</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Create an operational incident ticket to track corrective actions, quarantine items, or assign repair workflows.
            </p>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Incident Title</label>
                <input
                  type="text"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Operational Description / Notes</label>
                <textarea
                  rows={3}
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="Describe quarantine protocol, affected lot number, or assignment..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIncidentModalFinding(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  Create Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
