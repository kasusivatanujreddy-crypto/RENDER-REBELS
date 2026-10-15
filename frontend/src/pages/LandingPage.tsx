import React from "react";
import { Link } from "react-router-dom";
import { ScanEye, ArrowRight, ShieldCheck, Cpu, Layers, Sparkles, CheckCircle2 } from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500/30 selection:text-brand-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <ScanEye className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">VisionIQ</span>
          </div>

          <Link
            to="/app"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 transition-all"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20 flex-1 flex flex-col items-center text-center justify-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs text-brand-300 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>AI-Powered Computer Vision & Quality Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-tight">
          Transform Unstructured Visual Data into{" "}
          <span className="bg-gradient-to-r from-brand-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
            Explainable Inspection Intelligence
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          VisionIQ empowers manufacturing, hardware engineering, and assembly teams to automatically detect surface defects, misaligned components, and structural anomalies with sub-millimeter precision.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <Link
            to="/app"
            className="px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 flex items-center space-x-2 transition-all active:scale-95"
          >
            <span>Open Industrial Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/app/inspections/new"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
          >
            Run First Inspection
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left max-w-5xl w-full">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <ScanEye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sub-Pixel Anomaly Localization</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Normalized bounding box coordinate system mapping precise defect boundaries with confidence scoring.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Human-in-the-Loop Review</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify, reject false positives, adjust severity, and escalate critical defects into operational containment tickets.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Production-Ready Multi-Tenancy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              PostgreSQL Row Level Security (RLS) ensuring strict cross-organization asset and inspection isolation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        VisionIQ Platform • Built for Autonomous Industrial Visual Intelligence
      </footer>
    </div>
  );
};
