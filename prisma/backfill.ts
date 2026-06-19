import { PrismaClient } from "@prisma/client";
import { SEED_CURRENCIES } from "./currencies";

const prisma = new PrismaClient();

/**
 * One-time backfill after the Phase-1 schema change:
 *  1. Insert the 8 currency rows (idempotent).
 *  2. Create a v1 EntryVersion (changeType CREATE, validTo null = live) for
 *     every existing Entry that has no versions yet — so legacy entries have
 *     audit history and the "live version" invariant holds.
 * Safe to run multiple times.
 */
async function main() {
  for (const c of SEED_CURRENCIES) {
    await prisma.currency.upsert({
      where: { code: c.code },
      create: { ...c },
      update: { symbol: c.symbol, decimals: c.decimals, label: c.label },
    });
  }
  console.log(`Currencies upserted: ${SEED_CURRENCIES.length}`);

  const entries = await prisma.entry.findMany({
    where: { versions: { none: {} } },
  });
  console.log(`Entries needing a v1 version: ${entries.length}`);

  for (const e of entries) {
    await prisma.entryVersion.create({
      data: {
        entryId: e.id,
        version: e.version, // typically 1 for legacy rows
        direction: e.direction,
        amountMinor: e.amountMinor,
        currency: e.currency,
        note: e.note,
        occurredAt: e.occurredAt,
        status: e.status,
        changeType: "CREATE",
        changedById: e.userId,
        isAdmin: false,
        validFrom: e.createdAt,
      },
    });
  }
  console.log(`Backfilled ${entries.length} entry versions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
