export const SHIPPING_IDR = 52000;

export function formatIDR(amount: number): string {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError("Amount must be a non-negative safe integer");
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function calculateOrderTotals(subtotal: number, shipping = SHIPPING_IDR) {
  if (!Number.isSafeInteger(subtotal) || subtotal < 0 || !Number.isSafeInteger(shipping) || shipping < 0) {
    throw new RangeError("Totals must use non-negative safe integers");
  }
  const total = subtotal + shipping;
  if (!Number.isSafeInteger(total)) throw new RangeError("Total exceeds safe integer range");
  return { subtotal_idr: subtotal, shipping_cost_idr: shipping, total_idr: total };
}