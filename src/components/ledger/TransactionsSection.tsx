"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { startOfDay, endOfDay, format } from "date-fns";
import { Filter, Download, Check, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DatePicker } from "./DatePicker";
import { TransactionRow } from "./TransactionRow";
import { cn } from "@/lib/utils";

type Tx = {
  id: string;
  customerId: string;
  customerName: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  note: string | null;
  occurredAt: Date;
};

type TypeFilter = "ALL" | "CREDIT" | "DEBIT";

const TYPES: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CREDIT", label: "You gave" },
  { value: "DEBIT", label: "You got" },
];

export function TransactionsSection({
  entries,
  currencies,
  customers,
}: {
  entries: Tx[];
  currencies: string[];
  customers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TypeFilter>("ALL");
  const [currency, setCurrency] = useState<string>("ALL");
  const [customerIds, setCustomerIds] = useState<string[]>([]);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [partyOpen, setPartyOpen] = useState(false);

  const filtered = useMemo(() => {
    const fromTs = from ? startOfDay(from).getTime() : null;
    const toTs = to ? endOfDay(to).getTime() : null;
    return entries.filter((e) => {
      if (type !== "ALL" && e.direction !== type) return false;
      if (currency !== "ALL" && e.currency !== currency) return false;
      if (customerIds.length > 0 && !customerIds.includes(e.customerId)) return false;
      const ts = e.occurredAt.getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });
  }, [entries, type, currency, customerIds, from, to]);

  const activeCount =
    (type !== "ALL" ? 1 : 0) +
    (currency !== "ALL" ? 1 : 0) +
    (customerIds.length > 0 ? 1 : 0) +
    (from || to ? 1 : 0);

  const exportHref = useMemo(() => {
    const p = new URLSearchParams();
    if (type !== "ALL") p.set("type", type);
    if (currency !== "ALL") p.set("currency", currency);
    customerIds.forEach((id) => p.append("customerId", id));
    if (from) p.set("from", format(from, "yyyy-MM-dd"));
    if (to) p.set("to", format(to, "yyyy-MM-dd"));
    const qs = p.toString();
    return `/api/export/csv${qs ? `?${qs}` : ""}`;
  }, [type, currency, customerIds, from, to]);

  function toggleParty(id: string) {
    setCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function reset() {
    setType("ALL");
    setCurrency("ALL");
    setCustomerIds([]);
    setFrom(null);
    setTo(null);
  }

  return (
    <section className="mt-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-bold">Latest transactions</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setOpen(true)}
            aria-label="Filter transactions"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border text-foreground/70 transition active:scale-95"
          >
            <Filter className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>
          <a
            href={exportHref}
            aria-label="Export CSV"
            className="flex h-9 w-9 items-center justify-center rounded-xl border text-foreground/70 transition active:scale-95"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {entries.length === 0
              ? "No transactions yet"
              : "No transactions match your filter"}
          </p>
          {entries.length === 0 ? (
            <Link
              href="/parties"
              className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Add your first entry
            </Link>
          ) : (
            <button onClick={reset} className="mt-2 text-xs font-semibold text-primary">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div>
          {filtered.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}

      {/* Filter sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle>Filter transactions</SheetTitle>
          <div className="mt-4 space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Type</p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-lg text-sm font-semibold transition",
                      type === t.value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {currencies.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Currency</p>
                <div className="flex flex-wrap gap-2">
                  {["ALL", ...currencies].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={cn(
                        "flex h-9 items-center rounded-lg border px-4 text-sm font-semibold transition",
                        currency === c
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input text-muted-foreground",
                      )}
                    >
                      {c === "ALL" ? "All" : c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {customers.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Parties</p>
                <button
                  type="button"
                  onClick={() => setPartyOpen((o) => !o)}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                >
                  <span className={cn("truncate", customerIds.length === 0 && "text-muted-foreground")}>
                    {customerIds.length === 0
                      ? "All parties"
                      : customerIds.length === 1
                        ? customers.find((c) => c.id === customerIds[0])?.name ?? "1 party"
                        : `${customerIds.length} parties`}
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 opacity-50 transition", partyOpen && "rotate-180")}
                  />
                </button>

                {partyOpen && (
                  <div className="mt-1.5 max-h-56 overflow-y-auto overscroll-contain rounded-xl border bg-popover p-1">
                    {customerIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCustomerIds([])}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-accent"
                      >
                        Clear selection
                      </button>
                    )}
                    {customers.map((c) => {
                      const on = customerIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleParty(c.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        >
                          <span className={cn("truncate", on && "font-semibold")}>{c.name}</span>
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input",
                            )}
                          >
                            {on && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">Date range</p>
                {(from || to) && (
                  <button
                    onClick={() => {
                      setFrom(null);
                      setTo(null);
                    }}
                    className="text-xs font-semibold text-primary"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <DatePicker
                  value={from}
                  onChange={setFrom}
                  max={to ?? new Date()}
                  placeholder="From"
                  className="h-11 text-sm"
                />
                <DatePicker
                  value={to}
                  onChange={setTo}
                  max={new Date()}
                  placeholder="To"
                  className="h-11 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Reset
              </Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>
                Show {filtered.length}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
