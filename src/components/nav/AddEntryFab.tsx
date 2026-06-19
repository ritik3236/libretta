"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AddEntryForm } from "@/components/ledger/AddEntryForm";

type CustomerOpt = { id: string; name: string; currency: string };

/**
 * Compact grouped control to record an entry from list/overview screens.
 * One joined pill with two icon-only segments mirroring the entry form's
 * direction toggle — ↗ green "you gave" (CREDIT) and ↘ red "you got" (DEBIT).
 * Tapping a segment opens the entry sheet IN PLACE (no navigation). Hidden on
 * the add-entry screen and on a party's ledger (both already have their own
 * entry controls).
 */
export function AddEntryFab({ customers }: { customers: CustomerOpt[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");

  // A party's ledger has its own You gave / You got CTAs, and the add-entry
  // screen is the form itself — hide the global FAB on both to avoid duplicate
  // controls. It stays on the dashboard, parties list, reports, etc.
  const onPartyLedger = /^\/parties\/[^/]+$/.test(pathname) && pathname !== "/parties/new";
  if (pathname === "/entries/new" || onPartyLedger) return null;

  function openWith(d: "CREDIT" | "DEBIT") {
    setDirection(d);
    setOpen(true);
  }

  return (
    <>
      <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2">
        <div className="pointer-events-auto absolute right-5 bottom-[calc(72px+env(safe-area-inset-bottom))] inline-flex items-stretch overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-black/5">
          <button
            type="button"
            onClick={() => openWith("CREDIT")}
            aria-label="Add entry — you gave"
            className="flex h-11 w-12 items-center justify-center text-emerald-600 transition active:bg-emerald-50"
          >
            <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <span aria-hidden className="w-px self-stretch bg-border" />
          <button
            type="button"
            onClick={() => openWith("DEBIT")}
            aria-label="Add entry — you got"
            className="flex h-11 w-12 items-center justify-center text-red-600 transition active:bg-red-50"
          >
            <ArrowDownLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle className={direction === "CREDIT" ? "text-emerald-600" : "text-red-600"}>
            {direction === "CREDIT" ? "You gave" : "You got"}
          </SheetTitle>
          <div className="mt-4">
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
