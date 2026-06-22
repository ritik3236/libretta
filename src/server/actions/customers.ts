"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { isActiveCurrencyDB } from "@/server/queries/currencies";
import { customerSchema } from "@/lib/validators";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createCustomer(input: unknown): Promise<ActionResult> {
  const userId = await requireUser();
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, phone, currency, note } = parsed.data;

  // Permission gate: an admin may have disabled self-creation for this user.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { canCreateBanks: true },
  });
  if (!user?.canCreateBanks) {
    return { ok: false, error: "You don't have permission to create banks." };
  }
  if (!(await isActiveCurrencyDB(currency))) {
    return { ok: false, error: "Unsupported currency" };
  }

  const customer = await prisma.customer.create({
    data: {
      userId,
      name,
      phone: phone || null,
      currency,
      note: note || null,
    },
  });

  revalidatePath("/banks");
  revalidatePath("/dashboard");
  return { ok: true, id: customer.id };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const userId = await requireUser();
  const existing = await prisma.customer.findFirst({ where: { id, userId } });
  if (!existing) return { ok: false, error: "Customer not found" };

  await prisma.customer.delete({ where: { id } });
  revalidatePath("/banks");
  revalidatePath("/dashboard");
  return { ok: true, id };
}
