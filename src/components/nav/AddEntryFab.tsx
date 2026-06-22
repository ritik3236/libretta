"use client";

import { usePathname } from "next/navigation";
import { AddEntrySheet, type CustomerOpt } from "@/components/ledger/AddEntrySheet";

/**
 * Mobile floating control to record an entry from list/overview screens —
 * the FAB-positioned wrapper around the shared {@link AddEntrySheet}. Hidden on
 * desktop (the sidebar carries the same control) and on the add-entry screen and
 * a bank's ledger, both of which already have their own entry controls.
 */
export function AddEntryFab({ customers }: { customers: CustomerOpt[] }) {
  const pathname = usePathname();

  // A bank's ledger has its own You gave / You got CTAs, and the add-entry
  // screen is the form itself — hide the FAB on both to avoid duplicate controls.
  const onBankLedger = /^\/banks\/[^/]+$/.test(pathname) && pathname !== "/banks/new";
  if (pathname === "/entries/new" || onBankLedger) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 md:hidden">
      <div className="pointer-events-auto absolute right-5 bottom-[calc(72px+env(safe-area-inset-bottom))]">
        <AddEntrySheet customers={customers} variant="fab" />
      </div>
    </div>
  );
}
