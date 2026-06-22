"use client";

import * as React from "react";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import {
  Calendar as CalIcon,
  StickyNote,
  User,
  ChevronDown,
  Check,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "./Calendar";
import { getCurrencyMeta } from "@/lib/currency";
import { cn } from "@/lib/utils";

/**
 * Compact pill that opens a popover. Keeps the entry sheet scroll-free: the
 * secondary fields (date/note/bank) live behind chips instead of stacking as
 * full-width inputs. forwardRef so it can be a Radix PopoverTrigger `asChild`.
 */
export const EntryChip = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { icon: React.ReactNode; active?: boolean }
>(function EntryChip({ icon, active, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-medium transition",
        active
          ? "border-transparent bg-muted text-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted/60",
        className,
      )}
      {...props}
    >
      <span className="grid shrink-0 place-items-center">{icon}</span>
      {children}
    </button>
  );
});

/**
 * Direction as a single color-coded chip (no bulky segmented switch). Tap to
 * flip between You gave (green) and You got (red).
 */
export function DirectionChip({
  value,
  onChange,
  className,
}: {
  value: "CREDIT" | "DEBIT";
  onChange: (d: "CREDIT" | "DEBIT") => void;
  className?: string;
}) {
  const gave = value === "CREDIT";
  return (
    <button
      type="button"
      onClick={() => onChange(gave ? "DEBIT" : "CREDIT")}
      aria-label={`${gave ? "Credit" : "Debit"} — tap to switch direction`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold transition",
        gave
          ? "border-emerald-600/25 bg-emerald-50 text-emerald-700"
          : "border-red-600/25 bg-red-50 text-red-700",
        className,
      )}
    >
      {gave ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownLeft className="h-3.5 w-3.5" />
      )}
      {gave ? "Credit" : "Debit"}
    </button>
  );
}

export function DateChipField({
  value,
  onChange,
  max,
  className,
}: {
  value: Date;
  onChange: (d: Date) => void;
  max?: Date;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Label stays compact (date only) so the bank chip keeps its width; the time
  // is set in the popover and shown in full on the list/detail.
  const label = isSameDay(value, new Date()) ? "Today" : format(value, "d MMM");
  const timeValue = `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;

  // The Date's local wall-clock fields are what istInputToUTC reads as IST, so
  // merge day and time by setting those fields (keep the other half intact).
  function pickDay(day: Date) {
    const next = new Date(day);
    next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(next);
  }
  function pickTime(hhmm: string) {
    if (!hhmm) return;
    const [h, m] = hhmm.split(":").map(Number);
    const next = new Date(value);
    next.setHours(h, m, 0, 0);
    onChange(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <EntryChip active icon={<CalIcon className="h-3.5 w-3.5" />} className={className}>
          {label}
        </EntryChip>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar value={value} max={max} onChange={pickDay} />
        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> Time
          </span>
          <input
            type="time"
            value={timeValue}
            onChange={(e) => pickTime(e.target.value)}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
        >
          Done
        </button>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Note stays a visible field (not a chip) — notes matter and shouldn't be
 * hidden behind a popover. Single-line to keep the sheet scroll-free.
 */
export function NoteField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-xl border border-input bg-background px-3 transition focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30",
        className,
      )}
    >
      <StickyNote className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a note"
        className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

type BankOpt = { id: string; name: string; currency: string };

export function BankChipField({
  customers,
  value,
  onChange,
  className,
}: {
  customers: BankOpt[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const sel = customers.find((c) => c.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <EntryChip
          active={!!sel}
          icon={<User className="h-3.5 w-3.5" />}
          className={cn("min-w-0", className)}
        >
          <span className="min-w-0 flex-1 truncate text-left">{sel ? sel.name : "Select bank"}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
        </EntryChip>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-64 w-60 overflow-y-auto p-1">
        {customers.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              onChange(c.id);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
              c.id === value && "bg-muted font-medium",
            )}
          >
            <span className="truncate">{c.name}</span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              {getCurrencyMeta(c.currency)?.code ?? c.currency}
              {c.id === value && <Check className="h-3.5 w-3.5 text-foreground" />}
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
