export type CurrencyMeta = { code: string; symbol: string; decimals: number; label: string };

export const CURRENCIES: Record<string, CurrencyMeta> = {
  INR: { code: "INR", symbol: "₹", decimals: 2, label: "Indian Rupee" },
  USD: { code: "USD", symbol: "$", decimals: 2, label: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", decimals: 2, label: "Euro" },
  GBP: { code: "GBP", symbol: "£", decimals: 2, label: "British Pound" },
  AED: { code: "AED", symbol: "د.إ", decimals: 2, label: "UAE Dirham" },
  AUD: { code: "AUD", symbol: "A$", decimals: 2, label: "Australian Dollar" },
  CAD: { code: "CAD", symbol: "C$", decimals: 2, label: "Canadian Dollar" },
  SGD: { code: "SGD", symbol: "S$", decimals: 2, label: "Singapore Dollar" },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

export function currencyDecimals(code: string): number {
  return CURRENCIES[code]?.decimals ?? 2;
}

export function isSupportedCurrency(code: string): boolean {
  return code in CURRENCIES;
}
