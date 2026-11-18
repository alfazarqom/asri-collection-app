import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Ban, Check, Clock3, HelpCircle, LoaderCircle, Minus, Plus, RotateCcw, ShoppingBag, Trash2, XCircle } from "lucide-react";
import { createOrder, createPayment, getOrderStatus, getProducts } from "./lib/api";

import type { CartLine, CustomerInput, OrderStatus, Product } from "./types";
import { formatIDR as money, SHIPPING_IDR as SHIPPING } from "./lib/money";
import { getOrderStatusLabel, getPaymentStatusView } from "./lib/order-status";

const CART_KEY = "asri-cart-v1";
const LOOKUP_KEY = "asri-order-lookup-v1";
const readCart = (): CartLine[] => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]") as CartLine[]; } catch { return []; } };
const saveCart = (cart: CartLine[]) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

function Header({ count }: { count: number }) {
  return <header className="site-header"><div className="header-inner"><Link className="brand" to="/">ASRI<span>COLLECTION</span></Link><nav><Link to="/">Beranda</Link><Link to="/products">Koleksi</Link></nav><Link className="cart-link" to="/cart" aria-label="Keranjang"><ShoppingBag size={19}/><span>Keranjang</span><b>{count}</b></Link></div></header>;
}
function Footer() { return <footer className="footer"><div><b>ASRI COLLECTION</b><p>Tampil Elegan, Setiap Hari.</p><Link className="footer-link" to="/order">Lacak pesanan</Link></div><span>© {new Date().getFullYear()} Asri Collection</span></footer>; }
function Layout({ children, count }: { children: ReactNode; count: number }) { return <><Header count={count}/><main>{children}</main><Footer/></>; }
function Notice({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) { return <div className={"notice " + tone} role="status">{children}</div>; }
function ProductCard({ product, add }: { product: Product; add: (p: Product) => void }) {
  const image = product.images?.[0];
  return <article className="product-card"><Link to={"/products/" + encodeURIComponent(product.slug)} className="product-image">{image ? <img src={image} alt={product.name} loading="lazy"/> : <div className="image-placeholder">ASRI</div>}</Link><div className="product-meta"><Link to={"/products/" + encodeURIComponent(product.slug)} className="product-name">{product.name}</Link><strong>{money(product.price_idr)}</strong>{(product.options?.length ?? 0) > 0 ? <Link className="text-button" to={"/products/" + encodeURIComponent(product.slug)}>Pilih opsi <ArrowRight size={14}/></Link> : <button className="text-button" disabled={product.stock_quantity < 1} onClick={() => add(product)}>Tambah ke keranjang <ArrowRight size={14}/></button>}</div></article>;
}
function App() {
  const [cart, setCart] = useState<CartLine[]>(readCart);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [reload, setReload] = useState(0);
  const navigate = useNavigate();
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.product.price_idr * line.quantity, 0);
  const updateCart = (next: CartLine[]) => { setCart(next); saveCart(next); };
  const add = (product: Product, selectedOptions: Record<string, string> = {}) => {
    const existing = cart.find(line => line.product.id === product.id);
    updateCart(existing
      ? cart.map(line => line.product.id === product.id ? { ...line, selected_options: selectedOptions, quantity: Math.min(line.quantity + 1, product.stock_quantity) } : line)
      : [...cart, { product, quantity: 1, selected_options: selectedOptions }]);
  };
  const setQuantity = (id: string, quantity: number) => updateCart(quantity < 1 ? cart.filter(line => line.product.id !== id) : cart.map(line => line.product.id === id ? { ...line, quantity: Math.min(quantity, line.product.stock_quantity) } : line));
  useEffect(() => { let active = true; setLoading(true); getProducts().then(data => { if (active) { setProducts(data); setCatalogError(""); } }).catch(e => { if (active) setCatalogError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [reload]);

  const catalog = (title: string, subtitle: string) => <section className="section"><div className="section-heading"><div><p className="eyebrow">ASRI COLLECTION</p><h1>{title}</h1><p className="muted">{subtitle}</p></div></div>{loading ? <div className="loading"><LoaderCircle className="spin"/> Memuat koleksi...</div> : catalogError ? <Notice>{catalogError} <button className="inline-action" onClick={() => setReload(v => v + 1)}>Coba lagi</button></Notice> : products.length === 0 ? <div className="empty"><ShoppingBag size={28}/><h3>Belum ada produk tersedia</h3><p>Silakan kembali lagi nanti.</p></div> : <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} add={add}/>)}</div>}</section>;

  function Home() { return <><section className="hero"><div className="hero-copy"><p className="eyebrow">ELEVATED EVERYDAY STYLE</p><h1>Elegan dalam<br/><em>setiap detail.</em></h1><p>Temukan pilihan gaya yang dirancang untuk menemani setiap momen Anda.</p><Link className="primary-button" to="/products">Jelajahi koleksi <ArrowRight size={16}/></Link></div><div className="hero-art"><span>ASRI</span><small>COLLECTION · 2026</small></div></section>{catalog("Pilihan untuk Anda", "Koleksi pilihan dari Asri Collection.")}</>; }
  function Catalog() { return catalog("Koleksi", "Temukan produk pilihan Asri Collection."); }
  function Detail() {
    const { slug } = useParams();
    const product = products.find(p => p.slug === slug);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    if (loading) return <div className="loading"><LoaderCircle className="spin"/> Memuat produk...</div>;
    if (catalogError) return <section className="section"><Notice>{catalogError}</Notice></section>;
    if (!product) return <section className="section"><Notice tone="info">Produk tidak ditemukan atau tidak tersedia.</Notice><Link to="/products" className="back-link"><ArrowLeft size={16}/> Kembali ke koleksi</Link></section>;
    return <section className="detail section"><div className="detail-image">{product.images?.[0] ? <img src={product.images[0]} alt={product.name}/> : <div className="image-placeholder">ASRI</div>}</div><div className="detail-copy"><p className="eyebrow">ASRI COLLECTION</p><h1>{product.name}</h1><strong className="detail-price">{money(product.price_idr)}</strong><p>{product.description || "Pilihan gaya dari Asri Collection."}</p><div className="option-list">{(product.options ?? []).map(option => <label key={option.name}>{option.name}<select value={selectedOptions[option.name] ?? ""} onChange={e => setSelectedOptions(v => ({ ...v, [option.name]: e.target.value }))}><option value="">Pilih {option.name.toLowerCase()}</option>{option.values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}</div><p className="stock">{product.stock_quantity > 0 ? "Tersedia" : "Stok habis"}</p><button className="primary-button" disabled={product.stock_quantity < 1 || (product.options ?? []).some(option => !selectedOptions[option.name])} onClick={() => { add(product, selectedOptions); navigate("/cart"); }}>Tambah ke keranjang <ShoppingBag size={16}/></button></div></section>;
  }
  function Cart() { return <section className="section narrow"><p className="eyebrow">KERANJANG</p><h1>Keranjang Belanja</h1>{cart.length === 0 ? <div className="empty"><ShoppingBag size={28}/><h3>Keranjang masih kosong</h3><Link className="primary-button" to="/products">Mulai belanja <ArrowRight size={16}/></Link></div> : <><div className="cart-list">{cart.map(line => <div className="cart-row" key={line.product.id}><div className="cart-thumb">{line.product.images?.[0] && <img src={line.product.images[0]} alt=""/>}</div><div className="cart-info"><b>{line.product.name}</b><span>{money(line.product.price_idr)}</span>{Object.entries(line.selected_options ?? {}).map(([key, value]) => <small className="cart-option" key={key}>{key}: {value}</small>)}<div className="qty"><button onClick={() => setQuantity(line.product.id, line.quantity - 1)} aria-label="Kurangi"><Minus size={14}/></button><span>{line.quantity}</span><button onClick={() => setQuantity(line.product.id, line.quantity + 1)} disabled={line.quantity >= line.product.stock_quantity} aria-label="Tambah"><Plus size={14}/></button></div></div><button className="icon-button" onClick={() => setQuantity(line.product.id, 0)} aria-label="Hapus"><Trash2 size={17}/></button></div>)}</div><div className="summary"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Pengiriman</span><b>{money(SHIPPING)}</b></div><div className="summary-total"><span>Total sementara</span><b>{money(subtotal + SHIPPING)}</b></div><Link className="primary-button full" to="/checkout">Lanjut ke checkout <ArrowRight size={16}/></Link></div></>}</section>; }
  function Checkout() {
    const [form, setForm] = useState<CustomerInput>({ name: "", email: "", phone: "", address: "", city: "", province: "", postal_code: "" });
    const [busy, setBusy] = useState(false); const [error, setError] = useState("");
    const change = (key: keyof CustomerInput, value: string) => setForm(v => ({ ...v, [key]: value }));
    const submit = async (e: FormEvent) => { e.preventDefault(); setError(""); if (!cart.length) return setError("Keranjang kosong."); setBusy(true); try { const order = await createOrder(cart.map(x => ({ product_id: x.product.id, quantity: x.quantity, selected_options: x.selected_options ?? {} })), form); sessionStorage.setItem(LOOKUP_KEY, JSON.stringify({ order_number: order.order_number, lookup_token: order.lookup_token })); updateCart([]); navigate("/payment/" + encodeURIComponent(order.order_number)); } catch (e) { setError(e instanceof Error ? e.message : "Checkout gagal."); } finally { setBusy(false); } };
    return <section className="section narrow"><p className="eyebrow">CHECKOUT</p><h1>Informasi Pengiriman</h1>{error && <Notice>{error}</Notice>}<form className="checkout-form" onSubmit={submit}><label>Nama lengkap<input required maxLength={120} value={form.name} onChange={e => change("name", e.target.value)}/></label><div className="form-grid"><label>Email<input type="email" required maxLength={254} value={form.email} onChange={e => change("email", e.target.value)}/></label><label>Nomor telepon<input required maxLength={30} value={form.phone} onChange={e => change("phone", e.target.value)}/></label></div><label>Alamat lengkap<textarea required maxLength={500} value={form.address} onChange={e => change("address", e.target.value)}/></label><div className="form-grid"><label>Kota/Kabupaten<input required maxLength={100} value={form.city} onChange={e => change("city", e.target.value)}/></label><label>Provinsi<input required maxLength={100} value={form.province} onChange={e => change("province", e.target.value)}/></label></div><label>Kode pos<input required maxLength={12} value={form.postal_code} onChange={e => change("postal_code", e.target.value)}/></label><div className="summary"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Pengiriman</span><b>{money(SHIPPING)}</b></div><div className="summary-total"><span>Total</span><b>{money(subtotal + SHIPPING)}</b></div><button className="primary-button full" disabled={busy || !cart.length}>{busy ? "Memproses..." : "Buat pesanan dan lanjut bayar"} <ArrowRight size={16}/></button></div></form></section>;
  }
  function Payment() {
    const { orderNumber = "" } = useParams();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const saved = useMemo(() => { try { return JSON.parse(sessionStorage.getItem(LOOKUP_KEY) || "null") as { order_number: string; lookup_token: string } | null; } catch { return null; } }, []);
    const proceed = async () => {
      if (!saved || saved.order_number !== orderNumber) { setError("Kode akses pesanan tidak ditemukan pada sesi ini."); return; }
      setBusy(true); setError("");
      try { const data = await createPayment(orderNumber, saved.lookup_token); window.location.assign(data.redirect_url); }
      catch (e) { setError(e instanceof Error ? e.message : "Pembayaran belum dapat diproses."); setBusy(false); }
    };
    return <section className="section narrow center"><p className="eyebrow">MIDTRANS SNAP</p><h1>Pesanan berhasil dibuat.</h1><p className="muted">Simpan kode akses ini untuk melihat status pesanan Anda di kemudian hari.</p><div className="summary status-summary"><div><span>Nomor pesanan</span><b>{orderNumber}</b></div><div className="access-code"><span>Kode akses</span><code>{saved?.order_number === orderNumber ? saved.lookup_token : "Tidak tersedia"}</code></div></div>{error && <Notice>{error}</Notice>}<button className="primary-button" disabled={busy || !saved || saved.order_number !== orderNumber} onClick={proceed}>{busy ? "Menghubungkan..." : "Lanjutkan ke pembayaran"} <ArrowRight size={16}/></button><p className="muted">Status pembayaran hanya diperbarui setelah notifikasi Midtrans diverifikasi server.</p></section>;
  }
  function Result() {
    const [params] = useSearchParams(); const orderNumber = params.get("order") || ""; const [status, setStatus] = useState<OrderStatus | null>(null); const [error, setError] = useState("");
    const saved = useMemo(() => { try { return JSON.parse(sessionStorage.getItem(LOOKUP_KEY) || "null") as { order_number: string; lookup_token: string } | null; } catch { return null; } }, []);
    useEffect(() => { let active = true; setStatus(null); setError(""); if (!saved || saved.order_number !== orderNumber) { setError("Sesi akses pesanan tidak tersedia. Gunakan pelacakan pesanan."); return; } const load = () => getOrderStatus(orderNumber, saved.lookup_token).then(v => { if (active) { setStatus(v); setError(""); } }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Status pesanan tidak dapat dimuat."); }); void load(); return () => { active = false; }; }, [orderNumber, saved]);
    const statusView = status ? getPaymentStatusView(status.payment_status) : null;
    const statusIcon = statusView?.icon === "success" ? <Check size={28}/> :
      statusView?.icon === "pending" ? <Clock3 size={28}/> :
      statusView?.icon === "failed" ? <XCircle size={28}/> :
      statusView?.icon === "expired" ? <Clock3 size={28}/> :
      statusView?.icon === "cancelled" ? <Ban size={28}/> :
      statusView?.icon === "refund" ? <RotateCcw size={28}/> :
      statusView?.icon === "problem" ? <AlertTriangle size={28}/> : <HelpCircle size={28}/>;
    return <section className="section narrow center">{statusView && <div className={"result-icon " + statusView.tone} aria-hidden="true">{statusIcon}</div>}<p className="eyebrow">STATUS PESANAN</p><h1>{statusView?.title ?? (error ? "Status belum dapat diperiksa" : "Memeriksa status pesanan")}</h1>{status && statusView ? <><p>Pesanan <b>{status.order_number}</b></p><div className="summary status-summary"><div><span>Status pembayaran</span><b>{statusView.label}</b></div><div><span>Status pesanan</span><b>{getOrderStatusLabel(status.order_status)}</b></div><div><span>Total</span><b>{money(status.total_idr)}</b></div></div><p className="muted status-description">{status.order_status === "problem" && status.payment_status === "success" ? "Pembayaran berhasil, tetapi pesanan memerlukan pemeriksaan lebih lanjut sebelum dapat diproses." : statusView.description}</p>{status.order_status === "problem" && <Notice tone="info">Pesanan memerlukan pemeriksaan lebih lanjut oleh tim Asri Collection.</Notice>}</> : error ? <Notice>{error}</Notice> : <div className="loading"><LoaderCircle className="spin"/> Memeriksa status pembayaran...</div>}<Link className="primary-button" to="/products">Kembali berbelanja</Link></section>;
  }
  function Tracking() {
    const [number, setNumber] = useState(""); const [token, setToken] = useState(""); const [result, setResult] = useState<OrderStatus | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
    const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setError(""); setResult(null); try { setResult(await getOrderStatus(number.trim(), token.trim())); } catch (e) { setError(e instanceof Error ? e.message : "Pesanan tidak ditemukan."); } finally { setBusy(false); } };
    return <section className="section narrow"><p className="eyebrow">ORDER TRACKING</p><h1>Lacak pesanan</h1><p className="muted">Masukkan nomor pesanan dan kode akses yang diberikan saat checkout.</p><form className="checkout-form" onSubmit={submit}><label>Nomor pesanan<input required value={number} onChange={e => setNumber(e.target.value)}/></label><label>Kode akses pesanan<input required type="password" value={token} onChange={e => setToken(e.target.value)}/></label><button className="primary-button full" disabled={busy}>{busy ? "Memeriksa..." : "Periksa status"}</button></form>{error && <Notice>{error}</Notice>}{result && <div className="summary status-summary"><div><span>Pembayaran</span><b>{result.payment_status}</b></div><div><span>Pesanan</span><b>{result.order_status}</b></div><div><span>Total</span><b>{money(result.total_idr)}</b></div></div>}</section>;
  }

  return <Layout count={count}><Routes><Route path="/" element={<Home/>}/><Route path="/products" element={<Catalog/>}/><Route path="/products/:slug" element={<Detail/>}/><Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/payment/:orderNumber" element={<Payment/>}/><Route path="/payment/result" element={<Result/>}/><Route path="/order" element={<Tracking/>}/><Route path="*" element={<section className="section"><h1>Halaman tidak ditemukan</h1><Link to="/">Kembali ke beranda</Link></section>}/></Routes></Layout>;
}

export default App;