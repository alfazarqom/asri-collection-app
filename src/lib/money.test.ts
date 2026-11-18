import { describe, expect, it } from "vitest";
import { calculateOrderTotals, formatIDR, SHIPPING_IDR } from "./money";

describe("Asri IDR money helpers", () => {
  it("uses the approved flat shipping rate", () => {
    expect(SHIPPING_IDR).toBe(52000);
    expect(calculateOrderTotals(100000)).toEqual({
      subtotal_idr: 100000,
      shipping_cost_idr: 52000,
      total_idr: 152000
    });
  });

  it("rejects fractional and negative IDR values", () => {
    expect(() => calculateOrderTotals(-1)).toThrow(RangeError);
    expect(() => calculateOrderTotals(10.5)).toThrow(RangeError);
  });

  it("formats whole rupiah amounts", () => {
    expect(formatIDR(52000)).toContain("52.000");
  });
});