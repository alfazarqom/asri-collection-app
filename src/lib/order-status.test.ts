import { describe, expect, it } from "vitest";
import { getOrderStatusLabel, getPaymentStatusView } from "./order-status";

describe("payment status presentation", () => {
  it.each([
    ["success", "Berhasil", "success"],
    ["pending", "Menunggu pembayaran", "pending"],
    ["failed", "Gagal", "danger"],
    ["expired", "Kedaluwarsa", "neutral"],
    ["cancelled", "Dibatalkan", "neutral"],
    ["refund", "Pengembalian dana", "neutral"],
    ["problem", "Perlu pemeriksaan", "danger"]
  ])("maps %s to a user-facing status", (status, label, tone) => {
    const view = getPaymentStatusView(status);
    expect(view.label).toBe(label);
    expect(view.tone).toBe(tone);
  });

  it("normalizes status casing and whitespace", () => {
    expect(getPaymentStatusView(" SUCCESS ").title).toBe("Pembayaran berhasil");
  });

  it("uses a neutral fallback for unknown payment statuses", () => {
    const view = getPaymentStatusView("provider_new_state");
    expect(view.label).toBe("Status belum dikenali");
    expect(view.tone).toBe("neutral");
    expect(view.icon).toBe("unknown");
  });
});

describe("order status presentation", () => {
  it("maps known order states", () => {
    expect(getOrderStatusLabel("processing")).toBe("Sedang diproses");
    expect(getOrderStatusLabel("completed")).toBe("Selesai");
  });

  it("does not expose unknown states as a successful state", () => {
    expect(getOrderStatusLabel("unexpected")).toBe("Status pesanan belum dikenali");
  });
});
