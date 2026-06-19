import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { getReports } from "@/server/queries/reports";
import { getCurrencies } from "@/server/queries/currencies";
import { formatMoney, formatAbs } from "@/lib/money";
import { formatDateIST, istDayStartUTC, istDayEndUTC } from "@/lib/datetime";
import { appConfig, appTitle } from "@/lib/app-config";
import { PrintButton } from "../statement/[id]/PrintButton";

export default async function ReportSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const userId = await requireUser();
  await getCurrencies(); // hydrate currency registry for money formatting

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true, businessName: true },
  });
  const currency = sp.currency ?? dbUser?.baseCurrency ?? "INR";
  const from = sp.from ? istDayStartUTC(sp.from) : new Date(0);
  const to = sp.to ? istDayEndUTC(sp.to) : new Date();

  const data = await getReports(userId, currency, from, to);
  const rangeLabel = sp.from || sp.to
    ? `${sp.from ? formatDateIST(from) : "start"} – ${formatDateIST(to)}`
    : "All time";

  return (
    <main className="mx-auto max-w-[700px] bg-white p-8 text-slate-900">
      <PrintButton />

      <div className="flex items-start justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Report Summary</h1>
          <p className="mt-1 text-sm text-slate-500">
            {dbUser?.businessName || appTitle} · {currency}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Period</p>
          <p className="font-semibold text-slate-700">{rangeLabel}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <SummaryBox label="You gave" value={formatMoney(data.summary.gave, currency)} className="text-emerald-600" />
        <SummaryBox label="You got" value={formatMoney(data.summary.got, currency)} className="text-red-600" />
        <SummaryBox
          label="Net"
          value={formatMoney(data.summary.net, currency)}
          className={data.summary.net >= 0 ? "text-emerald-600" : "text-red-600"}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-slate-500">You&apos;ll get: </span>
          <span className="font-bold text-emerald-600">
            {formatMoney(data.exposure.receivable, currency)}
          </span>{" "}
          <span className="text-slate-400">({data.exposure.receivableCount})</span>
        </div>
        <div>
          <span className="text-slate-500">You&apos;ll give: </span>
          <span className="font-bold text-red-600">
            {formatMoney(data.exposure.payable, currency)}
          </span>{" "}
          <span className="text-slate-400">({data.exposure.payableCount})</span>
        </div>
        <div>
          <span className="text-slate-500">Settled: </span>
          <span className="font-bold">{data.exposure.settledCount}</span>
        </div>
      </div>

      <RankTable title="Top — you'll get" parties={data.topReceivables} currency={currency} />
      <RankTable title="Top — you'll give" parties={data.topPayables} currency={currency} />

      <p className="mt-8 text-center text-[11px] text-slate-400">
        Computer-generated summary from {appConfig.name}.
      </p>
    </main>
  );
}

function SummaryBox({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${className}`}>{value}</p>
    </div>
  );
}

function RankTable({
  title,
  parties,
  currency,
}: {
  title: string;
  parties: { id: string; name: string; balance: number }[];
  currency: string;
}) {
  if (parties.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {parties.map((p) => (
            <tr key={p.id} className="border-b border-slate-100">
              <td className="py-2">{p.name}</td>
              <td className="py-2 text-right font-semibold">{formatAbs(p.balance, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
