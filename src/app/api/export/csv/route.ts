import { Prisma, Direction, EntryStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { getOptionalUserId } from "@/server/auth";
import { getCurrencies } from "@/server/queries/currencies";
import { fromMinor } from "@/lib/money";
import { istDayStartUTC, istDayEndUTC, formatISODateIST } from "@/lib/datetime";
import { appConfig } from "@/lib/app-config";

export const runtime = "nodejs";

function field(s: string) {
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const userId = await getOptionalUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  await getCurrencies(); // hydrate currency registry for fromMinor

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // CREDIT | DEBIT
  const currency = searchParams.get("currency");
  const customerIds = searchParams.getAll("customerId");
  const from = searchParams.get("from"); // yyyy-MM-dd
  const to = searchParams.get("to"); // yyyy-MM-dd

  // Archived entries are excluded from exports (hidden, like in the app).
  const where: Prisma.EntryWhereInput = { userId, status: { not: EntryStatus.ARCHIVED } };
  if (type === "CREDIT") where.direction = Direction.CREDIT;
  else if (type === "DEBIT") where.direction = Direction.DEBIT;
  if (currency) where.currency = currency;
  if (customerIds.length === 1) where.customerId = customerIds[0];
  else if (customerIds.length > 1) where.customerId = { in: customerIds };
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt.gte = istDayStartUTC(from);
    if (to) where.occurredAt.lte = istDayEndUTC(to);
  }

  const entries = await prisma.entry.findMany({
    where,
    orderBy: { occurredAt: "asc" },
    include: { customer: true },
  });

  const header = ["Date", "Customer", "Type", "Amount", "Currency", "Note"];
  const lines = entries.map((e) =>
    [
      formatISODateIST(e.occurredAt),
      field(e.customer.name),
      e.direction === "CREDIT" ? "You gave" : "You got",
      fromMinor(Number(e.amountMinor), e.currency).toString(),
      e.currency,
      field(e.note ?? ""),
    ].join(","),
  );

  const body = [header.join(","), ...lines].join("\n");

  // reflect the filter in the filename, e.g. libretta-export-credit-inr.csv
  const suffix = [type?.toLowerCase(), currency?.toLowerCase()].filter(Boolean).join("-");
  const filename = `${appConfig.fileSlug}-export${suffix ? `-${suffix}` : ""}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
