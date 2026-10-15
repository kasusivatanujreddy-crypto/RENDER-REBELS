import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock, Check, ChevronRight } from "lucide-react";
import { api } from "../lib/api-client";
import { SEVERITY_COLORS } from "@visioniq/shared";

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newStatus, setNewStatus] = useState("resolved");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchIncidents = () => {
    api
      .getIncidents()
      .then((res) => {
        setIncidents(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load incidents:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    try {
      await api.updateIncident(selectedIncident.id, {
        status: newStatus,
        resolutionNotes,
      });

      setActionSuccess(`Incident updated to ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 3000);
      setSelectedIncident(null);
      setResolutionNotes("");
      fetchIncidents();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const filtered = incidents.filter((i) => statusFilter === "all" || i.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <span>Operational Incidents & Corrective Actions</span>
          </h1>
          <p className="text-sm text-slate-400">
            Track confirmed quality defects requiring remediation, containment, or rework.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl w-fit text-xs">
        {["all", "open", "in_progress", "resolved"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
              statusFilter === st
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading incidents...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((inc) => {
            const severityMeta = SEVERITY_COLORS[inc.severity as keyof typeof SEVERITY_COLORS];
            return (
              <div
                key={inc.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${severityMeta?.badge}`}>
                      {inc.severity}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        inc.status === "resolved"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : inc.status === "in_progress"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {inc.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white leading-snug">{inc.title}</h3>
                  {inc.description && (
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {inc.description}
                    </p>
                  )}
                  {inc.recommended_action && (
                    <p className="text-xs text-brand-300 bg-brand-500/10 p-2 rounded-lg border border-brand-500/20">
                      <span className="font-semibold block mb-0.5">Action:</span>
                      {inc.recommended_action}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => {
                      setSelectedIncident(inc);
                      setNewStatus(inc.status === "resolved" ? "open" : "resolved");
                      setResolutionNotes(inc.resolution_notes || "");
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
                  >
                    Manage / Resolve
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 py-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
            No incidents found in this status category.
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-base font-bold text-white mb-2">Update Incident Status</h2>
            <p className="text-xs text-slate-400 mb-4">{selectedIncident.title}</p>

            <form onSubmit={handleUpdateIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution / Audit Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record corrective actions taken (e.g. part replaced, recalibrated feeder)..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
