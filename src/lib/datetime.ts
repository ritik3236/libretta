/**
 * Timezone policy (hard rule):
 *   - Users input in IST → we store UTC.
 *   - DB returns UTC → we display in IST.
 *   - DB columns are `timestamp` (stored UTC).
 *
 * IST (Asia/Kolkata) is a fixed +05:30 offset with no DST, so conversions are
 * exact. These helpers use Intl with an explicit timeZone so they're correct
 * regardless of the server's timezone (Vercel/Node usually run in UTC).
 */
const IST = "Asia/Kolkata";
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const DATETIME_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: IST,
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_SHORT_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  day: "numeric",
  month: "short",
});

// en-CA yields ISO-style yyyy-MM-dd
const ISO_DATE_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "8 Jun 26 5:42 PM IST" — full timestamp in IST. */
export function formatDateTimeIST(date: Date): string {
  const p = Object.fromEntries(
    DATETIME_FMT.formatToParts(date).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  return `${p.day} ${p.month} ${p.year} ${p.hour}:${p.minute} ${p.dayPeriod} IST`;
}

/** "8 Jun 26, 5:42 PM" — compact date + time in IST (no "IST" suffix, for lists). */
export function formatDateTimeShortIST(date: Date): string {
  const p = Object.fromEntries(
    DATETIME_FMT.formatToParts(date).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} ${p.dayPeriod}`;
}

/** "8 Jun 2026" — date only, in IST. */
export function formatDateIST(date: Date): string {
  return DATE_FMT.format(date);
}

/** "8 Jun" — short date, in IST. */
export function formatDateShortIST(date: Date): string {
  return DATE_SHORT_FMT.format(date);
}

/** "2026-06-08" — ISO date in IST (for CSV/exports). */
export function formatISODateIST(date: Date): string {
  return ISO_DATE_FMT.format(date);
}

/**
 * Reinterprets a picked wall-clock as IST and returns the matching UTC instant
 * — the write side of the policy. For a browser already in IST this is the
 * identity (the instant is unchanged); for any other browser it forces the
 * selection to be treated as IST, so input is always saved as IST→UTC.
 */
export function istInputToUTC(picked: Date): Date {
  return new Date(
    Date.UTC(
      picked.getFullYear(),
      picked.getMonth(),
      picked.getDate(),
      picked.getHours(),
      picked.getMinutes(),
      picked.getSeconds(),
      picked.getMilliseconds(),
    ) - IST_OFFSET_MS,
  );
}

/** UTC instant for the start (00:00:00.000 IST) of a "yyyy-MM-dd" IST day. */
export function istDayStartUTC(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS);
}

/** UTC instant for the end (23:59:59.999 IST) of a "yyyy-MM-dd" IST day. */
export function istDayEndUTC(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS);
}
