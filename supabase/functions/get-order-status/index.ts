import { getAdmin, json, options, readJson, requiredString, sha256, rateLimit, midtransBase, serverKey } from "../_shared/common.ts";

Deno.serve(async (req: Request) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  try {
    const db = getAdmin();
    if (!(await rateLimit(db, req, "order-status", 12, 60))) return json(429, { error: "Terlalu banyak permintaan." });
    const body = await readJson(req);
    const orderNumber = requiredString(body.order_number, 50);
    const lookupToken = requiredString(body.lookup_token, 128);
    const lookupHash = await sha256(lookupToken);
    const { data: order, error } = await db.from("orders")
      .select("order_number,order_status,payment_status,subtotal_idr,shipping_cost_idr,total_idr,created_at,expires_at")
      .eq("order_number", orderNumber).eq("lookup_token_hash", lookupHash).maybeSingle();
    if (error || !order) return json(404, { error: "Pesanan tidak ditemukan." });

    // When a provider transaction exists, ask Midtrans for its current state.
    // A not-yet-created payment can legitimately return 404; the persisted state remains authoritative.
    const { data: payment } = await db.from("payment_transactions")
      .select("provider_order_id,internal_status")
      .eq("provider_order_id", orderNumber).maybeSingle();
    if (payment && order.payment_status === "pending") {
      const auth = btoa(serverKey() + ":");
      const statusResponse = await fetch(midtransBase() + "/v2/" + encodeURIComponent(orderNumber) + "/status", {
        headers: { "Authorization": "Basic " + auth, "Accept": "application/json" }
      });
      if (statusResponse.ok) {
        // Do not mutate state here. The verified notification handler remains the state transition path.
        await statusResponse.json();
      }
    }
    return json(200, { order });
  } catch (error) {
    console.error("order_status_error", error instanceof Error ? error.message : "unknown");
    return json(400, { error: "Data pelacakan tidak valid." });
  }
});