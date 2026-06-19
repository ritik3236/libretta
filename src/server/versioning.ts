import "server-only";
import type { Prisma, Direction, EntryStatus } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type EntryVersionInput = {
  entryId: string;
  version: number;
  direction: Direction;
  amountMinor: bigint;
  currency: string;
  note: string | null;
  occurredAt: Date;
  status: EntryStatus;
  changeType: "CREATE" | "EDIT" | "STATUS_CHANGE" | "ARCHIVE" | "UNARCHIVE";
  changedById: string;
  isAdmin: boolean;
};

/**
 * Appends a new entry version, expiring the prior live one (validTo = now).
 * Must run inside the same transaction as the Entry mutation so the timeline
 * and the live Entry never diverge. On CREATE there is no prior version, so the
 * updateMany simply matches nothing.
 */
export async function writeEntryVersion(tx: Tx, v: EntryVersionInput): Promise<void> {
  await tx.entryVersion.updateMany({
    where: { entryId: v.entryId, validTo: null },
    data: { validTo: new Date() },
  });
  await tx.entryVersion.create({
    data: {
      entryId: v.entryId,
      version: v.version,
      direction: v.direction,
      amountMinor: v.amountMinor,
      currency: v.currency,
      note: v.note,
      occurredAt: v.occurredAt,
      status: v.status,
      changeType: v.changeType,
      changedById: v.changedById,
      isAdmin: v.isAdmin,
    },
  });
}

/** Signed balance contribution of an entry (CREDIT adds, DEBIT subtracts). */
export function signedDelta(direction: Direction, amountMinor: bigint): bigint {
  return direction === "CREDIT" ? amountMinor : -amountMinor;
}
