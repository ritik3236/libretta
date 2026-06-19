import "server-only";
import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/server/db";
import { hydrateCurrencies, type CurrencyMeta } from "@/lib/currency";

const CURRENCIES_TAG = "currencies";

// Cross-request cache; invalidated by admin currency mutations via revalidateTag.
const loadCurrencies = unstable_cache(
  async (): Promise<CurrencyMeta[]> => {
    const rows = await prisma.currency.findMany({ orderBy: { code: "asc" } });
    return rows.map((r) => ({
      code: r.code,
      symbol: r.symbol,
      decimals: r.decimals,
      label: r.label,
      isActive: r.isActive,
    }));
  },
  ["currencies-all"],
  { tags: [CURRENCIES_TAG] },
);

/**
 * Loads all currencies AND hydrates the in-memory registry as a side effect, so
 * any synchronous money.ts call later in the same server render/action sees the
 * correct decimals/symbols. `cache()` dedupes within a single request.
 */
export const getCurrencies = cache(async (): Promise<CurrencyMeta[]> => {
  const list = await loadCurrencies();
  hydrateCurrencies(list);
  return list;
});

/** Active currencies only — for user-facing pickers. */
export async function getActiveCurrencies(): Promise<CurrencyMeta[]> {
  return (await getCurrencies()).filter((c) => c.isActive);
}

export async function isSupportedCurrencyDB(code: string): Promise<boolean> {
  return (await getCurrencies()).some((c) => c.code === code);
}

export async function isActiveCurrencyDB(code: string): Promise<boolean> {
  return (await getCurrencies()).some((c) => c.code === code && c.isActive);
}

/** Call after any admin currency mutation. */
export function revalidateCurrencies(): void {
  revalidateTag(CURRENCIES_TAG);
}
