import { auth } from "@clerk/nextjs/server";
import { Prisma, Direction } from "@prisma/client";
import { prisma } from "@/server/db";
import { fromMinor } from "@/lib/money";
import { appConfig } from "@/lib/app-config";

export const runtime = "nodejs";

function field(s: string) {
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // CREDIT | DEBIT
  const currency = searchParams.get("currency");
  const customerIds = searchParams.getAll("customerId");
  const from = searchParams.get("from"); // yyyy-MM-dd
  const to = searchParams.get("to"); // yyyy-MM-dd

  const where: Prisma.EntryWhereInput = { userId };
  if (type === "CREDIT") where.direction = Direction.CREDIT;
  else if (type === "DEBIT") where.direction = Direction.DEBIT;
  if (currency) where.currency = currency;
  if (customerIds.length === 1) where.customerId = customerIds[0];
  else if (customerIds.length > 1) where.customerId = { in: customerIds };
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt.gte = new Date(`${from}T00:00:00.000`);
    if (to) where.occurredAt.lte = new Date(`${to}T23:59:59.999`);
  }

  const entries = await prisma.entry.findMany({
    where,
    orderBy: { occurredAt: "asc" },
    include: { customer: true },
  });

  const header = ["Date", "Customer", "Type", "Amount", "Currency", "Note"];
  const lines = entries.map((e) =>
    [
      e.occurredAt.toISOString().slice(0, 10),
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
