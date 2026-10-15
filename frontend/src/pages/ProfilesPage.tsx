import React, { useEffect, useState } from "react";
import { SlidersHorizontal, Plus, ShieldCheck, Check, Sparkles } from "lucide-react";
import { api } from "../lib/api-client";
import { CATEGORY_LABELS } from "@visioniq/shared";

export const ProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("industrial_quality");
  const [objective, setObjective] = useState("");
  const [severityThreshold, setSeverityThreshold] = useState("medium");
  const [minConfidence, setMinConfidence] = useState(0.65);
  const [instructions, setInstructions] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchProfiles = () => {
    api
      .getProfiles()
      .then((res) => {
        setProfiles(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch profiles:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProfile({
        name,
        description,
        domain,
        inspectionObjective: objective,
        expectedComponents: ["Chassis", "Fastener", "Interface"],
        defectCategories: ["surface_defect", "missing_component", "misalignment"],
        severityThreshold,
        minConfidence: Number(minConfidence),
        instructions,
        isActive: true,
      });

      setActionSuccess("Custom inspection profile created.");
      setTimeout(() => setActionSuccess(null), 3000);
      setShowModal(false);
      setName("");
      setDescription("");
      setObjective("");
      setInstructions("");
      fetchProfiles();
    } catch (err: any) {
      alert(`Error creating profile: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <SlidersHorizontal className="w-6 h-6 text-brand-400" />
            <span>Inspection Profiles & Rulesets</span>
          </h1>
          <p className="text-sm text-slate-400">
            Define domain-specific anomaly detection thresholds, expected components, and AI analysis prompts.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Profile</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading inspection profiles...</span>
          </div>
        ) : (
          profiles.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {p.domain}
                  </span>
                  <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">{p.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description || "Production-grade quality inspection ruleset."}
                </p>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
                  <span className="text-slate-500 block font-semibold text-[10px] uppercase tracking-wider">
                    Inspection Objective:
                  </span>
                  <p className="text-slate-300 line-clamp-3 leading-relaxed">
                    {p.inspection_objective}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Sensitivity Threshold:</span>
                  <span className="font-semibold uppercase text-slate-200">{p.severity_threshold}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Min Confidence:</span>
                  <span className="font-mono text-slate-200">{Math.round((p.min_confidence || 0.6) * 100)}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Create Inspection Profile</h2>
            <p className="text-xs text-slate-400 mb-4">
              Configure automated quality validation rules and domain guidelines.
            </p>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Hydraulic Cylinder Weld Seam Verification"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="industrial_quality">Industrial Quality</option>
                  <option value="equipment_inspection">Equipment Inspection</option>
                  <option value="document_intelligence">Document Intelligence</option>
                  <option value="facility_safety">Facility Safety</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Inspection Objective</label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  required
                  placeholder="State specifically what anomalies the vision model should detect..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Threshold</label>
                  <select
                    value={severityThreshold}
                    onChange={(e) => setSeverityThreshold(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Confidence ({Math.round(minConfidence * 100)}%)</label>
                  <input
                    type="range"
                    min="0.3"
                    max="0.95"
                    step="0.05"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                    className="w-full accent-brand-500 mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
