"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { revalidateCurrencies } from "@/server/queries/currencies";

export type AdminResult = { ok: true } | { ok: false; error: string };

const currencySchema = z.object({
  code: z.string().trim().min(2).max(8).toUpperCase(),
  symbol: z.string().trim().min(1).max(8),
  decimals: z.coerce.number().int().min(0).max(4),
  label: z.string().trim().min(1).max(60),
});

function revalidateCurrencyViews() {
  revalidateCurrencies(); // invalidate the cached loader
  revalidatePath("/admin/currencies");
}

export async function createCurrency(input: unknown): Promise<AdminResult> {
  const actorId = await requireRole();
  const parsed = currencySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { code, symbol, decimals, label } = parsed.data;
  const exists = await prisma.currency.findUnique({ where: { code } });
  if (exists) return { ok: false, error: `Currency ${code} already exists` };

  await prisma.currency.create({ data: { code, symbol, decimals, label } });
  await writeAudit(actorId, "CURRENCY_CREATE", "Currency", code, { symbol, decimals, label });
  revalidateCurrencyViews();
  return { ok: true };
}

export async function updateCurrency(input: unknown): Promise<AdminResult> {
  const actorId = await requireRole();
  const parsed = currencySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { code, symbol, decimals, label } = parsed.data;
  const existing = await prisma.currency.findUnique({ where: { code } });
  if (!existing) return { ok: false, error: "Currency not found" };

  // Guard: changing decimals on an in-use currency would skew future toMinor math.
  if (existing.decimals !== decimals) {
    const inUse = await prisma.entry.count({ where: { currency: code } });
    if (inUse > 0) {
      return {
        ok: false,
        error: `Cannot change decimals: ${inUse} ${inUse === 1 ? "entry" : "entries"} already use ${code}.`,
      };
    }
  }

  await prisma.currency.update({ where: { code }, data: { symbol, decimals, label } });
  await writeAudit(actorId, "CURRENCY_UPDATE", "Currency", code, { symbol, decimals, label });
  revalidateCurrencyViews();
  return { ok: true };
}

export async function toggleCurrencyActive(code: string, isActive: boolean): Promise<AdminResult> {
  const actorId = await requireRole();
  const existing = await prisma.currency.findUnique({ where: { code } });
  if (!existing) return { ok: false, error: "Currency not found" };

  await prisma.currency.update({ where: { code }, data: { isActive } });
  await writeAudit(actorId, "CURRENCY_TOGGLE", "Currency", code, { isActive });
  revalidateCurrencyViews();
  return { ok: true };
}
