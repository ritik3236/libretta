import Link from "next/link";
import { Download } from "lucide-react";
import { listAdminEntries, listAdminUsers, PAGE_SIZES } from "@/server/queries/admin";
import { getActiveCurrencies } from "@/server/queries/currencies";
import { parseFilters, parseSort } from "@/lib/admin-filters";
import { AdminEntriesTable } from "@/components/admin/AdminEntriesTable";
import { AdminEntriesFilters } from "@/components/admin/AdminEntriesFilters";

type SP = Record<string, string | string[] | undefined>;

/** Windowed page list: 1 … (cur-1) cur (cur+1) … last. */
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = new Set<number>([1, total, current, current - 1, current + 1]);
  const pages = [...out].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export default async function AdminEntriesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = Number(typeof sp.page === "string" ? sp.page : "") || 1;
  const pageSizeParam = Number(typeof sp.pageSize === "string" ? sp.pageSize : "") || undefined;
  const filters = parseFilters(sp);
  const sort = parseSort(sp);

  const [{ rows, total, pageSize }, users, currencies] = await Promise.all([
    listAdminEntries({
      page,
      pageSize: pageSizeParam,
      filters,
      sort: sort.sort,
      order: sort.order,
    }),
    listAdminUsers(),
    getActiveCurrencies(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Runtime options for the User / Currency dropdown filters.
  const dynamicOptions = {
    user: users.map((u) => ({ value: u.id, label: u.businessName || u.name || u.email })),
    currency: currencies.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` })),
  };

  // Build an href preserving all current params, overriding the given keys.
  const hrefWith = (overrides: Record<string, string | undefined>, dropPage = false) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (v === undefined) continue;
      if (dropPage && (k === "page" || k === "pageSize")) continue;
      if (k in overrides) continue;
      for (const item of Array.isArray(v) ? v : [v]) params.append(k, item);
    }
    for (const [k, v] of Object.entries(overrides)) if (v !== undefined) params.set(k, v);
    const s = params.toString();
    return `/admin/entries${s ? `?${s}` : ""}`;
  };
  const pageHref = (p: number) => hrefWith({ page: String(p) });
  const sizeHref = (n: number) => hrefWith({ pageSize: String(n), page: undefined });
  const exportHref = `/api/admin/entries/export${hrefWith({}, true).replace("/admin/entries", "")}`;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <AdminEntriesFilters initial={filters} initialSort={sort} dynamicOptions={dynamicOptions} />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white px-3 py-6 text-center text-[13px] text-slate-500">
          No entries match these filters.
        </p>
      ) : (
        <AdminEntriesTable rows={rows} />
      )}

      {/* One row: [spacer] · mid (count + rows) · right (export + pagination) */}
      <div className="flex items-center gap-3 text-[12px] text-slate-500">
        <span className="flex-1" />

        {/* mid */}
        <span className="flex items-center gap-3">
          <span>{total === 0 ? "No entries" : `${start}–${end} of ${total}`}</span>
          <span className="flex items-center gap-1">
            {PAGE_SIZES.map((n) => (
              <Link
                key={n}
                href={sizeHref(n)}
                className={
                  n === pageSize
                    ? "rounded bg-slate-900 px-1.5 py-0.5 font-bold text-white"
                    : "rounded px-1.5 py-0.5 font-semibold hover:bg-slate-100"
                }
              >
                {n}
              </Link>
            ))}
          </span>
        </span>

        {/* right: export + pagination */}
        <span className="flex flex-1 items-center justify-end gap-3">
          <Link
            href={exportHref}
            prefetch={false}
            className="flex items-center gap-1.5 font-semibold text-slate-700 hover:underline"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Link>
          {totalPages > 1 && (
            <span className="flex items-center gap-1">
              <PagerLink href={pageHref(page - 1)} disabled={page <= 1}>
                ←
              </PagerLink>
              {pageWindow(page, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="px-1 text-slate-400">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={pageHref(p)}
                    className={
                      p === page
                        ? "min-w-[24px] rounded bg-slate-900 px-1.5 py-0.5 text-center font-bold text-white"
                        : "min-w-[24px] rounded px-1.5 py-0.5 text-center font-semibold hover:bg-slate-100"
                    }
                  >
                    {p}
                  </Link>
                ),
              )}
              <PagerLink href={pageHref(page + 1)} disabled={page >= totalPages}>
                →
              </PagerLink>
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function PagerLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="cursor-not-allowed px-2 py-1 text-slate-300">{children}</span>;
  }
  return (
    <Link href={href} className="rounded px-2 py-1 font-semibold hover:bg-slate-100">
      {children}
    </Link>
  );
}
