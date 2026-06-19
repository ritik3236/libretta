import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { getCustomer } from "@/server/queries/customers";
import { getCurrencies } from "@/server/queries/currencies";
import { formatMoney, formatAbs } from "@/lib/money";
import { formatDateIST } from "@/lib/datetime";
import { PrintButton } from "./PrintButton";
import { appConfig, appTitle } from "@/lib/app-config";

export default async function StatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUser();
  await getCurrencies(); // hydrate currency registry for money formatting
  const customer = await getCustomer(userId, id);
  if (!customer) notFound();

  // entries oldest → newest for a running statement
  const ordered = [...customer.entries].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  let running = 0;
  const rows = ordered.map((e) => {
    running += e.direction === "CREDIT" ? e.amount : -e.amount;
    return { ...e, running };
  });

  const positive = customer.balance >= 0;

  return (
    <main className="mx-auto max-w-[700px] bg-white p-8 text-slate-900">
      <PrintButton />

      <div className="flex items-start justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Account Statement</h1>
          <p className="mt-1 text-sm text-slate-500">{appTitle}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Generated</p>
          <p className="font-semibold text-slate-700">{formatDateIST(new Date())}</p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Customer</p>
          <p className="text-lg font-bold">{customer.name}</p>
          {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {positive ? "You'll get" : "You'll give"}
          </p>
          <p className={`text-xl font-extrabold ${positive ? "text-emerald-600" : "text-red-600"}`}>
            {formatAbs(customer.balance, customer.currency)}
          </p>
        </div>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="py-2 font-semibold">Date</th>
            <th className="py-2 font-semibold">Details</th>
            <th className="py-2 text-right font-semibold">You gave</th>
            <th className="py-2 text-right font-semibold">You got</th>
            <th className="py-2 text-right font-semibold">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100">
              <td className="py-2 text-slate-500">{formatDateIST(r.occurredAt)}</td>
              <td className="py-2">{r.note || "—"}</td>
              <td className="py-2 text-right text-emerald-600">
                {r.direction === "CREDIT" ? formatMoney(r.amount, r.currency) : ""}
              </td>
              <td className="py-2 text-right text-red-600">
                {r.direction === "DEBIT" ? formatMoney(r.amount, r.currency) : ""}
              </td>
              <td className="py-2 text-right font-semibold">
                {formatMoney(r.running, r.currency)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-slate-400">
                No entries
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="mt-8 text-center text-[11px] text-slate-400">
        This is a computer-generated statement from {appConfig.name}.
      </p>
    </main>
  );
}
