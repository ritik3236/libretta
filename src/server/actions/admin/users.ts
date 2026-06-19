"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/auth";
import { writeAudit } from "@/server/audit";

export type AdminResult = { ok: true } | { ok: false; error: string };

/** Toggle whether a user may create their own parties. */
export async function setCanCreateParties(
  userId: string,
  canCreateParties: boolean,
): Promise<AdminResult> {
  const actorId = await requireRole();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found" };

  await prisma.user.update({ where: { id: userId }, data: { canCreateParties } });
  await writeAudit(actorId, "USER_PERM_TOGGLE", "User", userId, { canCreateParties });
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { ok: true };
}
