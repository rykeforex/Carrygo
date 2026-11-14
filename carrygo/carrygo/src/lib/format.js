export function formatMoney(amount, currency = "GHS") {
  // null/undefined/'' must never render as a price of 0
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-GH", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function timeAgo(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return formatDateTime(iso);
}

export const STATUS_LABELS = {
  requested: "Waiting for a collector",
  assigned: "Collector assigned",
  en_route: "Collector on the way",
  arrived: "Collector arrived",
  collected: "Waste collected",
  completed: "Completed",
  cancelled: "Cancelled",
};
export const ACTIVE_STATUSES = ["requested", "assigned", "en_route", "arrived", "collected"];
export const TIMELINE = ["requested", "assigned", "en_route", "arrived", "collected", "completed"];
export const TIMELINE_LABELS = {
  requested: "Requested", assigned: "Collector assigned", en_route: "On the way",
  arrived: "Arrived", collected: "Waste collected", completed: "Completed",
};
export const PAYMENT_LABELS = { pending: "Payment pending", paid: "Paid", failed: "Payment failed", refunded: "Refunded" };
