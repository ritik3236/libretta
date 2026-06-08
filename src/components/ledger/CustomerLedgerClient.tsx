"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { createEntry } from "@/server/actions/entries";
import { CountUp } from "./CountUp";
import { EntryItem } from "./EntryItem";
import { DatePicker } from "./DatePicker";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES } from "@/lib/currency";
import { toMinor, formatMoney } from "@/lib/money";

type Entry = {
  id: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  note: string | null;
  occurredAt: Date;
};
type Customer = { id: string; name: string; currency: string; balance: number };

export function CustomerLedgerClient({
  customer,
  entries,
}: {
  customer: Customer;
  entries: Entry[];
}) {
  // Optimistic state: balance + entries update instantly, then reconcile
  // with the server data once createEntry + revalidatePath complete.
  const [optimistic, addOptimistic] = useOptimistic(
    { balance: customer.balance, entries },
    (state, action: { entry: Entry; delta: number }) => ({
      balance: state.balance + action.delta,
      entries: [action.entry, ...state.entries],
    }),
  );

  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());

  const positive = optimistic.balance >= 0;
  const settled = optimistic.balance === 0;
  const symbol = CURRENCIES[customer.currency]?.symbol ?? "";
  const gave = direction === "CREDIT";

  const totalGave = optimistic.entries.reduce(
    (s, e) => (e.direction === "CREDIT" ? s + e.amount : s),
    0,
  );
  const totalGot = optimistic.entries.reduce(
    (s, e) => (e.direction === "DEBIT" ? s + e.amount : s),
    0,
  );

  function openSheet(d: "CREDIT" | "DEBIT") {
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

    const amountMinor = toMinor(amt, customer.currency);
    const delta = direction === "CREDIT" ? amountMinor : -amountMinor;
    const tmp: Entry = {
      id: `tmp-${Date.now()}`,
      direction,
      amount: amountMinor,
      currency: customer.currency,
      note: note || null,
      occurredAt: date,
    };

    setOpen(false);
    startTransition(async () => {
      addOptimistic({ entry: tmp, delta });
      const res = await createEntry({
        customerId: customer.id,
        direction,
        amount: amt,
        note,
        occurredAt: date,
      });
      if (res.ok) toast.success(gave ? "Recorded — you gave" : "Recorded — you got");
      else toast.error(res.error);
    });
  }

  return (
    <>
      {/* Balance + totals in one card (optimistic) */}
      <section
        className={`rounded-3xl p-5 text-white ${
          settled ? "bg-slate-700" : positive ? "bg-emerald-600" : "bg-red-600"
        }`}
      >
        <p className="text-xs font-semibold opacity-80">
          {settled ? "All settled" : positive ? "You'll get" : "You'll give"}
        </p>
        <CountUp
          minor={Math.abs(optimistic.balance)}
          currency={customer.currency}
          className="mt-1 block font-extrabold tracking-tight"
          baseSize={30}
          minSize={16}
        />

        <div className="mt-4 grid grid-cols-2 border-t border-white/20 pt-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
              <ArrowUpRight className="h-3.5 w-3.5" /> Total you gave
            </div>
            <div className="mt-0.5 text-sm font-extrabold">
              {formatMoney(totalGave, customer.currency)}
            </div>
          </div>
          <div className="border-l border-white/20 pl-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
              <ArrowDownLeft className="h-3.5 w-3.5" /> Total you got
            </div>
            <div className="mt-0.5 text-sm font-extrabold">
              {formatMoney(totalGot, customer.currency)}
            </div>
          </div>
        </div>
      </section>

      {/* Entries (optimistic) */}
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
          <div className="divide-y divide-border/60">
            {optimistic.entries.map((en) => (
              <EntryItem key={en.id} entry={en} />
            ))}
          </div>
        )}
      </section>

      {/* Thumb-zone dual CTA → opens the inline add sheet */}
      <div className="fixed bottom-[84px] left-1/2 z-20 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-2 gap-3 px-5">
        <button
          onClick={() => openSheet("DEBIT")}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/30 active:scale-[.98]"
        >
          <ArrowDownLeft className="h-4 w-4" /> You got
        </button>
        <button
          onClick={() => openSheet("CREDIT")}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 active:scale-[.98]"
        >
          <ArrowUpRight className="h-4 w-4" /> You gave
        </button>
      </div>

      {/* Add-entry bottom sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle className={gave ? "text-emerald-600" : "text-red-600"}>
            {gave ? "You gave" : "You got"}
          </SheetTitle>
          <form onSubmit={submit} className="mt-3 space-y-4">
            <div className="rounded-2xl border bg-muted/40 px-4 py-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-muted-foreground">{symbol}</span>
                <input
                  autoFocus
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  inputMode="decimal"
                  placeholder="0"
                  className="w-44 bg-transparent text-center text-4xl font-extrabold tracking-tight outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <DatePicker value={date} onChange={setDate} max={new Date()} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Note</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="optional"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant={gave ? "default" : "destructive"}
              disabled={pending || !amount}
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
