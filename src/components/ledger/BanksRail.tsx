"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserPlus, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatAbs } from "@/lib/money";
import { cn, initials } from "@/lib/utils";

type Bank = {
  id: string;
  name: string;
  currency: string;
  balance: number;
  updatedAt: Date;
};

type SortKey = "name" | "balance" | "recent";
type SortDir = "asc" | "desc";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "balance", label: "Balance" },
  { key: "recent", label: "Recent" },
];

// Sensible starting direction per field: A→Z names, biggest balance first,
// newest activity first.
const DEFAULT_DIR: Record<SortKey, SortDir> = { name: "asc", balance: "desc", recent: "desc" };

/**
 * Desktop master list for the two-pane banks view — a compact, searchable rail
 * that highlights the active bank and links to each ledger. The mobile screens
 * keep using {@link BanksList}; this only renders inside the desktop banks layout.
 */
export function BanksRail({
  customers,
  canCreate,
}: {
  customers: Bank[];
  canCreate: boolean;
}) {
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [dir, setDir] = useState<SortDir>("desc");

  function changeSort(key: SortKey) {
    if (key === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(DEFAULT_DIR[key]);
    }
  }

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    const matched = query
      ? customers.filter((c) => c.name.toLowerCase().includes(query))
      : customers;
    const sorted = [...matched].sort((a, b) => {
      const cmp =
        sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "balance"
            ? a.balance - b.balance
            : a.updatedAt.getTime() - b.updatedAt.getTime();
      return dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [customers, q, sort, dir]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold tracking-tight">Banks</h2>
          {canCreate && (
            <Link
              href="/banks/new"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add
            </Link>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search banks"
            className="h-9 pl-9 text-sm"
            autoComplete="off"
          />
        </div>

        <div
          role="group"
          aria-label="Sort banks"
          className="mt-2 flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5"
        >
          {SORTS.map((s) => {
            const active = sort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => changeSort(s.key)}
                aria-pressed={active}
                className={cn(
                  "flex flex-1 items-center justify-center gap-0.5 rounded-md py-1 text-[11px] font-semibold transition",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
                {active &&
                  (dir === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  ))}
              </button>
            );
          })}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {visible.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            {customers.length === 0 ? "No banks yet." : `No match for “${q.trim()}”.`}
          </p>
        ) : (
          visible.map((c) => {
            const active = pathname === `/banks/${c.id}`;
            const settled = c.balance === 0;
            const positive = c.balance >= 0;
            return (
              <Link
                key={c.id}
                href={`/banks/${c.id}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition",
                  active ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {initials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-400">{c.currency}</div>
                </div>
                <div
                  className={cn(
                    "shrink-0 text-xs font-extrabold",
                    settled ? "text-slate-400" : positive ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {formatAbs(c.balance, c.currency)}
                </div>
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
}
