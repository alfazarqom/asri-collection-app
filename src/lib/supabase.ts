import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const hasBackendConfig = Boolean(url && key);
export const supabase = hasBackendConfig
  ? createClient(url!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "X-Client-Info": "asri-collection-web/1.0.0" } }
    })
  : null;

export function backendConfigMessage() {
  return "Backend belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY dari project Supabase.";
}