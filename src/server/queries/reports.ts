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
  // Aggregate the period's activity in the DB (group by IST month + direction)
  // rather than streaming every in-range entry into Node and reducing in JS.
  // Served by the [userId, currency, occurredAt] index; result is ≤2 rows/month.
  const [customers, monthRows] = await Promise.all([
    prisma.customer.findMany({
      where: { userId, currency },
      select: { id: true, name: true, balanceMinor: true, updatedAt: true },
    }),
    prisma.$queryRaw<{ ym: string; direction: string; total: bigint }[]>`
      SELECT DATE_FORMAT(CONVERT_TZ(occurredAt, '+00:00', '+05:30'), '%Y-%m') AS ym,
             direction,
             CAST(SUM(amountMinor) AS SIGNED) AS total
      FROM lb_entries
      WHERE userId = ${userId}
        AND currency = ${currency}
        AND occurredAt >= ${from}
        AND occurredAt <= ${to}
        AND status <> 'ARCHIVED'
      GROUP BY DATE_FORMAT(CONVERT_TZ(occurredAt, '+00:00', '+05:30'), '%Y-%m'), direction
      ORDER BY ym ASC
    `,
  ]);

  // Fold per-(month, direction) sums into monthly points + the period summary.
  let gave = 0;
  let got = 0;
  const monthMap = new Map<string, { gave: number; got: number }>();
  for (const r of monthRows) {
    const amt = Number(r.total);
    const m = monthMap.get(r.ym) ?? { gave: 0, got: 0 };
    if (r.direction === "CREDIT") {
      m.gave += amt;
      gave += amt;
    } else {
      m.got += amt;
      got += amt;
    }
    monthMap.set(r.ym, m);
  }
  const monthly: MonthlyPoint[] = [];
  let running = 0;
  for (const ym of [...monthMap.keys()].sort()) {
    const m = monthMap.get(ym)!;
    running += m.gave - m.got;
    const [y, mo] = ym.split("-").map(Number);
    const label = new Date(y, mo - 1, 1).toLocaleString("en", { month: "short" });
    monthly.push({ label, gave: m.gave, got: m.got, net: running });
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
