import { currencyDecimals } from "./currency";

/**
 * Money is stored as signed integer MINOR units (e.g. paise/cents).
 * Never use floats for storage. Format only at the edge.
 */

export function toMinor(major: number, currency: string): number {
  const factor = Math.pow(10, currencyDecimals(currency));
  return Math.round(major * factor);
}

export function fromMinor(minor: number, currency: string): number {
  const factor = Math.pow(10, currencyDecimals(currency));
  return minor / factor;
}

export function formatMoney(minor: number, currency: string, locale = "en-IN"): string {
  const value = fromMinor(minor, currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currencyDecimals(currency),
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(currencyDecimals(currency))}`;
  }
}

/** Absolute, unsigned formatting — useful for "you'll get / you'll give" where the label carries the sign. */
export function formatAbs(minor: number, currency: string, locale = "en-IN"): string {
  return formatMoney(Math.abs(minor), currency, locale);
}

/**
 * Group the integer part of a raw amount-input string (as typed on the keypad)
 * with thousands/lakh separators for readable display, while preserving the
 * partial decimal part and any trailing ".". The raw string itself is never
 * mutated — this is display-only.
 */
export function groupAmountInput(raw: string, locale = "en-IN"): string {
  if (!raw) return "0";
  const [intPart, decPart] = raw.split(".");
  const grouped = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    Number(intPart || "0"),
  );
  return raw.includes(".") ? `${grouped}.${decPart ?? ""}` : grouped;
}
