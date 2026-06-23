import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

/**
 * The canonical add-entry trigger: a joined two-segment pill — ↗ green "you gave"
 * (CREDIT) and ↘ red "you got" (DEBIT). Shared by the dashboard FAB, the desktop
 * sidebar, and the bank ledger so every "record an entry" affordance is identical.
 */
export function AddEntryPill({
  onGave,
  onGot,
}: {
  onGave: () => void;
  onGot: () => void;
}) {
  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-black/5">
      <button
        type="button"
        onClick={onGave}
        aria-label="Add entry — you gave"
        className="flex h-11 w-12 items-center justify-center text-emerald-600 transition active:bg-emerald-50"
      >
        <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <span aria-hidden className="w-px self-stretch bg-border" />
      <button
        type="button"
        onClick={onGot}
        aria-label="Add entry — you got"
        className="flex h-11 w-12 items-center justify-center text-red-600 transition active:bg-red-50"
      >
        <ArrowDownLeft className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
