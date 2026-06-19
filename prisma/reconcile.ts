import { PrismaClient, EntryStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Recomputes each customer's balanceMinor from the signed sum of their
 * NON-ARCHIVED entries and reports any drift vs the cached value.
 * Pass `--fix` to write the recomputed values.
 *   CREDIT contributes +amount, DEBIT contributes -amount.
 */
async function main() {
  const fix = process.argv.includes("--fix");
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, balanceMinor: true },
  });

  let drifts = 0;
  for (const c of customers) {
    const grouped = await prisma.entry.groupBy({
      by: ["direction"],
      where: { customerId: c.id, status: { not: EntryStatus.ARCHIVED } },
      _sum: { amountMinor: true },
    });
    let computed = 0n;
    for (const g of grouped) {
      const sum = g._sum.amountMinor ?? 0n;
      computed += g.direction === "CREDIT" ? sum : -sum;
    }
    if (computed !== c.balanceMinor) {
      drifts++;
      console.log(
        `DRIFT ${c.name} (${c.id}): cached=${c.balanceMinor} computed=${computed} diff=${computed - c.balanceMinor}`,
      );
      if (fix) {
        await prisma.customer.update({
          where: { id: c.id },
          data: { balanceMinor: computed },
        });
      }
    }
  }
  console.log(
    drifts === 0
      ? `✓ All ${customers.length} customer balances reconcile (zero drift).`
      : `${drifts} customer(s) had drift${fix ? " — fixed." : " (run with --fix to correct)."}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
