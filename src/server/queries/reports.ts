import { EntryStatus } from "@prisma/client";
import { prisma } from "@/server/db";

export type ReportBank = {
  id: string;
  name: string;
  balance: number; // signed minor units
  lastActivity: Date;
};

export type MonthlyPoint = {
  label: string;
  gave: number; // minor
  got: number; // minor
  net: number; // cumulative net (minor)
};

export type ReportData = {
  currency: string;
  summary: { gave: number; got: number; net: number };
  monthly: MonthlyPoint[];
  exposure: {
    receivable: number;
    payable: number;
    receivableCount: number;
    payableCount: number;
    settledCount: number;
  };
  topReceivables: ReportBank[];
  topPayables: ReportBank[];
  aging: ReportBank[];
};

/** Distinct currencies the user has banks in (for the currency toggle). */
export async function getReportCurrencies(userId: string): Promise<string[]> {
  const rows = await prisma.customer.findMany({
    where: { userId },
    distinct: ["currency"],
    select: { currency: true },
    orderBy: { currency: "asc" },
  });
  return rows.map((r) => r.currency);
}

export async function getReports(
  userId: string,
  currency: string,
  from: Date,
  to: Date,
): Promise<ReportData> {
  const [customers, entries] = await Promise.all([
    prisma.customer.findMany({
      where: { userId, currency },
      select: { id: true, name: true, balanceMinor: true, updatedAt: true },
    }),
    prisma.entry.findMany({
      where: {
        userId,
        currency,
        occurredAt: { gte: from, lte: to },
        status: { not: EntryStatus.ARCHIVED },
      },
      select: { direction: true, amountMinor: true, occurredAt: true },
      orderBy: { occurredAt: "asc" },
    }),
  ]);

  // Period activity → summary + monthly buckets
  let gave = 0;
  let got = 0;
  const monthMap = new Map<string, { label: string; gave: number; got: number }>();
  for (const e of entries) {
    const amt = Number(e.amountMinor);
    if (e.direction === "CREDIT") gave += amt;
    else got += amt;
    const d = e.occurredAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const m =
      monthMap.get(key) ?? { label: d.toLocaleString("en", { month: "short" }), gave: 0, got: 0 };
    if (e.direction === "CREDIT") m.gave += amt;
    else m.got += amt;
    monthMap.set(key, m);
  }
  const monthly: MonthlyPoint[] = [];
  let running = 0;
  for (const key of [...monthMap.keys()].sort()) {
    const m = monthMap.get(key)!;
    running += m.gave - m.got;
    monthly.push({ label: m.label, gave: m.gave, got: m.got, net: running });
  }

  // Balance-based sections (current, all-time) for this currency
  const banks: ReportBank[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    balance: Number(c.balanceMinor),
    lastActivity: c.updatedAt,
  }));

  let receivable = 0;
  let payable = 0;
  let receivableCount = 0;
  let payableCount = 0;
  let settledCount = 0;
  for (const p of banks) {
    if (p.balance > 0) {
      receivable += p.balance;
      receivableCount++;
    } else if (p.balance < 0) {
      payable += Math.abs(p.balance);
      payableCount++;
    } else settledCount++;
  }

  const topReceivables = banks
    .filter((p) => p.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);
  const topPayables = banks
    .filter((p) => p.balance < 0)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 5);
  const aging = banks
    .filter((p) => p.balance !== 0)
    .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
    .slice(0, 5);

  return {
    currency,
    summary: { gave, got, net: gave - got },
    monthly,
    exposure: { receivable, payable, receivableCount, payableCount, settledCount },
    topReceivables,
    topPayables,
    aging,
  };
}
