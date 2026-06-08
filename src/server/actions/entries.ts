"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { entrySchema } from "@/lib/validators";
import { toMinor } from "@/lib/money";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Creates an entry and updates the customer's cached running balance in one transaction.
 * CREDIT (you gave) increases balance (you'll get more). DEBIT (you got) decreases it.
 */
export async function createEntry(input: unknown): Promise<ActionResult> {
  const userId = await requireUser();
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
  const delta = direction === "CREDIT" ? amountMinor : -amountMinor;

  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.entry.create({
      data: {
        userId,
        customerId,
        direction,
        amountMinor,
        currency: customer.currency,
        note: note || null,
        occurredAt: occurredAt ?? new Date(),
      },
    });
    await tx.customer.update({
      where: { id: customerId },
      data: { balanceMinor: { increment: delta } },
    });
    return created;
  });

  revalidatePath(`/parties/${customerId}`);
  revalidatePath("/parties");
  revalidatePath("/dashboard");
  return { ok: true, id: entry.id };
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  const userId = await requireUser();
  const entry = await prisma.entry.findFirst({ where: { id, userId } });
  if (!entry) return { ok: false, error: "Entry not found" };

  const delta =
    entry.direction === "CREDIT" ? -entry.amountMinor : entry.amountMinor;

  await prisma.$transaction(async (tx) => {
    await tx.entry.delete({ where: { id } });
    await tx.customer.update({
      where: { id: entry.customerId },
      data: { balanceMinor: { increment: delta } },
    });
  });

  revalidatePath(`/parties/${entry.customerId}`);
  revalidatePath("/parties");
  revalidatePath("/dashboard");
  return { ok: true, id };
}
