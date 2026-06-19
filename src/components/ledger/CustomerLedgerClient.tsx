"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowUpRight, ArrowDownLeft, Trash2 } from "lucide-react";
import { createEntry, updateEntry, deleteEntry } from "@/server/actions/entries";
import { istInputToUTC } from "@/lib/datetime";
import { CountUp } from "./CountUp";
import { EntriesList } from "./EntriesList";
import { DatePicker } from "./DatePicker";
import { NumberPad } from "./NumberPad";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrencyMeta } from "@/lib/currency";
import { toMinor, fromMinor, formatMoney } from "@/lib/money";
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
type Action =
  | { kind: "add"; entry: Entry }
  | { kind: "edit"; prev: Entry; next: Entry }
  | { kind: "delete"; entry: Entry };

const sign = (e: Entry) => (e.direction === "CREDIT" ? e.amount : -e.amount);

function reducer(state: State, action: Action): State {
  switch (action.kind) {
    case "add": {
      const e = action.entry;
      return {
        balance: state.balance + sign(e),
        totalGave: state.totalGave + (e.direction === "CREDIT" ? e.amount : 0),
        totalGot: state.totalGot + (e.direction === "DEBIT" ? e.amount : 0),
        entries: [e, ...state.entries],
      };
    }
    case "delete": {
      const e = action.entry;
      return {
        balance: state.balance - sign(e),
        totalGave: state.totalGave - (e.direction === "CREDIT" ? e.amount : 0),
        totalGot: state.totalGot - (e.direction === "DEBIT" ? e.amount : 0),
        entries: state.entries.filter((x) => x.id !== e.id),
      };
    }
    case "edit": {
      const { prev, next } = action;
      return {
        balance: state.balance - sign(prev) + sign(next),
        totalGave:
          state.totalGave -
          (prev.direction === "CREDIT" ? prev.amount : 0) +
          (next.direction === "CREDIT" ? next.amount : 0),
        totalGot:
          state.totalGot -
          (prev.direction === "DEBIT" ? prev.amount : 0) +
          (next.direction === "DEBIT" ? next.amount : 0),
        entries: state.entries.map((x) => (x.id === prev.id ? next : x)),
      };
    }
  }
}

