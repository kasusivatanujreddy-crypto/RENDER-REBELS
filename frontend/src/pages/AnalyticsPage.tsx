import React, { useEffect, useState } from "react";
import { BarChart3, Download, Printer, CheckCircle2, Flame, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "../lib/api-client";
import { CATEGORY_LABELS } from "@visioniq/shared";

export const AnalyticsPage: React.FC = () => {
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
        console.error("Failed to fetch analytics:", err);
        setLoading(false);
      });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    window.location.href = api.getExportCsvUrl();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const categoryData = Object.entries(data?.categoryCounts || {}).map(([cat, count]) => ({
    name: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
    count: count as number,
  }));

  const severityData = [
    { name: "Critical", value: data?.severityCounts?.critical || 0, color: "#f43f5e" },
    { name: "High", value: data?.severityCounts?.high || 0, color: "#f97316" },
    { name: "Medium", value: data?.severityCounts?.medium || 0, color: "#f59e0b" },
    { name: "Low", value: data?.severityCounts?.low || 0, color: "#3b82f6" },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Export Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-brand-400" />
            <span>Inspection Analytics & Operational Reports</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time quality intelligence, defect trends, and exportable audit documentation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Yield Pass Rate</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">{data?.passRate ?? 100}%</div>
          <span className="text-[11px] text-slate-500">Zero defect rate</span>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Completed Jobs</span>
          <div className="text-3xl font-extrabold text-white mt-2">{data?.completedInspections || 0}</div>
          <span className="text-[11px] text-slate-500">Across all profiles</span>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Defects Identified</span>
          <div className="text-3xl font-extrabold text-rose-400 mt-2">{data?.totalFindings || 0}</div>
          <span className="text-[11px] text-slate-500">Localized anomalies</span>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Open Remediation Incidents</span>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">{data?.openIncidents || 0}</div>
          <span className="text-[11px] text-slate-500">Active containment</span>
        </div>
      </div>

      {/* Analytical Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <h2 className="text-base font-semibold text-white mb-1">Defects by Category</h2>
          <p className="text-xs text-slate-400 mb-6">Distribution across inspection defect categories.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <h2 className="text-base font-semibold text-white mb-1">Severity Distribution</h2>
          <p className="text-xs text-slate-400 mb-6">Critical vs high vs medium anomaly proportions.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
