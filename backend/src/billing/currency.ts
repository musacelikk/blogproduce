/**
 * We sell in Turkish lira but our provider bill arrives in US dollars, so the
 * two currencies cannot be collapsed into one number. The rule this file
 * enforces:
 *
 *   - provider cost  → always USD (what OpenAI/Anthropic actually charge)
 *   - prices/revenue → always TRY (what the customer actually pays)
 *   - margin         → computed in TRY, after converting cost at `usdTryRate()`
 *
 * Field names carry their unit (`costUsd`, `priceTry`) precisely so a mismatch
 * is visible at the call site instead of silently producing a wrong margin.
 */

/**
 * Fallback used when USD_TRY_RATE is unset. Deliberately conservative: an
 * understated rate reports margins as *worse* than reality, so a stale value
 * never talks us into underpricing.
 */
export const DEFAULT_USD_TRY_RATE = 42;

/**
 * Read at call time rather than cached, so a redeploy with a new rate takes
 * effect without touching code. The admin cost screen shows the live value.
 */
export function usdTryRate(): number {
  const raw = Number(process.env.USD_TRY_RATE);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_USD_TRY_RATE;
}

export function usdToTry(amountUsd: number, rate: number = usdTryRate()): number {
  return amountUsd * rate;
}

export function tryToUsd(amountTry: number, rate: number = usdTryRate()): number {
  return rate > 0 ? amountTry / rate : 0;
}

/** Gross margin (%) where revenue is TRY and cost is USD. Null when unpriced. */
export function grossMarginPct(revenueTry: number, costUsd: number): number | null {
  if (revenueTry <= 0) return null;
  const costTry = usdToTry(costUsd);
  return Number((((revenueTry - costTry) / revenueTry) * 100).toFixed(1));
}

export function formatTry(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** Round a computed price to something a customer would recognise as a price. */
export function roundToPricePoint(amountTry: number): number {
  if (amountTry < 100) return Math.round(amountTry);
  if (amountTry < 1000) return Math.round(amountTry / 10) * 10 - 1;
  return Math.round(amountTry / 100) * 100 - 1;
}
