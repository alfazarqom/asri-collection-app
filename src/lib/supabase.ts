import { createClient } from "@supabase/supabase-js";

// Public browser configuration. Never place a Supabase secret/service_role key here.
const SUPABASE_URL = "https://mvwflakurihhakdrlteg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nGBEVnx4ZFHEe-ne3SzeOw_y3Lpt4nd";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { "X-Client-Info": "asri-collection-web/1.0.0" } }
});
