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
