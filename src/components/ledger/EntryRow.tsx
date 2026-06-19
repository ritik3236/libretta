import { formatMoney } from "@/lib/money";
import { formatDateIST } from "@/lib/datetime";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export function EntryRow({
  entry,
}: {
  entry: {
    direction: "CREDIT" | "DEBIT";
    amount: number;
    currency: string;
    note: string | null;
    occurredAt: Date;
    status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
  };
}) {
  const gave = entry.direction === "CREDIT"; // you gave → you'll get
  // Pending entries are unobtrusive; reviewed ones carry a small badge.
  const badge =
    entry.status === "APPROVED"
      ? { label: "Approved", cls: "bg-emerald-50 text-emerald-600" }
      : entry.status === "REJECTED"
        ? { label: "Rejected", cls: "bg-red-50 text-red-600" }
        : null;

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          gave ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        }`}
      >
        {gave ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
          {entry.note || (gave ? "You gave" : "You got")}
          {badge && (
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${badge.cls}`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          {formatDateIST(entry.occurredAt)}
        </div>
      </div>
      <div
        className={`ml-auto text-sm font-extrabold ${
          gave ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {gave ? "+" : "−"}
        {formatMoney(entry.amount, entry.currency)}
      </div>
    </div>
  );
}
