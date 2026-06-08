import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { format } from "date-fns";

export function TransactionRow({
  tx,
}: {
  tx: {
    customerId: string;
    customerName: string;
    direction: "CREDIT" | "DEBIT";
    amount: number;
    currency: string;
    note: string | null;
    occurredAt: Date;
  };
}) {
  const gave = tx.direction === "CREDIT";
  return (
    <Link
      href={`/parties/${tx.customerId}`}
      className="flex items-center gap-3 border-b border-border/50 py-3 active:bg-muted/40"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          gave ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        }`}
      >
        {gave ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{tx.customerName}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {tx.note || (gave ? "You gave" : "You got")} · {format(tx.occurredAt, "d MMM")}
        </div>
      </div>
      <div
        className={`ml-auto shrink-0 text-sm font-extrabold ${
          gave ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {gave ? "+" : "−"}
        {formatMoney(tx.amount, tx.currency)}
      </div>
    </Link>
  );
}
