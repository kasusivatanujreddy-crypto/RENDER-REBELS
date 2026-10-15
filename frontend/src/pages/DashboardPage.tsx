import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Plus,
  Clock,
  Sparkles,
  Camera,
  Activity,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { api } from "../lib/api-client";
import { CATEGORY_LABELS, SEVERITY_COLORS } from "@visioniq/shared";

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAnalyticsOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard analytics error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const severityCounts = data?.severityCounts || { critical: 0, high: 0, medium: 0, low: 0 };
  const pieData = [
    { name: "Critical", value: severityCounts.critical, color: "#f43f5e" },
    { name: "High", value: severityCounts.high, color: "#f97316" },
    { name: "Medium", value: severityCounts.medium, color: "#f59e0b" },
    { name: "Low", value: severityCounts.low, color: "#3b82f6" },
  ].filter((d) => d.value > 0);

  const categoryData = Object.entries(data?.categoryCounts || {}).map(([cat, count]) => ({
    name: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
    count: count as number,
  }));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Operational Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            VisionIQ Quality & Anomaly Operations
          </h1>
          <p className="text-sm text-slate-400">
            Real-time computer vision analysis, surface anomaly localization, and evidence-grounded review.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/app/live-capture"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
          >
            <Camera className="w-4 h-4 text-brand-400" />
            <span>Camera Capture</span>
          </Link>
          <Link
            to="/app/inspections/new"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors shadow-lg shadow-brand-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>Start Inspection</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Inspections</span>
            <ScanEye className="w-4 h-4 text-brand-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {data?.totalInspections || 0}
            </span>
            <span className="text-xs text-slate-400">
              ({data?.completedInspections || 0} completed)
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {data?.passRate ?? 100}%
            </span>
            <span className="text-xs text-slate-500">clean yield</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Defects Detected</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {data?.totalFindings || 0}
            </span>
            <span className="text-xs text-rose-400/80">
              ({severityCounts.critical} critical)
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Open Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {data?.openIncidents || 0}
            </span>
            <Link to="/app/incidents" className="text-xs text-brand-400 hover:underline flex items-center">
              <span>View</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Breakdown */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-md flex flex-col">
          <h2 className="text-base font-semibold text-white mb-1">Anomaly Severity Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">
            Defect classification breakdown across all completed inspections.
          </p>

          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs py-8">
                No defect findings recorded yet. Run an inspection to populate distribution.
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-800 text-xs text-center">
            <div>
              <div className="text-rose-400 font-bold">{severityCounts.critical}</div>
              <div className="text-slate-500 text-[11px]">Critical</div>
            </div>
            <div>
              <div className="text-orange-400 font-bold">{severityCounts.high}</div>
              <div className="text-slate-500 text-[11px]">High</div>
            </div>
            <div>
              <div className="text-amber-400 font-bold">{severityCounts.medium}</div>
              <div className="text-slate-500 text-[11px]">Medium</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold">{severityCounts.low}</div>
              <div className="text-slate-500 text-[11px]">Low</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-md flex flex-col">
          <h2 className="text-base font-semibold text-white mb-1">Defects by Category</h2>
          <p className="text-xs text-slate-400 mb-4">Observed root anomalies categorized by visual type.</p>

          <div className="flex-1 min-h-[220px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-slate-500 text-xs py-8">
                No category data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Inspection Activity</h2>
            <p className="text-xs text-slate-400">Latest visual intelligence jobs submitted in workspace.</p>
          </div>
          <Link
            to="/app/inspections"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850/60 text-slate-400 font-medium uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Inspection Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Findings</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data?.recentJobs && data.recentJobs.length > 0 ? (
                data.recentJobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-white flex items-center space-x-2">
                      <ScanEye className="w-4 h-4 text-brand-400 shrink-0" />
                      <span className="truncate max-w-xs">{job.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          job.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : job.status === "processing"
                            ? "bg-brand-500/20 text-brand-300 border border-brand-500/30 animate-pulse"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-200">
                        {job.result_summary?.totalFindings ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="uppercase text-[10px] font-semibold text-slate-400">
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {job.processing_duration_ms ? `${job.processing_duration_ms}ms` : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/app/inspections/${job.id}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-brand-400 font-medium text-xs transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No inspections yet. Click "Start Inspection" to submit an image.
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
