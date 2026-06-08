import { PrismaClient, Direction } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds demo data. By default it creates a "demo" user for DB inspection.
 * To see this data inside the app while logged in, set SEED_USER_ID to your
 * Clerk user id (from the Clerk dashboard) before running `npm run db:seed`.
 */
async function main() {
  const userId = process.env.SEED_USER_ID ?? "user_demo_seed";

  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: `${userId}@demo.local`,
      name: "Demo Owner",
      businessName: "Ritik's Store",
      baseCurrency: "INR",
    },
    update: {},
  });

  // clean previous seed rows for idempotency
  await prisma.entry.deleteMany({ where: { userId } });
  await prisma.customer.deleteMany({ where: { userId } });

  const seedData: {
    name: string;
    phone?: string;
    currency: string;
    entries: { direction: Direction; major: number; note?: string; daysAgo: number }[];
  }[] = [
    {
      name: "Amit Sharma",
      phone: "+91 98765 43210",
      currency: "INR",
      entries: [
        { direction: "CREDIT", major: 15000, note: "Goods supplied", daysAgo: 10 },
        { direction: "DEBIT", major: 2500, note: "Part payment", daysAgo: 2 },
      ],
    },
    {
      name: "Priya Kumar",
      phone: "+1 415 555 0199",
      currency: "USD",
      entries: [
        { direction: "DEBIT", major: 320, note: "Advance received", daysAgo: 1 },
      ],
    },
    {
      name: "Ravi Verma",
      currency: "INR",
      entries: [
        { direction: "CREDIT", major: 8900, note: "Monthly supply", daysAgo: 5 },
      ],
    },
  ];

  for (const c of seedData) {
    const decimals = 2;
    const factor = Math.pow(10, decimals);
    let balance = 0n;
    const customer = await prisma.customer.create({
      data: {
        userId,
        name: c.name,
        phone: c.phone ?? null,
        currency: c.currency,
      },
    });
    for (const e of c.entries) {
      const amountMinor = BigInt(Math.round(e.major * factor));
      balance += e.direction === "CREDIT" ? amountMinor : -amountMinor;
      const occurredAt = new Date();
      occurredAt.setDate(occurredAt.getDate() - e.daysAgo);
      await prisma.entry.create({
        data: {
          userId,
          customerId: customer.id,
          direction: e.direction,
          amountMinor,
          currency: c.currency,
          note: e.note ?? null,
          occurredAt,
        },
      });
    }
    await prisma.customer.update({
      where: { id: customer.id },
      data: { balanceMinor: balance },
    });
  }

  console.log(`Seeded demo data for user "${userId}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
