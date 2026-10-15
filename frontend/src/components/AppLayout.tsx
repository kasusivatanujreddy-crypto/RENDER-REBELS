import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ScanEye,
  Camera,
  FolderOpen,
  SlidersHorizontal,
  AlertTriangle,
  BarChart3,
  Settings,
  PlusCircle,
  Cpu,
  ChevronRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { api } from "../lib/api-client";

interface Props {
  children: React.ReactNode;
}

export const AppLayout: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const [capabilities, setCapabilities] = useState<any>(null);

  useEffect(() => {
    api.getAiCapabilities().then(setCapabilities).catch(console.error);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/app", icon: LayoutDashboard },
    { label: "Inspections", href: "/app/inspections", icon: ScanEye },
    { label: "Live Camera Capture", href: "/app/live-capture", icon: Camera },
    { label: "Asset Library", href: "/app/assets", icon: FolderOpen },
    { label: "Inspection Profiles", href: "/app/profiles", icon: SlidersHorizontal },
    { label: "Incidents", href: "/app/incidents", icon: AlertTriangle },
    { label: "Analytics & Reports", href: "/app/analytics", icon: BarChart3 },
    { label: "System & AI Settings", href: "/app/settings", icon: Settings },
  ];

  const isGeminiActive = capabilities?.configured;

  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100 overflow-hidden bg-tech-grid">
      {/* Ambient background glow orbs */}
      <div className="ambient-glow-brand -top-24 -right-24" />
      <div className="ambient-glow-purple bottom-0 left-48" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/80 backdrop-blur-xl flex flex-col shrink-0 z-20">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center border-b border-slate-800/80">
          <Link to="/app" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 via-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-all duration-300">
              <ScanEye className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-brand-300 transition-colors">
                VisionIQ
              </span>
              <span className="ml-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 badge-shimmer">
                PRO
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 py-4">
          <Link
            to="/app/inspections/new"
            className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl btn-glow text-white font-medium text-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Inspection</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/app" && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-slate-800/90 text-brand-300 border border-brand-500/30 shadow-glow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Engine Status Card */}
        <div className="p-3.5 m-3 rounded-xl glass-card text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand-400" />
              <span>Vision Engine</span>
            </span>
            <span
              className={`beacon-dot ${
                isGeminiActive ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </div>
          <p className="text-slate-200 font-mono text-[11px] mb-1 font-medium">
            {isGeminiActive ? (capabilities?.modelName || "Gemini 3.8 Flash") : "Local Benchmark Mode"}
          </p>
          <p className="text-slate-400 text-[10px]">
            {isGeminiActive ? "Live multimodal inference active" : "Using verified test fixtures"}
          </p>
        </div>

        {/* User / Workspace info */}
        <div className="p-4 border-t border-slate-800/80 flex items-center space-x-3 bg-slate-900/60 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            LI
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Lead Inspector</p>
            <p className="text-[10px] text-slate-400 truncate">VisionIQ Industrial Labs</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Header */}
        <header className="h-16 px-8 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-300">VisionIQ Industrial Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-300 capitalize font-semibold">
              {location.pathname.replace("/app", "").replace("/", "") || "Overview"}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Tenant RLS Protected</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
