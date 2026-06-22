"use server";

import { revalidatePath } from "next/cache";
import { EntryStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { writeEntryVersion, signedDelta } from "@/server/versioning";
import { getEntryVersions, type AdminEntryVersion } from "@/server/queries/admin";

export type AdminResult = { ok: true } | { ok: false; error: string };

/** Loads an entry's full version history (admin-only). For row expansion. */
export async function loadEntryVersions(entryId: string): Promise<AdminEntryVersion[]> {
  await requireRole();
  return getEntryVersions(entryId);
}

const ARCHIVED = EntryStatus.ARCHIVED;

/**
 * Admin status transition (bypasses the user's PENDING-only lock). Records a
 * new version + audit row, and adjusts the cached balance ONLY when the entry
 * crosses the archived boundary:
 *   - leaving ARCHIVED → re-apply the entry's delta
 *   - entering ARCHIVED → reverse it
 *   - any other transition (pending↔approved↔rejected) → no balance change,
 *     because all non-archived statuses count.
 */
async function adminSetStatus(
  entryId: string,
  next: EntryStatus,
  action: string,
): Promise<AdminResult> {
  const actorId = await requireRole();
  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry) return { ok: false, error: "Entry not found" };
  if (entry.status === next) return { ok: true };

  const wasCounting = entry.status !== ARCHIVED;
  const willCount = next !== ARCHIVED;
  let balanceDelta = 0n;
  if (wasCounting && !willCount) balanceDelta = -signedDelta(entry.direction, entry.amountMinor);
  else if (!wasCounting && willCount) balanceDelta = signedDelta(entry.direction, entry.amountMinor);

  const changeType =
    next === ARCHIVED ? "ARCHIVE" : entry.status === ARCHIVED ? "UNARCHIVE" : "STATUS_CHANGE";
  const nextVersion = entry.version + 1;

  await prisma.$transaction(async (tx) => {
    await tx.entry.update({
      where: { id: entryId },
      data: { status: next, version: nextVersion },
    });
    await writeEntryVersion(tx, {
      entryId,
      version: nextVersion,
      direction: entry.direction,
      amountMinor: entry.amountMinor,
      currency: entry.currency,
      note: entry.note,
      occurredAt: entry.occurredAt,
      status: next,
      changeType,
      changedById: actorId,
      isAdmin: true,
    });
    if (balanceDelta !== 0n) {
      await tx.customer.update({
        where: { id: entry.customerId },
        data: { balanceMinor: { increment: balanceDelta } },
      });
    }
  });

  await writeAudit(actorId, action, "Entry", entryId, { from: entry.status, to: next });
  revalidatePath("/admin/entries");
  revalidatePath(`/banks/${entry.customerId}`);
  revalidatePath("/banks");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function approveEntry(entryId: string): Promise<AdminResult> {
  await requireRole();
  // Only pending entries can move to approved.
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { status: true },
  });
  if (!entry) return { ok: false, error: "Entry not found" };
  if (entry.status !== EntryStatus.PENDING) {
    return { ok: false, error: "Only pending entries can be approved." };
  }
  return adminSetStatus(entryId, EntryStatus.APPROVED, "ENTRY_APPROVE");
}

/**
 * Bulk-approves the given entries. Only entries currently PENDING are acted on
 * (others are skipped). Returns how many were approved.
 */
export async function bulkApprove(
  entryIds: string[],
): Promise<{ ok: true; approved: number } | { ok: false; error: string }> {
  await requireRole();
  const pending = await prisma.entry.findMany({
    where: { id: { in: entryIds }, status: EntryStatus.PENDING },
    select: { id: true },
  });
  let approved = 0;
  for (const e of pending) {
    const res = await adminSetStatus(e.id, EntryStatus.APPROVED, "ENTRY_APPROVE");
    if (res.ok) approved++;
  }
  return { ok: true, approved };
}
export async function rejectEntry(entryId: string): Promise<AdminResult> {
  return adminSetStatus(entryId, EntryStatus.REJECTED, "ENTRY_REJECT");
}
export async function archiveEntry(entryId: string): Promise<AdminResult> {
  return adminSetStatus(entryId, EntryStatus.ARCHIVED, "ENTRY_ARCHIVE");
}
/** Restore an archived entry back to PENDING (re-applies its balance). */
export async function unarchiveEntry(entryId: string): Promise<AdminResult> {
  return adminSetStatus(entryId, EntryStatus.PENDING, "ENTRY_UNARCHIVE");
}
