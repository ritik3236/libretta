"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { isSupportedCurrency } from "@/lib/currency";

const profileSchema = z.object({
  businessName: z.string().trim().max(80).optional().or(z.literal("")),
  baseCurrency: z.string().refine(isSupportedCurrency, "Unsupported currency"),
});

export type ProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: unknown): Promise<ProfileResult> {
  const userId = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      businessName: parsed.data.businessName || null,
      baseCurrency: parsed.data.baseCurrency,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
