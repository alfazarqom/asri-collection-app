import { getAdmin, json, options, readJson, requiredString, randomToken, sha256, rateLimit, isEmail } from "../_shared/common.ts";

Deno.serve(async (req: Request) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  try {
    const db = getAdmin();
    if (!(await rateLimit(db, req, "create-order", 8, 60))) return json(429, { error: "Terlalu banyak percobaan checkout." });
    const body = await readJson(req);
    const customer = body.customer as Record<string, unknown>;
    const items = body.items;
    if (!customer || typeof customer !== "object" || Array.isArray(customer) || !Array.isArray(items) || items.length < 1 || items.length > 30) {
      return json(400, { error: "Data checkout tidak valid." });
    }
    const name = requiredString(customer.name, 120);
    const email = requiredString(customer.email, 254).toLowerCase();
    const phone = requiredString(customer.phone, 30);
    const address = requiredString(customer.address, 500);
    const city = requiredString(customer.city, 100);
    const province = requiredString(customer.province, 100);
    const postalCode = requiredString(customer.postal_code, 12);
    if (!isEmail(email) || !/^[0-9+() .-]{7,30}$/.test(phone)) return json(400, { error: "Email atau nomor telepon tidak valid." });
    const cleanItems = items.map((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Invalid item");
      const value = item as Record<string, unknown>;
      const productId = requiredString(value.product_id, 64);
      const quantity = Number(value.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error("Invalid quantity");
      const selected = value.selected_options && typeof value.selected_options === "object" && !Array.isArray(value.selected_options) ? value.selected_options : {};
      return { product_id: productId, quantity, selected_options: selected };
    });
    if (new Set(cleanItems.map(x => x.product_id)).size !== cleanItems.length) return json(400, { error: "Produk duplikat tidak diperbolehkan dalam satu checkout." });
    const lookupToken = randomToken();
    const lookupHash = await sha256(lookupToken);
    const { data, error } = await db.rpc("create_order_atomic", {
      p_customer: { name, email, phone },
      p_shipping_address: { address, city, province, postal_code: postalCode, country_code: "ID" },
      p_items: cleanItems,
      p_lookup_token_hash: lookupHash
    });
    if (error) {
      console.error("create_order_rpc_error", error.message);
      return json(400, { error: "Pesanan tidak dapat dibuat. Periksa stok dan data produk." });
    }
    return json(201, { order: { ...data, lookup_token: lookupToken } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return json(400, { error: message === "Request too large" ? "Permintaan terlalu besar." : "Data checkout tidak valid." });
  }
});