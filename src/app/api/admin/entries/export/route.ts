import { requireRole } from "@/server/auth";
import { getAdminEntriesForExport } from "@/server/queries/admin";
import { getCurrencies } from "@/server/queries/currencies";
import { parseFilters, parseSort } from "@/lib/admin-filters";
import { fromMinor } from "@/lib/money";
import { formatISODateIST } from "@/lib/datetime";
import { appConfig } from "@/lib/app-config";

export const runtime = "nodejs";

function field(s: string) {
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  try {
    await requireRole(); // admin-only; throws FORBIDDEN otherwise
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  await getCurrencies(); // hydrate registry for fromMinor

  const { searchParams } = new URL(req.url);
  const sp = Object.fromEntries(searchParams.entries());
  const filters = parseFilters(sp);
  const { sort, order } = parseSort(sp);

  const entries = await getAdminEntriesForExport({ filters, sort, order });

  const header = [
    "Date",
    "User",
    "Bank",
    "Type",
    "Amount",
    "Currency",
    "Status",
    "Version",
    "Note",
  ];
  const lines = entries.map((e) =>
    [
      formatISODateIST(e.occurredAt),
      field(e.user.businessName || e.user.email),
      field(e.customer.name),
      e.direction === "CREDIT" ? "You gave" : "You got",
      fromMinor(Number(e.amountMinor), e.currency).toString(),
      e.currency,
      e.status,
      String(e.version),
      field(e.note ?? ""),
    ].join(","),
  );

  const body = [header.join(","), ...lines].join("\n");
  const filename = `${appConfig.fileSlug}-admin-entries-${formatISODateIST(new Date())}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
