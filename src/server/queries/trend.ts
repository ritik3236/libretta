import { prisma } from "@/server/db";

export type TrendPoint = { label: string; value: number }; // value in minor units (cumulative net)
export type Trend = { currency: string; points: TrendPoint[] } | null;

/**
 * Cumulative net balance over time for the user's primary currency
 * (the currency used by the most customers), sampled at end-of-month
 * for up to the last 6 months. Months without entries carry the prior value.
 */
export async function getBalanceTrend(userId: string): Promise<Trend> {
  const customers = await prisma.customer.findMany({
    where: { userId },
    select: { currency: true },
  });
  if (customers.length === 0) return null;

  const counts = new Map<string, number>();
  for (const c of customers) counts.set(c.currency, (counts.get(c.currency) ?? 0) + 1);
  const currency = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const entries = await prisma.entry.findMany({
    where: { userId, currency },
    orderBy: { occurredAt: "asc" },
    select: { direction: true, amountMinor: true, occurredAt: true },
  });
  if (entries.length === 0) return { currency, points: [] };

  // cumulative net at the end of each month that had activity
  let cum = 0;
  const monthEnd = new Map<string, number>();
  for (const e of entries) {
    cum += e.direction === "CREDIT" ? Number(e.amountMinor) : -Number(e.amountMinor);
    const d = e.occurredAt;
    monthEnd.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, cum);
  }

  // build a continuous month range from first entry → current month
  const now = new Date();
  const first = entries[0].occurredAt;
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  const all: TrendPoint[] = [];
  let carry = 0;
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    if (monthEnd.has(key)) carry = monthEnd.get(key)!;
    all.push({ label: cursor.toLocaleString("en", { month: "short" }), value: carry });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { currency, points: all.slice(-6) };
}
