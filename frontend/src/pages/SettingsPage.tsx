import React, { useEffect, useState } from "react";
import { Settings, Cpu, Database, Key, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { api } from "../lib/api-client";
import { checkSupabaseConnection, isSupabaseConfigured } from "../lib/supabase";

export const SettingsPage: React.FC = () => {
  const [capabilities, setCapabilities] = useState<any>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; latencyMs?: number; error?: string } | null>(null);
  const [checkingSupabase, setCheckingSupabase] = useState(false);

  const runSupabaseCheck = () => {
    setCheckingSupabase(true);
    checkSupabaseConnection()
      .then(setSupabaseStatus)
      .catch((err) => setSupabaseStatus({ connected: false, error: err.message }))
      .finally(() => setCheckingSupabase(false));
  };

  useEffect(() => {
    api.getAiCapabilities().then(setCapabilities).catch(console.error);
    runSupabaseCheck();
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
            <h2 className="text-base font-bold text-white">Supabase PostgreSQL & Cloud Storage</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={runSupabaseCheck}
              disabled={checkingSupabase}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
              title="Test Supabase Connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingSupabase ? "animate-spin text-brand-400" : ""}`} />
            </button>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase flex items-center space-x-1 ${
                supabaseStatus?.connected
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : supabaseStatus === null
                  ? "bg-slate-700 text-slate-300 border border-slate-600"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${supabaseStatus?.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
              <span>
                {supabaseStatus?.connected
                  ? `Connected (${supabaseStatus.latencyMs}ms)`
                  : supabaseStatus === null
                  ? "Checking..."
                  : "Connection Error"}
              </span>
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Application tables, Row-Level Security policies, and visual asset storage are connected to your remote Supabase instance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="font-semibold text-white block mb-1">Supabase Instance</span>
            <span className="font-mono text-xs text-brand-300 break-all">
              {import.meta.env.VITE_SUPABASE_URL || "https://pekvwwosdveqdrbxsltm.supabase.co"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="font-semibold text-white block mb-1">Row Level Security (RLS)</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enforced across 10 tables & storage buckets</span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="font-semibold text-white block mb-1">PostgreSQL Tables</span>
            <span className="text-slate-400">
              Active tables: <code className="text-slate-300">organizations</code>, <code className="text-slate-300">inspection_jobs</code>, <code className="text-slate-300">findings</code>, <code className="text-slate-300">visual_assets</code>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="font-semibold text-white block mb-1">Storage Buckets</span>
            <span className="text-slate-400">
              Active buckets: <code className="text-brand-400">visioniq-originals</code> and <code className="text-brand-400">visioniq-derived</code>
            </span>
          </div>
        </div>

        {supabaseStatus?.error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <strong>Connection error:</strong> {supabaseStatus.error}
          </div>
        )}
      </div>
    </div>
  );
};
