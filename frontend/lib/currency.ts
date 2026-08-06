/**
 * Money formatting. Two currencies live in this app and they must never be
 * formatted by the same helper:
 *
 *   - `try*`  — what customers pay (plans, token packs, invoices)
 *   - `usd*`  — what our providers charge us (admin cost analysis only)
 *
 * Anything a customer sees is TRY. USD appears only on internal admin screens,
 * always next to the exchange rate it was converted at.
 */

const tryFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

const tryFormatterPrecise = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** e.g. `₺1.999`. Whole lira by default — prices are round numbers. */
export function formatTry(value: number | null | undefined, precise = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return precise ? tryFormatterPrecise.format(value) : tryFormatter.format(value);
}

/**
 * Provider cost, admin screens only. Small figures keep more decimals because a
 * per-article cost is often a fraction of a cent and rounding it to 2dp would
 * display every tier as "$0.01".
 */
export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const digits = Math.abs(value) < 1 ? 4 : 2;
  return `$${value.toFixed(digits)}`;
}

export function formatTokens(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    // toLocaleString, not toFixed: on a tr-TR page "1.5M" reads as 1500, because
    // a dot is the thousands separator. This must render "1,5M".
    return `${millions.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000).toLocaleString('tr-TR')}K`;
  return value.toLocaleString('tr-TR');
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `%${value.toFixed(1)}`;
}
