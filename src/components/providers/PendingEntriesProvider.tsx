"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type PendingTx = {
  id: string;
  customerId: string;
  customerName: string;
  direction: "CREDIT" | "DEBIT";
  amount: number; // positive minor units
  currency: string;
  note: string | null;
  occurredAt: Date;
  status: "PENDING";
};

type Ctx = {
  pending: PendingTx[];
  addPending: (e: PendingTx) => void;
  removePending: (id: string) => void;
};

const PendingEntriesContext = createContext<Ctx | null>(null);

/**
 * Bridges the *global* add-entry sheet (in the FAB / sidebar) to the dashboard's
 * "Latest transactions" list. Because those live in different parts of the tree,
 * the form can't drive the list's optimistic state directly the way the bank
 * ledger does — so it stashes a temp row here, the list surfaces it instantly,
 * and a `router.refresh()` reconciles it with the real saved entry.
 */
export function PendingEntriesProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingTx[]>([]);

  const addPending = useCallback((e: PendingTx) => setPending((p) => [e, ...p]), []);
  const removePending = useCallback(
    (id: string) => setPending((p) => p.filter((x) => x.id !== id)),
    [],
  );

  return (
    <PendingEntriesContext.Provider value={{ pending, addPending, removePending }}>
      {children}
    </PendingEntriesContext.Provider>
  );
}

/** Null when used outside the provider (e.g. the full-page entry form). */
export function usePendingEntries() {
  return useContext(PendingEntriesContext);
}
