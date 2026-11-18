import { getAdmin, json, options, readJson, requiredString, sha256, rateLimit, midtransBase, serverKey, verifyMidtransSignature, toMinorAmount } from "../_shared/common.ts";

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
    const { data: order, error } = await db.from("divoom_orders")
      .select("id,order_number,lookup_token_hash,order_status,payment_status,subtotal_idr,shipping_cost_idr,total_idr,created_at,expires_at")
      .eq("order_number", orderNumber).eq("lookup_token_hash", lookupHash).maybeSingle();
    if (error || !order) return json(404, { error: "Pesanan tidak ditemukan." });

    const { data: payment } = await db.from("divoom_payment_transactions")
      .select("provider_order_id,internal_status")
      .eq("order_id", order.id).maybeSingle();

    // Reconcile with Midtrans only when a Snap transaction exists and remains pending.
    // A not-yet-paid Snap session can legitimately have no Core API status yet.
    if (payment && order.payment_status === "pending") {
      const auth = btoa(serverKey() + ":");
      const statusResponse = await fetch(midtransBase() + "/v2/" + encodeURIComponent(payment.provider_order_id) + "/status", {
        headers: { "Authorization": "Basic " + auth, "Accept": "application/json" }
      });
      if (statusResponse.ok) {
        const provider = await statusResponse.json();
        const orderId = typeof provider.order_id === "string" ? provider.order_id : "";
        const statusCode = typeof provider.status_code === "string" ? provider.status_code : "";
        const grossAmount = typeof provider.gross_amount === "string" ? provider.gross_amount : "";
        const signature = typeof provider.signature_key === "string" ? provider.signature_key : "";
        const transactionId = typeof provider.transaction_id === "string" ? provider.transaction_id : "";
        const transactionStatus = typeof provider.transaction_status === "string" ? provider.transaction_status : "";
        const fraudStatus = typeof provider.fraud_status === "string" ? provider.fraud_status.toLowerCase() : "";
        const paymentType = typeof provider.payment_type === "string" ? provider.payment_type : "";
        if (orderId === orderNumber && statusCode === "200" && transactionId && transactionStatus &&
            await verifyMidtransSignature(orderId, statusCode, grossAmount, signature) &&
            toMinorAmount(grossAmount) === order.total_idr) {
          const eventKey = await sha256(orderId + ":" + transactionId + ":" + transactionStatus + ":" + statusCode);
          const { error: applyError } = await db.rpc("apply_midtrans_notification", {
            p_event_key: eventKey,
            p_provider_order_id: orderId,
            p_provider_transaction_id: transactionId,
            p_transaction_status: transactionStatus,
            p_fraud_status: fraudStatus || null,
            p_payment_type: paymentType || null,
            p_payload: {
              order_id: orderId, transaction_id: transactionId,
              transaction_status: transactionStatus, fraud_status: fraudStatus || null,
              payment_type: paymentType || null, status_code: statusCode, gross_amount: grossAmount,
              source: "server_status_reconciliation"
            }
          });
          if (applyError) throw applyError;
        }
      }
    }

    const { error: expiryError } = await db.rpc("release_expired_order_reservations");
    if (expiryError) throw expiryError;

    const { data: latest, error: latestError } = await db.from("divoom_orders")
      .select("order_number,order_status,payment_status,subtotal_idr,shipping_cost_idr,total_idr,created_at,expires_at")
      .eq("id", order.id).single();
    if (latestError) throw latestError;
    return json(200, { order: latest });
  } catch (error) {
    console.error("order_status_error", error instanceof Error ? error.message : "unknown");
    return json(400, { error: "Data pelacakan tidak valid." });
  }
});