import { getAdmin, json, options, readJson, requiredString, sha256, serverKey, snapBase, rateLimit } from "../_shared/common.ts";

Deno.serve(async (req: Request) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  try {
    const db = getAdmin();
    if (!(await rateLimit(db, req, "create-payment", 5, 60))) return json(429, { error: "Terlalu banyak permintaan pembayaran." });
    const { error: expiryError } = await db.rpc("release_expired_order_reservations");
    if (expiryError) throw expiryError;
    const body = await readJson(req);
    const orderNumber = requiredString(body.order_number, 50);
    const lookupToken = requiredString(body.lookup_token, 128);
    const lookupHash = await sha256(lookupToken);
    const { data: order, error: orderError } = await db.from("asri_orders")
      .select("id,order_number,total_idr,payment_status,expires_at,customer_name,customer_email,customer_phone")
      .eq("order_number", orderNumber).eq("lookup_token_hash", lookupHash).maybeSingle();
    if (orderError || !order) return json(404, { error: "Pesanan tidak ditemukan." });
    if (order.payment_status !== "pending" || (order.expires_at && new Date(order.expires_at).getTime() <= Date.now())) {
      return json(409, { error: "Pesanan ini tidak lagi menunggu pembayaran." });
    }

    const { data: existing, error: existingError } = await db.from("asri_payment_transactions")
      .select("id,snap_token,snap_redirect_url,gross_amount_idr")
      .eq("order_id", order.id).maybeSingle();
    if (existingError) throw existingError;
    if (existing?.snap_redirect_url && existing.gross_amount_idr === order.total_idr) {
      return json(200, { redirect_url: existing.snap_redirect_url });
    }
    if (existing && existing.gross_amount_idr !== order.total_idr) {
      return json(409, { error: "Nilai transaksi tidak cocok dengan pesanan." });
    }
    if (!existing) {
      const { error: reserveError } = await db.from("asri_payment_transactions").insert({
        order_id: order.id, provider: "midtrans", provider_order_id: order.order_number,
        gross_amount_idr: order.total_idr, internal_status: "pending",
        raw_response: { snap_request_started: false }
      });
      if (reserveError) {
        if (reserveError.code === "23505") return json(409, { error: "Sesi pembayaran sedang disiapkan. Coba beberapa saat lagi." });
        throw reserveError;
      }
    }

    const itemRows = await db.from("asri_order_items")
      .select("product_name,unit_price_idr,quantity").eq("order_id", order.id);
    if (itemRows.error) throw itemRows.error;
    const items = (itemRows.data ?? []).map((item, index) => ({
      id: "item-" + index, price: item.unit_price_idr, quantity: item.quantity,
      name: String(item.product_name).slice(0, 50)
    }));
    const itemSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (itemSubtotal + 52000 !== order.total_idr) return json(409, { error: "Ringkasan pesanan tidak konsisten." });
    items.push({ id: "shipping", price: 52000, quantity: 1, name: "Biaya pengiriman" });

    const publicUrl = Deno.env.get("APP_PUBLIC_URL") ||
      (Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true" ? "" : "http://localhost:5173");
    if (!publicUrl || (Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true" && !publicUrl.startsWith("https://"))) {
      throw new Error("APP_PUBLIC_URL must be configured as HTTPS in production");
    }
    const payload = {
      transaction_details: { order_id: order.order_number, gross_amount: order.total_idr },
      item_details: items,
      customer_details: {
        first_name: order.customer_name.slice(0, 45),
        email: order.customer_email,
        phone: order.customer_phone
      },
      callbacks: {
        finish: publicUrl + "/payment/result?order=" + encodeURIComponent(order.order_number)
      }
    };
    const auth = btoa(serverKey() + ":");
    const response = await fetch(snapBase() + "/snap/v1/transactions", {
      method: "POST",
      headers: { "Authorization": "Basic " + auth, "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || typeof result.token !== "string" || typeof result.redirect_url !== "string") {
      console.error("midtrans_snap_error", response.status);
      return json(502, { error: "Midtrans belum dapat membuat sesi pembayaran." });
    }
    const { error: saveError } = await db.from("asri_payment_transactions").update({
      snap_token: result.token,
      snap_redirect_url: result.redirect_url,
      raw_response: { token_created: true }
    }).eq("provider_order_id", order.order_number);
    if (saveError) throw saveError;
    return json(200, { redirect_url: result.redirect_url });
  } catch (error) {
    console.error("create_payment_error", error instanceof Error ? error.message : "unknown");
    return json(500, { error: "Pembayaran belum dapat diproses." });
  }
});