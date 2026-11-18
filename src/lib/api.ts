import { supabase } from "./supabase";
import type { CreatedOrder, CustomerInput, OrderStatus, Product } from "../types";

function client() {
  if (!supabase) throw new Error("Konfigurasi backend belum tersedia.");
  return supabase;
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await client().functions.invoke("asri-get-products", { body: {} });
  if (error) throw new Error("Katalog tidak dapat dimuat. Silakan coba kembali.");
  if (!data || !Array.isArray(data.products)) throw new Error("Respons katalog tidak valid.");
  return data.products as Product[];
}

export async function createOrder(items: Array<{ product_id: string; quantity: number; selected_options?: Record<string, string> }>, customer: CustomerInput): Promise<CreatedOrder> {
  const { data, error } = await client().functions.invoke("asri-create-order", { body: { items, customer } });
  if (error || !data?.order) throw new Error(data?.error || "Pesanan belum dapat dibuat.");
  return data.order as CreatedOrder;
}

export async function createPayment(order_number: string, lookup_token: string): Promise<{ redirect_url: string }> {
  const { data, error } = await client().functions.invoke("asri-create-midtrans-payment", { body: { order_number, lookup_token } });
  if (error || !data?.redirect_url) throw new Error(data?.error || "Halaman pembayaran belum tersedia.");
  return data as { redirect_url: string };
}

export async function getOrderStatus(order_number: string, lookup_token: string): Promise<OrderStatus> {
  const { data, error } = await client().functions.invoke("asri-get-order-status", { body: { order_number, lookup_token } });
  if (error || !data?.order) throw new Error(data?.error || "Status pesanan tidak dapat dimuat.");
  return data.order as OrderStatus;
}