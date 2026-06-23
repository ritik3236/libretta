"use client";

import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { createEntry, loadMoreEntries } from "@/server/actions/entries";
import { istInputToUTC } from "@/lib/datetime";
import { CountUp } from "./CountUp";
import { AddEntryPill } from "./AddEntryPill";
import { EntriesList } from "./EntriesList";
import { NumberPad } from "./NumberPad";
import { DirectionChip, DateChipField, NoteField } from "./entry-chips";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getCurrencyMeta } from "@/lib/currency";
import { toMinor, formatMoney, groupAmountInput } from "@/lib/money";
import { cn } from "@/lib/utils";

type EntryStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
type Entry = {
  id: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  note: string | null;
  occurredAt: Date;
  status: EntryStatus;
};
type Customer = { id: string; name: string; currency: string; balance: number };
type State = { balance: number; totalGave: number; totalGot: number; entries: Entry[] };

const sign = (e: Entry) => (e.direction === "CREDIT" ? e.amount : -e.amount);

// Add-only optimistic reducer. Edits/deletes happen on the entry detail page,
// which revalidates this route on return, so the ledger never edits in place.
function reducer(state: State, entry: Entry): State {
  return {
    balance: state.balance + sign(entry),
    totalGave: state.totalGave + (entry.direction === "CREDIT" ? entry.amount : 0),
    totalGot: state.totalGot + (entry.direction === "DEBIT" ? entry.amount : 0),
    entries: [entry, ...state.entries],
  };
}

export function CustomerLedgerClient({
  customer,
  entries,
  totalGave: serverGave,
  totalGot: serverGot,
  initialCursor,
  initialHasMore,
}: {
  customer: Customer;
  entries: Entry[];
  totalGave: number;
  totalGot: number;
  initialCursor: string | null;
  initialHasMore: boolean;
}) {
  // Base list = server first page + any infinite-scroll pages. Resets whenever
  // the server sends fresh props (navigation, or revalidation after a save).
  const [baseEntries, setBaseEntries] = useState(entries);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, startLoadMore] = useTransition();
  const loadingRef = useRef(false);

  useEffect(() => {
    setBaseEntries(entries);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
  }, [entries, initialCursor, initialHasMore]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore || !cursor) return;
    loadingRef.current = true;
    startLoadMore(async () => {
      try {
        const page = await loadMoreEntries(customer.id, cursor);
        setBaseEntries((prev) => [...prev, ...page.entries]);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } finally {
        loadingRef.current = false;
      }
    });
  }, [hasMore, cursor, customer.id]);

  const [optimistic, addOptimistic] = useOptimistic(
    { balance: customer.balance, totalGave: serverGave, totalGot: serverGot, entries: baseEntries },
    reducer,
  );

  // useOptimistic requires a transition; no `pending` gate so concurrent adds
  // aren't serialized (the sheet closes on submit, preventing double-submit).
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());

  const cur = customer.currency;
  const symbol = getCurrencyMeta(cur)?.symbol ?? "";
  const gave = direction === "CREDIT";
  const positive = optimistic.balance >= 0;
  const settled = optimistic.balance === 0;

  function openAdd(d: "CREDIT" | "DEBIT") {
    setDirection(d);
    setAmount("");
    setNote("");
    setDate(new Date());
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    const when = istInputToUTC(date);
    setOpen(false);

    const tmp: Entry = {
      // Unique per add — Date.now() could collide on rapid concurrent saves.
      id: `tmp-${crypto.randomUUID()}`,
      direction,
      amount: toMinor(amt, cur),
      currency: cur,
      note: note || null,
      occurredAt: when,
      status: "PENDING",
    };
    startTransition(async () => {
      addOptimistic(tmp);
      const res = await createEntry({ customerId: customer.id, direction, amount: amt, note, occurredAt: when });
      if (res.ok) toast.success(gave ? "Recorded — you gave" : "Recorded — you got");
      else toast.error(res.error);
    });
  }

  return (
    <>
      {/* Balance + totals in one card (optimistic, server-aggregated) */}
      <section
        className={`rounded-2xl p-3.5 text-white ${
          settled ? "bg-slate-700" : positive ? "bg-emerald-600" : "bg-red-600"
        }`}
      >
        <p className="text-[11px] font-semibold opacity-80">
          {settled ? "All settled" : positive ? "You'll get" : "You'll give"}
        </p>
        <CountUp
          minor={Math.abs(optimistic.balance)}
          currency={cur}
          className="mt-0.5 block font-extrabold tracking-tight"
          baseSize={24}
          minSize={15}
        />
        <div className="mt-2.5 grid grid-cols-2 border-t border-white/20 pt-2.5">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">
              <ArrowUpRight className="h-3 w-3" /> Total you gave
            </div>
            <div className="mt-0.5 text-[13px] font-extrabold">{formatMoney(optimistic.totalGave, cur)}</div>
          </div>
          <div className="border-l border-white/20 pl-3">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">
              <ArrowDownLeft className="h-3 w-3" /> Total you got
            </div>
            <div className="mt-0.5 text-[13px] font-extrabold">{formatMoney(optimistic.totalGot, cur)}</div>
          </div>
        </div>
      </section>

      {/* Entries (virtualized) */}
      <section className="mt-5">
        <h2 className="mb-1 text-sm font-bold">Entries</h2>
        {optimistic.entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">No entries yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use <span className="font-semibold text-emerald-600">You gave</span> or{" "}
              <span className="font-semibold text-red-600">You got</span> below to add the first one.
            </p>
          </div>
        ) : (
          <EntriesList
            entries={optimistic.entries}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        )}
      </section>

      {/* Same floating ↗/↘ pill as the dashboard FAB, pre-scoped to this bank.
          Floats above the bottom nav on mobile, bottom-right of the pane on desktop. */}
      <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 md:left-auto md:right-0 md:max-w-none md:translate-x-0">
        <div className="pointer-events-auto absolute right-5 bottom-[calc(72px+env(safe-area-inset-bottom))] md:right-8 md:bottom-8">
          <AddEntryPill onGave={() => openAdd("CREDIT")} onGot={() => openAdd("DEBIT")} />
        </div>
      </div>

      {/* Add sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle className="sr-only">New entry</SheetTitle>

          <form onSubmit={submit} className="mt-2 space-y-3">
            {/* Amount */}
            <div className="py-1 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-muted-foreground">{symbol}</span>
                <span
                  className={cn(
                    "text-[40px] font-extrabold leading-none tracking-tight",
                    !amount && "text-muted-foreground/40",
                  )}
                >
                  {groupAmountInput(amount)}
                </span>
              </div>
            </div>

            {/* Direction + date as equal-width chips; note is a visible field */}
            <div className="flex items-center gap-2">
              <DirectionChip value={direction} onChange={setDirection} className="flex-1 justify-center" />
              <DateChipField value={date} onChange={setDate} max={new Date()} className="flex-1 justify-center" />
            </div>
            <NoteField value={note} onChange={setNote} />

            <NumberPad value={amount} onChange={setAmount} />

            <Button
              type="submit"
              size="lg"
              variant={gave ? "default" : "destructive"}
              disabled={!amount}
              className="w-full"
            >
              Save entry
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
