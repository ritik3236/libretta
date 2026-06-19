"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { isActiveCurrencyDB } from "@/server/queries/currencies";

export type AdminResult = { ok: true; id?: string } | { ok: false; error: string };

const predefinedSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  currency: z.string().min(1, "Currency is required"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function createPredefinedParty(input: unknown): Promise<AdminResult> {
  const actorId = await requireRole();
  const parsed = predefinedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, phone, currency, note } = parsed.data;
  if (!(await isActiveCurrencyDB(currency))) {
    return { ok: false, error: "Unsupported currency" };
  }
  const party = await prisma.predefinedParty.create({
    data: { name, phone: phone || null, currency, note: note || null },
  });
  await writeAudit(actorId, "PREDEFINED_PARTY_CREATE", "PredefinedParty", party.id, { name, currency });
  revalidatePath("/admin/parties");
  return { ok: true, id: party.id };
}

export async function togglePredefinedPartyActive(
  id: string,
  isActive: boolean,
): Promise<AdminResult> {
  const actorId = await requireRole();
  const existing = await prisma.predefinedParty.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Party not found" };
  await prisma.predefinedParty.update({ where: { id }, data: { isActive } });
  await writeAudit(actorId, "PREDEFINED_PARTY_TOGGLE", "PredefinedParty", id, { isActive });
  revalidatePath("/admin/parties");
  return { ok: true };
}

/**
 * Assigns a predefined party to a user by creating a per-user Customer seeded
 * from the template. Skips if already assigned (sourcePredefinedId).
 */
export async function assignPredefinedPartyToUser(
  userId: string,
  predefinedId: string,
): Promise<AdminResult> {
  const actorId = await requireRole();
  const [user, template] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.predefinedParty.findUnique({ where: { id: predefinedId } }),
  ]);
  if (!user) return { ok: false, error: "User not found" };
  if (!template) return { ok: false, error: "Predefined party not found" };

  const already = await prisma.customer.findFirst({
    where: { userId, sourcePredefinedId: predefinedId },
  });
  if (already) return { ok: false, error: "Already assigned to this user" };

  const customer = await prisma.customer.create({
    data: {
      userId,
      name: template.name,
      phone: template.phone,
      currency: template.currency,
      note: template.note,
      sourcePredefinedId: template.id,
    },
  });
  await writeAudit(actorId, "PARTY_ASSIGN", "Customer", customer.id, {
    userId,
    predefinedId,
    name: template.name,
  });
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true, id: customer.id };
}
