/**
 * Canonical seed list for the lb_currencies table. These are the 8 currencies
 * that were previously hardcoded in src/lib/currency.ts — seeding them keeps
 * launch-time behavior identical after the move to a DB-backed catalog.
 */
export const SEED_CURRENCIES = [
  { code: "INR", symbol: "₹", decimals: 2, label: "Indian Rupee" },
  { code: "USD", symbol: "$", decimals: 2, label: "US Dollar" },
  { code: "EUR", symbol: "€", decimals: 2, label: "Euro" },
  { code: "GBP", symbol: "£", decimals: 2, label: "British Pound" },
  { code: "AED", symbol: "د.إ", decimals: 2, label: "UAE Dirham" },
  { code: "AUD", symbol: "A$", decimals: 2, label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", decimals: 2, label: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", decimals: 2, label: "Singapore Dollar" },
] as const;
