/**
 * Currency formatter with zero decimals by default for clean dashboard typography,
 * with optional precision for exact invoice values.
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  decimals: number = 0
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Formats a fraction or percentage value (e.g. 2.45% or 0.0245)
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  alreadyPercent: boolean = true
): string {
  const percentVal = alreadyPercent ? value : value * 100;
  return `${percentVal >= 0 ? "" : ""}${percentVal.toFixed(decimals)}%`;
}

/**
 * Format numbers with compact notation (e.g. 1.2K, 3.4M)
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format standard number with commas (e.g. 1,482)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Standard enterprise date formatting: "Oct 24, 2024"
 */
export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "—";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Date with time formatting: "Oct 24, 2024, 2:30 PM"
 */
export function formatDateTime(dateString: string | Date | undefined): string {
  if (!dateString) return "—";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

/**
 * Helper to get status colors and labels for badges
 */
export function getStatusBadgeProps(status: string): {
  variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
  label: string;
} {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "active":
    case "paid":
    case "succeeded":
      return { variant: "success", label: normalized.charAt(0).toUpperCase() + normalized.slice(1) };
    case "pending":
    case "quotation":
    case "draft":
    case "trialing":
      return { variant: "secondary", label: normalized.charAt(0).toUpperCase() + normalized.slice(1) };
    case "confirmed":
      return { variant: "default", label: "Confirmed" };
    case "overdue":
    case "failed":
    case "danger":
      return { variant: "destructive", label: normalized.charAt(0).toUpperCase() + normalized.slice(1) };
    case "paused":
    case "pastdue":
    case "past_due":
      return { variant: "warning", label: "Past Due" };
    case "closed":
    case "canceled":
    case "refunded":
      return { variant: "outline", label: normalized.charAt(0).toUpperCase() + normalized.slice(1) };
    default:
      return { variant: "outline", label: status };
  }
}
