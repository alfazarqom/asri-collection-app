import { getAdmin, json, options, readJson, sha256, toMinorAmount, verifyMidtransSignature, rateLimit } from "../_shared/common.ts";

Deno.serve(async (req: Request) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  try {
    const db = getAdmin();
    if (!(await rateLimit(db, req, "midtrans-notification", 120, 60))) return json(429, { error: "Rate limit exceeded" });
    const body = await readJson(req, 12000);
    const orderId = typeof body.order_id === "string" ? body.order_id : "";
    const statusCode = typeof body.status_code === "string" ? body.status_code : "";
    const grossAmount = typeof body.gross_amount === "string" ? body.gross_amount : "";
    const signature = typeof body.signature_key === "string" ? body.signature_key : "";
    if (!orderId || !statusCode || !grossAmount || !signature || !(await verifyMidtransSignature(orderId, statusCode, grossAmount, signature))) {
      return json(401, { error: "Invalid notification signature" });
    }
    const { data: payment, error } = await db.from("divoom_payment_transactions")
      .select("id,order_id,provider_order_id,gross_amount_idr")
      .eq("provider_order_id", orderId).maybeSingle();
    if (error || !payment) return json(404, { error: "Transaction not found" });
    if (toMinorAmount(grossAmount) !== payment.gross_amount_idr) return json(400, { error: "Amount mismatch" });
    if (statusCode !== "200") return json(200, { received: true, ignored: true });
    const transactionId = typeof body.transaction_id === "string" ? body.transaction_id : "";
    const transactionStatus = typeof body.transaction_status === "string" ? body.transaction_status : "";
    const fraudStatus = typeof body.fraud_status === "string" ? body.fraud_status.toLowerCase() : "";
    const paymentType = typeof body.payment_type === "string" ? body.payment_type : "";
    if (!transactionId || !transactionStatus) return json(400, { error: "Incomplete notification" });
    const eventKey = await sha256(orderId + ":" + transactionId + ":" + transactionStatus + ":" + statusCode);
    const safePayload = {
      order_id: orderId, transaction_id: transactionId, transaction_status: transactionStatus,
      fraud_status: fraudStatus || null, payment_type: paymentType || null,
      status_code: statusCode, gross_amount: grossAmount
    };
    const { data, error: applyError } = await db.rpc("apply_midtrans_notification", {
      p_event_key: eventKey,
      p_provider_order_id: orderId,
      p_provider_transaction_id: transactionId,
      p_transaction_status: transactionStatus,
      p_fraud_status: fraudStatus || null,
      p_payment_type: paymentType || null,
      p_payload: safePayload
    });
    if (applyError) throw applyError;
    return json(200, { received: true, result: data });
  } catch (error) {
    console.error("midtrans_notification_error", error instanceof Error ? error.message : "unknown");
    return json(500, { error: "Notification processing failed" });
  }
});