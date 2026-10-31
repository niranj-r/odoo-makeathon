/**
 * Currency formatter with zero decimals by default, with optional precision for exact invoice values.
 */
export function formatCurrency(amount, currency = 'USD', decimals = 0) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Formats a percentage value (e.g. 2.5%)
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format numbers with compact notation (e.g. 1.2K, 3.4M)
 */
export function formatCompactNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Formats standard number with commas (e.g. 1,482)
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Standard enterprise date formatting: "Oct 24, 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Date with time formatting: "Oct 24, 2026, 2:30 PM"
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}

