import { getAdmin, json, options, rateLimit } from "../_shared/common.ts";

Deno.serve(async (req: Request) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST" && req.method !== "GET") return json(405, { error: "Method not allowed" });
  try {
    const db = getAdmin();
    if (!(await rateLimit(db, req, "catalog", 60, 60))) return json(429, { error: "Terlalu banyak permintaan. Coba lagi sebentar." });
    const { data, error } = await db.from("products")
      .select("id,slug,sku,name,description,price_idr,compare_at_price_idr,images,options,stock_quantity")
      .eq("is_active", true)
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const products = (data ?? []).filter((product: Record<string, unknown>) => {
      const options = product.options;
      return Array.isArray(options) && options.every((option: unknown) =>
        Boolean(option) && typeof option === "object" && !Array.isArray(option) &&
        typeof (option as Record<string, unknown>).name === "string" &&
        Array.isArray((option as Record<string, unknown>).values) &&
        ((option as Record<string, unknown>).values as unknown[]).every(value => typeof value === "string")
      );
    }).map((product: Record<string, unknown>) => ({
      ...product,
      images: Array.isArray(product.images) ? product.images.filter((image: unknown) => typeof image === "string" && /^https?:\/\//i.test(image)) : [],
      options: Array.isArray(product.options) ? product.options : []
    }));
    return json(200, { products });
  } catch (error) {
    console.error("catalog_error", error instanceof Error ? error.message : "unknown");
    return json(503, { error: "Katalog sedang tidak tersedia." });
  }
});