export function CustomerLedgerClient({
  customer,
  entries,
  totalGave: serverGave,
  totalGot: serverGot,
}: {
  customer: Customer;
  entries: Entry[];
  totalGave: number;
  totalGot: number;
}) {
  const [optimistic, applyOptimistic] = useOptimistic(
    { balance: customer.balance, totalGave: serverGave, totalGot: serverGot, entries },
    reducer,
  );

  // No `pending` flag on the Save button: the sheet closes on submit and
  // useOptimistic queues concurrent in-flight adds, so saves needn't be
  // serialized — blocking the next one until the current finishes was the bug.
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cur = customer.currency;
  const symbol = getCurrencyMeta(cur)?.symbol ?? "";
  const gave = direction === "CREDIT";
  const positive = optimistic.balance >= 0;
  const settled = optimistic.balance === 0;

  function openAdd(d: "CREDIT" | "DEBIT") {
    setMode("add");
    setEditingId(null);
    setDirection(d);
    setAmount("");
    setNote("");
    setDate(new Date());
    setConfirmDelete(false);
    setOpen(true);
  }

  function openEdit(e: Entry) {
    // Locked after review: only PENDING entries are editable by the user.
    if (e.status !== "PENDING") {
      toast.info("This entry was reviewed and can no longer be edited.");
      return;
    }
    setMode("edit");
    setEditingId(e.id);
    setDirection(e.direction);
    setAmount(String(fromMinor(e.amount, cur)));
    setNote(e.note ?? "");
    setDate(e.occurredAt);
    setConfirmDelete(false);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    const amountMinor = toMinor(amt, cur);
    setOpen(false);

    if (mode === "add") {
      const tmp: Entry = {
        // Unique per add — Date.now() could collide on rapid concurrent saves,
        // and the edit/delete reducers match optimistic rows by id.
        id: `tmp-${crypto.randomUUID()}`,
        direction,
        amount: amountMinor,
        currency: cur,
        note: note || null,
        occurredAt: istInputToUTC(date),
        status: "PENDING",
      };
      startTransition(async () => {
        applyOptimistic({ kind: "add", entry: tmp });
        const res = await createEntry({ customerId: customer.id, direction, amount: amt, note, occurredAt: istInputToUTC(date) });
        if (res.ok) toast.success(gave ? "Recorded — you gave" : "Recorded — you got");
        else toast.error(res.error);
      });
    } else if (editingId) {
      const prev = optimistic.entries.find((x) => x.id === editingId);
      if (!prev) return;
      const next: Entry = { ...prev, direction, amount: amountMinor, note: note || null, occurredAt: istInputToUTC(date) };
      startTransition(async () => {
        applyOptimistic({ kind: "edit", prev, next });
        const res = await updateEntry({ id: editingId, direction, amount: amt, note, occurredAt: istInputToUTC(date) });
        if (res.ok) toast.success("Entry updated");
        else toast.error(res.error);
      });
    }
  }

  function onDelete() {
    if (!editingId) return;
    const prev = optimistic.entries.find((x) => x.id === editingId);
    if (!prev) return;
    setOpen(false);
    startTransition(async () => {
      applyOptimistic({ kind: "delete", entry: prev });
      const res = await deleteEntry(editingId);
      if (res.ok) toast.success("Entry deleted");
      else toast.error(res.error);
    });
  }

  return (
    <>
      {/* Balance + totals in one card (optimistic, server-aggregated) */}
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
          currency={cur}
          className="mt-1 block font-extrabold tracking-tight"
          baseSize={30}
          minSize={16}
        />
        <div className="mt-4 grid grid-cols-2 border-t border-white/20 pt-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
              <ArrowUpRight className="h-3.5 w-3.5" /> Total you gave
            </div>
            <div className="mt-0.5 text-sm font-extrabold">{formatMoney(optimistic.totalGave, cur)}</div>
          </div>
          <div className="border-l border-white/20 pl-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
              <ArrowDownLeft className="h-3.5 w-3.5" /> Total you got
            </div>
            <div className="mt-0.5 text-sm font-extrabold">{formatMoney(optimistic.totalGot, cur)}</div>
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
          <EntriesList entries={optimistic.entries} onSelect={openEdit} />
        )}
      </section>

      {/* Thumb-zone dual CTA */}
      <div className="fixed bottom-[84px] left-1/2 z-20 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-2 gap-3 px-5">
        <button
          onClick={() => openAdd("DEBIT")}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/30 active:scale-[.98]"
        >
          <ArrowDownLeft className="h-4 w-4" /> You got
        </button>
        <button
          onClick={() => openAdd("CREDIT")}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 active:scale-[.98]"
        >
          <ArrowUpRight className="h-4 w-4" /> You gave
        </button>
      </div>

      {/* Add / Edit sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle className={gave ? "text-emerald-600" : "text-red-600"}>
            {mode === "edit" ? "Edit entry" : gave ? "You gave" : "You got"}
          </SheetTitle>

          <form onSubmit={submit} className="mt-2 space-y-3">
            {/* Direction toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setDirection("CREDIT")}
                className={cn(
                  "flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition",
                  gave ? "bg-card text-emerald-600 shadow-sm" : "text-muted-foreground",
                )}
              >
                <ArrowUpRight className="h-4 w-4" /> You gave
              </button>
              <button
                type="button"
                onClick={() => setDirection("DEBIT")}
                className={cn(
                  "flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition",
                  !gave ? "bg-card text-red-600 shadow-sm" : "text-muted-foreground",
                )}
              >
                <ArrowDownLeft className="h-4 w-4" /> You got
              </button>
            </div>

            <div className="rounded-2xl border bg-muted/40 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-muted-foreground">{symbol}</span>
                <span className={cn("text-4xl font-extrabold tracking-tight", !amount && "text-muted-foreground/40")}>
                  {amount || "0"}
                </span>
              </div>
            </div>

            <NumberPad value={amount} onChange={setAmount} />

            <div className="space-y-1.5">
              <Label>Date</Label>
              <DatePicker value={date} onChange={setDate} max={new Date()} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
            </div>

            <Button
              type="submit"
              size="lg"
              variant={gave ? "default" : "destructive"}
              disabled={!amount}
              className="w-full"
            >
              {mode === "edit" ? "Save changes" : "Save entry"}
            </Button>

            {mode === "edit" && (
              <button
                type="button"
                onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition",
                  confirmDelete ? "bg-destructive/10 text-destructive" : "text-muted-foreground",
                )}
              >
                <Trash2 className="h-4 w-4" />
                {confirmDelete ? "Tap again to delete" : "Delete entry"}
              </button>
            )}
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
