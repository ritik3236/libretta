"use server";

import { revalidatePath } from "next/cache";
import { EntryStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { getCurrencies } from "@/server/queries/currencies";
import { loadCustomerEntries, type EntryPage } from "@/server/queries/customers";
import { entrySchema, entryUpdateSchema } from "@/lib/validators";
import { toMinor } from "@/lib/money";
import { writeEntryVersion, signedDelta } from "@/server/versioning";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function revalidateEntryPaths(customerId: string) {
  revalidatePath(`/banks/${customerId}`);
  revalidatePath("/banks");
  revalidatePath("/dashboard");
}

/**
 * Creates an entry (status PENDING) + its v1 version, and updates the
 * customer's cached running balance — all in one transaction.
 * CREDIT (you gave) increases balance (you'll get more). DEBIT (you got) decreases it.
 */
export async function createEntry(input: unknown): Promise<ActionResult> {
  // Independent — run in parallel (getCurrencies hydrates the registry for toMinor).
  const [userId] = await Promise.all([requireUser(), getCurrencies()]);
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { customerId, direction, amount, note, occurredAt } = parsed.data;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, userId },
  });
  if (!customer) return { ok: false, error: "Customer not found" };

  const amountMinor = BigInt(toMinor(amount, customer.currency));
  const when = occurredAt ?? new Date();

  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.entry.create({
      data: {
        userId,
        customerId,
        direction,
        amountMinor,
        currency: customer.currency,
        note: note || null,
        occurredAt: when,
        status: EntryStatus.PENDING,
        version: 1,
      },
    });
    await writeEntryVersion(tx, {
      entryId: created.id,
      version: 1,
      direction,
      amountMinor,
      currency: customer.currency,
      note: note || null,
      occurredAt: when,
      status: EntryStatus.PENDING,
      changeType: "CREATE",
      changedById: userId,
      isAdmin: false,
    });
    await tx.customer.update({
      where: { id: customerId },
      data: { balanceMinor: { increment: signedDelta(direction, amountMinor) } },
    });
    return created;
  });

  revalidateEntryPaths(customerId);
  return { ok: true, id: entry.id };
}

/**
 * Edits an entry (locked after approval — users may only edit PENDING entries),
 * appends a new version, and adjusts the cached balance by old→new delta.
 */
export async function updateEntry(input: unknown): Promise<ActionResult> {
  const [userId] = await Promise.all([requireUser(), getCurrencies()]);
  const parsed = entryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, direction, amount, note, occurredAt } = parsed.data;

  const existing = await prisma.entry.findFirst({ where: { id, userId } });
  if (!existing) return { ok: false, error: "Entry not found" };
  if (existing.status !== EntryStatus.PENDING) {
    return { ok: false, error: "This entry is locked and can no longer be edited." };
  }

  const newAmountMinor = BigInt(toMinor(amount, existing.currency));
  const when = occurredAt ?? existing.occurredAt;
  const diff =
    signedDelta(direction, newAmountMinor) -
    signedDelta(existing.direction, existing.amountMinor);
  const nextVersion = existing.version + 1;

  await prisma.$transaction(async (tx) => {
    await tx.entry.update({
      where: { id },
      data: {
        direction,
        amountMinor: newAmountMinor,
        note: note || null,
        occurredAt: when,
        version: nextVersion,
      },
    });
    await writeEntryVersion(tx, {
      entryId: id,
      version: nextVersion,
      direction,
      amountMinor: newAmountMinor,
      currency: existing.currency,
      note: note || null,
      occurredAt: when,
      status: EntryStatus.PENDING,
      changeType: "EDIT",
      changedById: userId,
      isAdmin: false,
    });
    if (diff !== 0n) {
      await tx.customer.update({
        where: { id: existing.customerId },
        data: { balanceMinor: { increment: diff } },
      });
    }
  });

  revalidateEntryPaths(existing.customerId);
  return { ok: true, id };
}

/**
 * Soft-delete: archives the entry (status ARCHIVED), reverses its balance
 * contribution, and records an ARCHIVE version. The row is kept (hidden from
 * the user, visible to admin). Users may only archive PENDING entries.
 */
export async function deleteEntry(id: string): Promise<ActionResult> {
  const userId = await requireUser();
  const entry = await prisma.entry.findFirst({ where: { id, userId } });
  if (!entry) return { ok: false, error: "Entry not found" };
  if (entry.status === EntryStatus.ARCHIVED) {
    return { ok: true, id }; // already archived; nothing to do
  }
  if (entry.status !== EntryStatus.PENDING) {
    return { ok: false, error: "This entry is locked and can no longer be deleted." };
  }

  const nextVersion = entry.version + 1;

  await prisma.$transaction(async (tx) => {
    await tx.entry.update({
      where: { id },
      data: { status: EntryStatus.ARCHIVED, version: nextVersion },
    });
    await writeEntryVersion(tx, {
      entryId: id,
      version: nextVersion,
      direction: entry.direction,
      amountMinor: entry.amountMinor,
      currency: entry.currency,
      note: entry.note,
      occurredAt: entry.occurredAt,
      status: EntryStatus.ARCHIVED,
      changeType: "ARCHIVE",
      changedById: userId,
      isAdmin: false,
    });
    // reverse the entry's balance contribution
    await tx.customer.update({
      where: { id: entry.customerId },
      data: { balanceMinor: { increment: -signedDelta(entry.direction, entry.amountMinor) } },
    });
  });

  revalidateEntryPaths(entry.customerId);
  return { ok: true, id };
}

/**
 * Fetches the next page of a customer's ledger entries for infinite scroll.
 * `requireUser` + the userId filter in {@link loadCustomerEntries} keep a user
 * from reading another's entries.
 */
export async function loadMoreEntries(customerId: string, cursor: string): Promise<EntryPage> {
  const userId = await requireUser();
  return loadCustomerEntries(userId, customerId, cursor);
}
