import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { formatDateShortIST } from "@/lib/datetime";
import { statusMeta, type EntryStatus } from "@/lib/entry-status";
import { cn } from "@/lib/utils";

/**
 * Homepage "Latest transactions" row. Cross-bank, so the bank name leads; the
 * note sits beneath it. Amount carries direction via color (+green / −red) —
 * no arrow icon. Taps through to the transaction's detail page.
 */
export function TransactionRow({
  tx,
}: {
  tx: {
    id: string;
    customerId: string;
    customerName: string;
    direction: "CREDIT" | "DEBIT";
    amount: number;
    currency: string;
    note: string | null;
    occurredAt: Date;
    status: EntryStatus;
  };
}) {
  const gave = tx.direction === "CREDIT";
  const sm = statusMeta(tx.status);
  return (
    <Link
      href={`/entries/${tx.id}`}
      className="flex items-start justify-between gap-3 border-b border-border/50 py-3 active:bg-muted/40"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-slate-800">{tx.customerName}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", sm.dot)} aria-hidden />
          <span className="min-w-0 truncate">{tx.note || "No note"}</span>
          <span className="shrink-0">· {formatDateShortIST(tx.occurredAt)}</span>
        </div>
      </div>
      <div
        className={cn(
          "shrink-0 text-sm font-extrabold tabular-nums",
          gave ? "text-emerald-600" : "text-red-600",
        )}
      >
        {gave ? "+" : "−"}
        {formatMoney(tx.amount, tx.currency)}
      </div>
    </Link>
  );
}
