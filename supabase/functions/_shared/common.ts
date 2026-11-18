import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
export function options(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders }) : null;
}
export function getAdmin(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Server configuration unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function readJson(req: Request, maxBytes = 20000): Promise<Record<string, unknown>> {
  const length = Number(req.headers.get("content-length") || "0");
  if (length > maxBytes) throw new Error("Request too large");
  const raw = await req.text();
  if (raw.length > maxBytes) throw new Error("Request too large");
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid request");
  return value as Record<string, unknown>;
}
export function requiredString(value: unknown, max: number): string {
  if (typeof value !== "string") throw new Error("Invalid input");
  const result = value.trim();
  if (!result || result.length > max) throw new Error("Invalid input");
  return result;
}
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}
export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, "0")).join("");
}
export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(x => x.toString(16).padStart(2, "0")).join("");
}
export function clientIp(req: Request): string {
  const trustedEdgeIp = req.headers.get("cf-connecting-ip");
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return trustedEdgeIp || forwarded || "unknown";
}
export async function rateLimit(db: SupabaseClient, req: Request, scope: string, limit: number, seconds: number): Promise<boolean> {
  const key = await sha256(scope + ":" + clientIp(req));
  const { data, error } = await db.rpc("consume_api_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: seconds });
  if (error) throw new Error("Rate limiter unavailable");
  return data === true;
}
export function serverKey(): string {
  const key = Deno.env.get("MIDTRANS_SERVER_KEY");
  if (!key) throw new Error("Payment service unavailable");
  return key;
}
export function midtransBase(): string {
  return Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}
export function snapBase(): string {
  return Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}
export function toMinorAmount(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") throw new Error("Invalid amount");
  const text = String(value);
  if (!/^\d+(?:\.00)?$/.test(text)) throw new Error("Invalid amount");
  const amount = Number(text);
  if (!Number.isSafeInteger(amount)) throw new Error("Invalid amount");
  return amount;
}
