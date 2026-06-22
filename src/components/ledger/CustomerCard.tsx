import Link from "next/link";
import { formatAbs } from "@/lib/money";
import { initials } from "@/lib/utils";
import { getCurrencyMeta } from "@/lib/currency";
import { formatDistanceToNow } from "date-fns";

export function CustomerCard({
  customer,
}: {
  customer: {
    id: string;
    name: string;
    currency: string;
    balance: number;
    updatedAt: Date;
  };
}) {
  const positive = customer.balance >= 0;
  const settled = customer.balance === 0;
  const showBadge = customer.currency !== "INR";

  return (
    <Link
      href={`/banks/${customer.id}`}
      className="flex items-center gap-3 border-b border-slate-50 py-3 active:bg-slate-50"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
        {initials(customer.name)}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900">
          {customer.name}
          {showBadge && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
              {getCurrencyMeta(customer.currency)?.code ?? customer.currency}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          {formatDistanceToNow(customer.updatedAt, { addSuffix: true })}
        </div>
      </div>
      <div className="ml-auto text-right">
        <div
          className={`text-sm font-extrabold ${
            settled ? "text-slate-400" : positive ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {formatAbs(customer.balance, customer.currency)}
        </div>
        <div className="text-[10px] text-slate-400">
          {settled ? "settled" : positive ? "you'll get" : "you'll give"}
        </div>
      </div>
    </Link>
  );
}
