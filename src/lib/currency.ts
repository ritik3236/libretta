export type CurrencyMeta = {
  code: string;
  symbol: string;
  decimals: number;
  label: string;
  isActive?: boolean;
};

/**
 * Currency metadata is now sourced from the DB (lb_currencies), but money
 * formatting (money.ts) and many client components read it SYNCHRONOUSLY at
 * render time. So we keep a small in-memory registry that is hydrated before
 * render:
 *   - on the server, by `getCurrencies()` (src/server/queries/currencies.ts),
 *     called in async layouts / actions / queries before any money math;
 *   - on the client, by <CurrencyProvider> synchronously in its render body.
 *
 * The `?? 2` decimals fallback is the safety net for the brief window before
 * hydration (all launch currencies are 2-decimal, so math is unaffected).
 */
let _registry: Record<string, CurrencyMeta> = {};

export function hydrateCurrencies(list: CurrencyMeta[]): void {
  _registry = Object.fromEntries(list.map((c) => [c.code, c]));
}

export function getCurrencyMeta(code: string): CurrencyMeta | undefined {
  return _registry[code];
}

/** All currencies currently in the registry. */
export function currencyList(): CurrencyMeta[] {
  return Object.values(_registry);
}

/** Active currencies only — for user-facing pickers. */
export function activeCurrencyList(): CurrencyMeta[] {
  return Object.values(_registry).filter((c) => c.isActive !== false);
}

export function currencyDecimals(code: string): number {
  return _registry[code]?.decimals ?? 2;
}

export function isSupportedCurrency(code: string): boolean {
  return code in _registry;
}
