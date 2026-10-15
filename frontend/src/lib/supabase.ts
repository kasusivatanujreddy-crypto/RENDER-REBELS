import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pekvwwosdveqdrbxsltm.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

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
