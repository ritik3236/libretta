import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/server/db";
import { fromMinor } from "@/lib/money";
import { appConfig } from "@/lib/app-config";

export const runtime = "nodejs";

function field(s: string) {
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const entries = await prisma.entry.findMany({
    where: { userId },
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

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${appConfig.fileSlug}-export.csv"`,
    },
  });
}
