"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AddEntryForm } from "@/components/ledger/AddEntryForm";
import { AddEntryPill } from "@/components/ledger/AddEntryPill";

export type CustomerOpt = { id: string; name: string; currency: string };

/**
 * The canonical "record an entry" control: a grouped two-segment toggle that
 * opens the entry sheet in place — ↗ green "you gave" (CREDIT) and ↘ red "you
 * got" (DEBIT). Shared by the mobile FAB and the desktop sidebar so both stay
 * in lockstep; only the trigger's chrome differs by `variant`.
 */
export function AddEntrySheet({
  customers,
  variant = "fab",
}: {
  customers: CustomerOpt[];
  variant?: "fab" | "rail";
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");

  function openWith(d: "CREDIT" | "DEBIT") {
    setDirection(d);
    setOpen(true);
  }

  return (
    <>
      {variant === "fab" ? (
        <AddEntryPill onGave={() => openWith("CREDIT")} onGot={() => openWith("DEBIT")} />
      ) : (
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border">
          <button
            type="button"
            onClick={() => openWith("CREDIT")}
            aria-label="Add entry — you gave"
            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            <ArrowUpRight className="h-4 w-4" /> You gave
          </button>
          <button
            type="button"
            onClick={() => openWith("DEBIT")}
            aria-label="Add entry — you got"
            className="flex items-center justify-center gap-1.5 border-l border-border py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50"
          >
            <ArrowDownLeft className="h-4 w-4" /> You got
          </button>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle className="sr-only">Add entry</SheetTitle>
          <div className="mt-1">
            {open && (
              <AddEntryForm
                customers={customers}
                defaultDirection={direction}
                onDone={() => setOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
