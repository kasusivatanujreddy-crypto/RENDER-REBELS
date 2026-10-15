import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScanEye, Plus, Search, Filter, ArrowUpRight, Clock, AlertTriangle } from "lucide-react";
import { api } from "../lib/api-client";

export const InspectionsListPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    api
      .getInspections()
      .then((res) => {
        setJobs(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load inspections:", err);
        setLoading(false);
      });
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.name.toLowerCase().includes(search.toLowerCase()) ||
      job.objective?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inspection History</h1>
          <p className="text-sm text-slate-400">
            Search, filter, and review automated visual quality inspection runs.
          </p>
        </div>

        <Link
          to="/app/inspections/new"
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Inspection</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job name or objective..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 font-medium uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Inspection</th>
                <th className="px-5 py-3">Profile</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Defects</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading inspections...</span>
                  </td>
                </tr>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-5 py-4 font-semibold text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-brand-400 shrink-0">
                        <ScanEye className="w-4 h-4" />
                      </div>
                      <div className="truncate max-w-xs">
                        <div className="truncate text-white font-semibold">{job.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal truncate">
                          {job.objective}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-medium">
                      {job.inspection_profiles?.name || "General Profile"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          job.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : job.status === "processing"
                            ? "bg-brand-500/20 text-brand-300 border border-brand-500/30 animate-pulse"
                            : job.status === "failed"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-200">
                        {job.findings_count !== undefined ? job.findings_count : (job.result_summary?.totalFindings ?? "-")}
                      </span>
                      {job.critical_findings_count > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                          {job.critical_findings_count} critical
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {job.processing_duration_ms ? `${job.processing_duration_ms} ms` : "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(job.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/app/inspections/${job.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 font-medium text-xs transition-colors inline-flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No inspections matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
