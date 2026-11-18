export type PaymentStatusTone = "success" | "pending" | "danger" | "neutral";
export type PaymentStatusIcon = "success" | "pending" | "failed" | "expired" | "cancelled" | "refund" | "problem" | "unknown";

export type PaymentStatusView = {
  label: string;
  title: string;
  description: string;
  tone: PaymentStatusTone;
  icon: PaymentStatusIcon;
};

const PAYMENT_STATUS_VIEWS: Record<string, PaymentStatusView> = {
  success: {
    label: "Berhasil",
    title: "Pembayaran berhasil",
    description: "Pembayaran telah dikonfirmasi. Pesanan Anda akan diproses sesuai tahapan berikutnya.",
    tone: "success",
    icon: "success"
  },
  pending: {
    label: "Menunggu pembayaran",
    title: "Menunggu konfirmasi pembayaran",
    description: "Pembayaran belum dikonfirmasi. Jika Anda sudah membayar, tunggu beberapa saat lalu periksa kembali status pesanan.",
    tone: "pending",
    icon: "pending"
  },
  failed: {
    label: "Gagal",
    title: "Pembayaran gagal",
    description: "Pembayaran belum berhasil. Silakan hubungi layanan pelanggan jika Anda memerlukan bantuan.",
    tone: "danger",
    icon: "failed"
  },
  expired: {
    label: "Kedaluwarsa",
    title: "Batas waktu pembayaran berakhir",
    description: "Batas waktu pembayaran pesanan ini telah berakhir. Silakan buat pesanan baru jika masih ingin berbelanja.",
    tone: "neutral",
    icon: "expired"
  },
  cancelled: {
    label: "Dibatalkan",
    title: "Transaksi dibatalkan",
    description: "Transaksi pembayaran untuk pesanan ini telah dibatalkan.",
    tone: "neutral",
    icon: "cancelled"
  },
  refund: {
    label: "Pengembalian dana",
    title: "Status pengembalian dana tercatat",
    description: "Transaksi memiliki status pengembalian dana. Hubungi layanan pelanggan untuk informasi lebih lanjut.",
    tone: "neutral",
    icon: "refund"
  },
  problem: {
    label: "Perlu pemeriksaan",
    title: "Pembayaran memerlukan pemeriksaan",
    description: "Status pembayaran memerlukan pemeriksaan lebih lanjut. Tim Asri Collection perlu meninjau pesanan ini.",
    tone: "danger",
    icon: "problem"
  }
};

export function getPaymentStatusView(status: string): PaymentStatusView {
  const normalized = status.trim().toLowerCase();
  return PAYMENT_STATUS_VIEWS[normalized] ?? {
    label: "Status belum dikenali",
    title: "Status pembayaran belum dikenali",
    description: "Status pembayaran belum dapat dijelaskan. Silakan hubungi layanan pelanggan dengan menyertakan nomor pesanan.",
    tone: "neutral",
    icon: "unknown"
  };
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu diproses",
  processing: "Sedang diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  problem: "Perlu penanganan"
};

export function getOrderStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  return ORDER_STATUS_LABELS[normalized] ?? "Status pesanan belum dikenali";
}
