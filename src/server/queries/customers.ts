import { EntryStatus } from "@prisma/client";
import { prisma } from "@/server/db";

// Archived entries are hidden everywhere in the user app (and excluded from
// totals). All other statuses count.
const NOT_ARCHIVED = { status: { not: EntryStatus.ARCHIVED } } as const;

export type CustomerView = {
  id: string;
  name: string;
  phone: string | null;
  currency: string;
  balance: number; // signed minor units (+ you'll get)
  note: string | null;
  updatedAt: Date;
};

function toView(c: {
  id: string;
  name: string;
  phone: string | null;
  currency: string;
  balanceMinor: bigint;
  note: string | null;
  updatedAt: Date;
}): CustomerView {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    currency: c.currency,
    balance: Number(c.balanceMinor),
    note: c.note,
    updatedAt: c.updatedAt,
  };
}

export async function listCustomers(
  userId: string,
  search?: string,
): Promise<CustomerView[]> {
  const rows = await prisma.customer.findMany({
    where: {
      userId,
      ...(search
        ? { name: { contains: search } }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toView);
}

export type EntryView = {
  id: string;
  direction: "CREDIT" | "DEBIT";
  amount: number; // positive minor units
  currency: string;
  note: string | null;
  occurredAt: Date;
  status: EntryStatus;
};

export async function getCustomer(userId: string, id: string) {
  const customer = await prisma.customer.findFirst({
    where: { id, userId },
  });
  if (!customer) return null;

  const [entries, grouped] = await Promise.all([
    prisma.entry.findMany({
      where: { customerId: id, userId, ...NOT_ARCHIVED },
      orderBy: { occurredAt: "desc" },
    }),
    // Server-side aggregate so totals reflect ALL non-archived entries, not just rendered rows.
    prisma.entry.groupBy({
      by: ["direction"],
      where: { customerId: id, userId, ...NOT_ARCHIVED },
      _sum: { amountMinor: true },
    }),
  ]);

  let totalGave = 0;
  let totalGot = 0;
  for (const g of grouped) {
    const sum = Number(g._sum.amountMinor ?? 0);
    if (g.direction === "CREDIT") totalGave = sum;
    else totalGot = sum;
  }

  return {
    ...toView(customer),
    totalGave,
    totalGot,
    entries: entries.map<EntryView>((e) => ({
      id: e.id,
      direction: e.direction,
      amount: Number(e.amountMinor),
      currency: e.currency,
      note: e.note,
      occurredAt: e.occurredAt,
      status: e.status,
    })),
  };
}
