import React, { useEffect, useState } from "react";
import { Settings, Cpu, Database, Key, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { api } from "../lib/api-client";

export const SettingsPage: React.FC = () => {
  const [capabilities, setCapabilities] = useState<any>(null);

  useEffect(() => {
    api.getAiCapabilities().then(setCapabilities).catch(console.error);
  }, []);

  const isGeminiConfigured = capabilities?.configured;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-brand-400" />
          <span>System & AI Engine Configuration</span>
        </h1>
        <p className="text-sm text-slate-400">
          Inspect visual intelligence model providers, database connection status, and operational parameters.
        </p>
      </div>

      {/* AI Vision Model Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-white">Google Gemini Visual Intelligence Engine</h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
              isGeminiConfigured
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {isGeminiConfigured ? "Live Inference Active" : "Local Benchmark Mode"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Model Architecture:</span>
            <span className="font-mono text-sm font-semibold text-white">
              {capabilities?.modelName || "gemini-2.5-flash"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Provider SDK:</span>
            <span className="font-mono text-sm font-semibold text-white">@google/genai (Official SDK)</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Coordinate System:</span>
            <span className="text-slate-200">Normalized [0, 1] Bounding Box (x, y, width, height)</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Supported Formats:</span>
            <span className="text-slate-200">JPEG, PNG, WebP (up to 15MB)</span>
          </div>
        </div>

        {!isGeminiConfigured && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
            <div className="font-semibold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Using Local Benchmark Fixture</span>
            </div>
            <p className="text-slate-400">
              To activate live multimodal Gemini vision inspection, add your Google AI Studio API key to <code className="text-amber-300">.env</code>:
            </p>
            <pre className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-slate-300 mt-2 select-all">
              GEMINI_API_KEY=your_actual_gemini_api_key_here
            </pre>
          </div>
        )}
      </div>

      {/* Database & Multi-Tenancy Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Persistence & Row Level Security (RLS)</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            RLS Protected
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Every inspection job, visual asset, detection finding, and operational incident is scoped to an organization workspace with tenant isolation guarantees.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="font-semibold text-white block mb-1">Supabase PostgreSQL Migrations</span>
            <span className="text-slate-400">
              Version-controlled SQL schema available in <code className="text-brand-400">supabase/migrations/</code>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="font-semibold text-white block mb-1">Storage Buckets</span>
            <span className="text-slate-400">
              Private buckets <code className="text-brand-400">visioniq-originals</code> and <code className="text-brand-400">visioniq-derived</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
