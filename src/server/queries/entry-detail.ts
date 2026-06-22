import { EntryStatus } from "@prisma/client";
import { prisma } from "@/server/db";

export type EntryVersionView = {
  version: number;
  direction: "CREDIT" | "DEBIT";
  amount: number; // positive minor units
  currency: string;
  note: string | null;
  status: EntryStatus;
  changeType: string;
  isAdmin: boolean;
  occurredAt: Date;
  validFrom: Date;
};

export type EntryDetail = {
  id: string;
  customerId: string;
  customerName: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  note: string | null;
  status: EntryStatus;
  version: number;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  versions: EntryVersionView[];
};

/**
 * One entry (scoped to the owner) plus its full immutable version timeline,
 * newest first. Powers the transaction detail page.
 */
export async function getEntryDetail(
  userId: string,
  id: string,
): Promise<EntryDetail | null> {
  const entry = await prisma.entry.findFirst({
    where: { id, userId },
    include: {
      customer: { select: { id: true, name: true } },
      versions: { orderBy: { version: "desc" } },
    },
  });
  if (!entry) return null;

  return {
    id: entry.id,
    customerId: entry.customerId,
    customerName: entry.customer.name,
    direction: entry.direction,
    amount: Number(entry.amountMinor),
    currency: entry.currency,
    note: entry.note,
    status: entry.status,
    version: entry.version,
    occurredAt: entry.occurredAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    versions: entry.versions.map((v) => ({
      version: v.version,
      direction: v.direction,
      amount: Number(v.amountMinor),
      currency: v.currency,
      note: v.note,
      status: v.status,
      changeType: v.changeType,
      isAdmin: v.isAdmin,
      occurredAt: v.occurredAt,
      validFrom: v.validFrom,
    })),
  };
}
