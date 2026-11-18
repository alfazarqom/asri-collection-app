export type Product = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  description: string | null;
  price_idr: number;
  compare_at_price_idr: number | null;
  images: string[];
  options: Array<{ name: string; values: string[] }>;
  stock_quantity: number;
};

export type CartLine = { product: Product; quantity: number };
export type CustomerInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
};

export type CreatedOrder = {
  order_number: string;
  lookup_token: string;
  subtotal_idr: number;
  shipping_cost_idr: number;
  total_idr: number;
};

export type OrderStatus = {
  order_number: string;
  order_status: string;
  payment_status: string;
  subtotal_idr: number;
  shipping_cost_idr: number;
  total_idr: number;
  created_at: string;
  expires_at: string | null;
};