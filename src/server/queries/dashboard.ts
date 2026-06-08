import { prisma } from "@/server/db";
import { listCustomers, type CustomerView } from "./customers";

export type CurrencyTotal = {
  currency: string;
  get: number; // sum of positive balances (minor units)
  give: number; // sum of abs(negative balances)
  net: number; // get - give
};

export type DashboardData = {
  totals: CurrencyTotal[];
  recent: CustomerView[];
  customerCount: number;
};

export async function getDashboard(userId: string): Promise<DashboardData> {
  const customers = await listCustomers(userId);

  const byCurrency = new Map<string, CurrencyTotal>();
  for (const c of customers) {
    const t =
      byCurrency.get(c.currency) ??
      { currency: c.currency, get: 0, give: 0, net: 0 };
    if (c.balance >= 0) t.get += c.balance;
    else t.give += Math.abs(c.balance);
    t.net = t.get - t.give;
    byCurrency.set(c.currency, t);
  }

  const totals = Array.from(byCurrency.values()).sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );

  return {
    totals,
    recent: customers.slice(0, 6),
    customerCount: customers.length,
  };
}
