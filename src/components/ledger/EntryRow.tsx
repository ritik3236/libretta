import { formatMoney } from "@/lib/money";
import { formatDateTimeShortIST } from "@/lib/datetime";
import { statusMeta, type EntryStatus } from "@/lib/entry-status";
import { cn } from "@/lib/utils";

/**
 * List row — the note is the headline (wraps to 2 lines, never hard-trimmed);
 * the amount carries direction via color (+green / −red), so no arrow icon.
 */
export function EntryRow({
  entry,
}: {
  entry: {
    direction: "CREDIT" | "DEBIT";
    amount: number;
    currency: string;
    note: string | null;
    occurredAt: Date;
    status: EntryStatus;
  };
}) {
  const gave = entry.direction === "CREDIT"; // you gave → you'll get
  const sm = statusMeta(entry.status);

  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <div
          className={cn(
            "line-clamp-2 text-sm leading-snug",
            entry.note ? "font-medium text-slate-800" : "text-slate-400",
          )}
        >
          {entry.note || "No note"}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>{formatDateTimeShortIST(entry.occurredAt)}</span>
          <span className={cn("h-1.5 w-1.5 rounded-full", sm.dot)} aria-hidden />
          <span>{sm.label}</span>
        </div>
      </div>
      <div
        className={cn(
          "shrink-0 text-sm font-extrabold tabular-nums",
          gave ? "text-emerald-600" : "text-red-600",
        )}
      >
        {gave ? "+" : "−"}
        {formatMoney(entry.amount, entry.currency)}
      </div>
    </div>
  );
}
