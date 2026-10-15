import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://pekvwwosdveqdrbxsltm.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBla3Z3d29zZHZlcWRyYnhzbHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNDI0OTAsImV4cCI6MjEwNzYxODQ5MH0.apiqweC0HXT6-j255hhKvLhtcMcr1vk3eRFcH1s9Jtc";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || "dummy-anon-key-prevent-crash",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export async function checkSupabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = performance.now();
  try {
    const { data, error } = await supabase.from("organizations").select("id").limit(1);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true, latencyMs: Math.round(performance.now() - start) };
  } catch (err: any) {
    return { connected: false, error: err?.message || "Unknown error" };
  }
}
