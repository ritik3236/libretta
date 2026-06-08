import { prisma } from "@/server/db";
import { listCustomers } from "./customers";

export type CurrencyTotal = {
  currency: string;
  get: number; // sum of positive balances (minor units)
  give: number; // sum of abs(negative balances)
  net: number; // get - give
};

export type RecentEntry = {
  id: string;
  customerId: string;
  customerName: string;
  direction: "CREDIT" | "DEBIT";
  amount: number; // positive minor units
  currency: string;
  note: string | null;
  occurredAt: Date;
};

export type DashboardData = {
  baseCurrency: string;
  businessName: string | null;
  totals: CurrencyTotal[];
  recentEntries: RecentEntry[];
  customers: { id: string; name: string }[];
  customerCount: number;
};

export async function getDashboard(userId: string): Promise<DashboardData> {
  const [customers, user, recentRows] = await Promise.all([
    listCustomers(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true, businessName: true },
    }),
    prisma.entry.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      take: 30,
      include: { customer: { select: { name: true } } },
    }),
  ]);

  const byCurrency = new Map<string, CurrencyTotal>();
  for (const c of customers) {
    const t =
      byCurrency.get(c.currency) ?? { currency: c.currency, get: 0, give: 0, net: 0 };
    if (c.balance >= 0) t.get += c.balance;
    else t.give += Math.abs(c.balance);
    t.net = t.get - t.give;
    byCurrency.set(c.currency, t);
  }

  const totals = Array.from(byCurrency.values()).sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );

  const recentEntries: RecentEntry[] = recentRows.map((e) => ({
    id: e.id,
    customerId: e.customerId,
    customerName: e.customer.name,
    direction: e.direction,
    amount: Number(e.amountMinor),
    currency: e.currency,
    note: e.note,
    occurredAt: e.occurredAt,
  }));

  return {
    baseCurrency: user?.baseCurrency ?? "INR",
    businessName: user?.businessName ?? null,
    totals,
    recentEntries,
    customers: customers.map((c) => ({ id: c.id, name: c.name })),
    customerCount: customers.length,
  };
}
