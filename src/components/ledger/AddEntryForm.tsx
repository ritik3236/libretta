"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createEntry } from "@/server/actions/entries";
import { istInputToUTC } from "@/lib/datetime";
import { getCurrencyMeta } from "@/lib/currency";
import { groupAmountInput, toMinor } from "@/lib/money";
import { usePendingEntries } from "@/components/providers/PendingEntriesProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NumberPad } from "@/components/ledger/NumberPad";
import {
  DirectionChip,
  DateChipField,
  NoteField,
  BankChipField,
} from "@/components/ledger/entry-chips";

type CustomerOpt = { id: string; name: string; currency: string };

export function AddEntryForm({
  customers,
  defaultCustomerId,
  defaultDirection = "CREDIT",
  onDone,
}: {
  customers: CustomerOpt[];
  defaultCustomerId?: string;
  defaultDirection?: "CREDIT" | "DEBIT";
  /** When provided (e.g. inside a sheet), called after a successful save
   *  instead of navigating to the bank page. */
  onDone?: () => void;
}) {
  const router = useRouter();
  const pendingEntries = usePendingEntries();
  const [pending, startTransition] = useTransition();

  const [customerId, setCustomerId] = useState(
    defaultCustomerId ?? customers[0]?.id ?? "",
  );
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">(defaultDirection);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());

  const selected = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );
  const symbol = selected ? getCurrencyMeta(selected.currency)?.symbol ?? "" : "";
  const gave = direction === "CREDIT";

  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">Add a bank first to record an entry.</p>
        <Button asChild className="mt-4">
          <Link href="/banks/new">Add bank</Link>
        </Button>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      customerId,
      direction,
      amount: Number(amount),
      note,
      occurredAt: istInputToUTC(date),
    };

    // Inside a sheet (FAB / sidebar): close instantly and save in the background
    // so the user never waits on the round-trip. Surface an optimistic row on the
    // dashboard list right away (mirroring the bank ledger), then toast + refresh
    // once it resolves — the refresh reconciles the temp row with the real entry.
    if (onDone) {
      const tmpId = `tmp-${crypto.randomUUID()}`;
      if (selected) {
        pendingEntries?.addPending({
          id: tmpId,
          customerId,
          customerName: selected.name,
          direction,
          amount: toMinor(payload.amount, selected.currency),
          currency: selected.currency,
          note: note || null,
          occurredAt: payload.occurredAt,
          status: "PENDING",
        });
      }
      onDone();
      createEntry(payload)
        .then((res) => {
          if (res.ok) {
            toast.success(gave ? "Recorded — you gave" : "Recorded — you got");
            router.refresh();
          } else {
            toast.error(res.error);
            pendingEntries?.removePending(tmpId);
          }
        })
        .catch(() => {
          toast.error("Couldn't save entry — please retry.");
          pendingEntries?.removePending(tmpId);
        });
      // Safety net: drop the optimistic row once the refresh has had time to land
      // (or if the entry is backdated out of the recent window and never matches).
      setTimeout(() => pendingEntries?.removePending(tmpId), 4000);
      return;
    }

    // Full-page route: await the save, then navigate to the bank ledger.
    startTransition(async () => {
      const res = await createEntry(payload);
      if (res.ok) {
        toast.success(gave ? "Recorded — you gave" : "Recorded — you got");
        router.push(`/banks/${customerId}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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

      {/* Bank fills the row; direction + date stay content-sized — one row, no wrap */}
      <div className="flex items-center gap-2">
        <DirectionChip value={direction} onChange={setDirection} className="shrink-0" />
        <BankChipField
          customers={customers}
          value={customerId}
          onChange={setCustomerId}
          className="min-w-0 flex-1"
        />
        <DateChipField value={date} onChange={setDate} max={new Date()} className="shrink-0" />
      </div>
      <NoteField value={note} onChange={setNote} />

      <NumberPad value={amount} onChange={setAmount} />

      <Button
        type="submit"
        size="lg"
        variant={gave ? "default" : "destructive"}
        disabled={pending || !amount}
        className="w-full"
      >
        {pending ? "Saving…" : "Save entry"}
      </Button>
    </form>
  );
}
