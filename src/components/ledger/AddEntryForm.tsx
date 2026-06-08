"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { createEntry } from "@/server/actions/entries";
import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ledger/DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CustomerOpt = { id: string; name: string; currency: string };

export function AddEntryForm({
  customers,
  defaultCustomerId,
  defaultDirection = "CREDIT",
}: {
  customers: CustomerOpt[];
  defaultCustomerId?: string;
  defaultDirection?: "CREDIT" | "DEBIT";
}) {
  const router = useRouter();
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
  const symbol = selected ? CURRENCIES[selected.currency]?.symbol ?? "" : "";
  const gave = direction === "CREDIT";

  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">Add a customer first to record an entry.</p>
        <Button asChild className="mt-4">
          <Link href="/parties/new">Add customer</Link>
        </Button>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createEntry({
        customerId,
        direction,
        amount: Number(amount),
        note,
        occurredAt: date,
      });
      if (res.ok) {
        toast.success(gave ? "Recorded — you gave" : "Recorded — you got");
        router.push(`/parties/${customerId}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
        <button
          type="button"
          onClick={() => setDirection("CREDIT")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition",
            gave ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          <ArrowUpRight className="h-4 w-4" /> You gave
        </button>
        <button
          type="button"
          onClick={() => setDirection("DEBIT")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition",
            !gave ? "bg-card text-destructive shadow-sm" : "text-muted-foreground",
          )}
        >
          <ArrowDownLeft className="h-4 w-4" /> You got
        </button>
      </div>

      {/* Amount */}
      <div className="rounded-2xl border bg-muted/40 px-4 py-5 text-center">
        <div className="text-xs font-semibold text-muted-foreground">Amount</div>
        <div className="mt-1 flex items-center justify-center gap-1">
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

      {/* Customer */}
      <div className="space-y-1.5">
        <Label>Customer</Label>
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({CURRENCIES[c.currency]?.code ?? c.currency})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        {pending ? "Saving…" : "Save entry"}
      </Button>
    </form>
  );
}
