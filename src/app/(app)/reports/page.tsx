import Link from "next/link";
import { Download, FileText, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import {
  startOfMonth,
  startOfYear,
  startOfDay,
  endOfDay,
  subDays,
  format,
  formatDistanceToNow,
} from "date-fns";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { getReports, getReportCurrencies, type ReportParty } from "@/server/queries/reports";
import { AppHeader } from "@/components/nav/AppHeader";
import { ReportsControls } from "@/components/ledger/ReportsControls";
import { ReportChart } from "@/components/charts/ReportChart";
import { formatMoney, formatAbs } from "@/lib/money";

type Period = "month" | "30d" | "year" | "all" | "custom";

function resolveRange(period: Period, from: string | null, to: string | null) {
  const now = new Date();
  switch (period) {
    case "month":
      return { from: startOfMonth(now), to: endOfDay(now) };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "all":
      return { from: new Date(0), to: endOfDay(now) };
    case "custom":
      return {
        from: from ? startOfDay(new Date(from)) : new Date(0),
        to: to ? endOfDay(new Date(to)) : endOfDay(now),
      };
    case "year":
    default:
      return { from: startOfYear(now), to: endOfDay(now) };
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; currency?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const userId = await requireUser();

  const period = (["month", "30d", "year", "all", "custom"].includes(sp.period ?? "")
    ? sp.period
    : "year") as Period;
  const { from, to } = resolveRange(period, sp.from ?? null, sp.to ?? null);

  const [currencies, dbUser] = await Promise.all([
    getReportCurrencies(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { baseCurrency: true } }),
  ]);
  const base = dbUser?.baseCurrency ?? "INR";
  const currency =
    sp.currency && currencies.includes(sp.currency)
      ? sp.currency
      : currencies.includes(base)
        ? base
        : (currencies[0] ?? base);

  const data = await getReports(userId, currency, from, to);

  // export hrefs carry the active scope
  const exportParams = new URLSearchParams({ currency });
  if (period !== "all") {
    exportParams.set("from", format(from, "yyyy-MM-dd"));
    exportParams.set("to", format(to, "yyyy-MM-dd"));
  }
  const csvHref = `/api/export/csv?${exportParams.toString()}`;
  const pdfHref = `/report-summary?${exportParams.toString()}`;

  return (
    <>
      <AppHeader
        title="Reports"
        right={
          <>
            <a
              href={pdfHref}
              target="_blank"
              aria-label="PDF summary"
              className="flex h-9 w-9 items-center justify-center rounded-xl border text-foreground/70 active:scale-95"
            >
              <FileText className="h-5 w-5" />
            </a>
            <a
              href={csvHref}
              aria-label="Export CSV"
              className="flex h-9 w-9 items-center justify-center rounded-xl border text-foreground/70 active:scale-95"
            >
              <Download className="h-5 w-5" />
            </a>
          </>
        }
      />

      <div className="space-y-5 px-5 pt-4">
        <ReportsControls
          period={period}
          currency={currency}
          currencies={currencies}
          from={sp.from ?? null}
          to={sp.to ?? null}
        />

        {/* Period summary */}
        <section className="grid grid-cols-3 gap-2.5">
          <Stat label="You gave" value={formatMoney(data.summary.gave, currency)} tone="emerald" />
          <Stat label="You got" value={formatMoney(data.summary.got, currency)} tone="red" />
          <Stat
            label="Net"
            value={formatMoney(data.summary.net, currency)}
            tone={data.summary.net >= 0 ? "emerald" : "red"}
          />
        </section>

        {/* Chart */}
        <section className="rounded-3xl border bg-card p-4">
          <ReportChart monthly={data.monthly} currency={currency} />
        </section>

        {/* Exposure */}
        <section className="rounded-3xl border bg-muted/40 p-4">
          <h2 className="mb-3 text-sm font-bold">Outstanding</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Exposure
              count={data.exposure.receivableCount}
              amount={formatMoney(data.exposure.receivable, currency)}
              label="You'll get"
              tone="emerald"
            />
            <Exposure
              count={data.exposure.payableCount}
              amount={formatMoney(data.exposure.payable, currency)}
              label="You'll give"
              tone="red"
            />
            <Exposure count={data.exposure.settledCount} amount="—" label="Settled" tone="muted" />
          </div>
        </section>

        {/* Top receivables */}
        <PartyRanking
          title="Top — you'll get"
          icon={<ArrowUpRight className="h-4 w-4 text-emerald-600" />}
          parties={data.topReceivables}
          currency={currency}
          tone="emerald"
        />

        {/* Top payables */}
        <PartyRanking
          title="Top — you'll give"
          icon={<ArrowDownLeft className="h-4 w-4 text-red-600" />}
          parties={data.topPayables}
          currency={currency}
          tone="red"
        />

        {/* Aging */}
        <section>
          <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold">
            <Clock className="h-4 w-4 text-muted-foreground" /> Oldest outstanding
          </h2>
          {data.aging.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing outstanding.</p>
          ) : (
            <div>
              {data.aging.map((p) => (
                <Link
                  key={p.id}
                  href={`/parties/${p.id}`}
                  className="flex items-center justify-between border-b border-border/50 py-3 active:bg-muted/40"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      last activity {formatDistanceToNow(p.lastActivity, { addSuffix: true })}
                    </div>
                  </div>
                  <div
                    className={`ml-auto text-sm font-extrabold ${
                      p.balance >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatAbs(p.balance, currency)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "emerald" | "red" }) {
  return (
    <div className="rounded-2xl border bg-card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${tone === "emerald" ? "text-emerald-600" : "text-red-600"}`}>
        {value}
      </p>
    </div>
  );
}

function Exposure({
  count,
  amount,
  label,
  tone,
}: {
  count: number;
  amount: string;
  label: string;
  tone: "emerald" | "red" | "muted";
}) {
  const color =
    tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-muted-foreground";
  return (
    <div className="rounded-2xl bg-card p-3">
      <p className="text-lg font-extrabold">{count}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-xs font-bold ${color}`}>{amount}</p>
    </div>
  );
}

function PartyRanking({
  title,
  icon,
  parties,
  currency,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  parties: ReportParty[];
  currency: string;
  tone: "emerald" | "red";
}) {
  if (parties.length === 0) return null;
  return (
    <section>
      <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold">
        {icon} {title}
      </h2>
      <div>
        {parties.map((p) => (
          <Link
            key={p.id}
            href={`/parties/${p.id}`}
            className="flex items-center justify-between border-b border-border/50 py-2.5 active:bg-muted/40"
          >
            <span className="truncate text-sm font-semibold">{p.name}</span>
            <span
              className={`ml-auto text-sm font-extrabold ${
                tone === "emerald" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatAbs(p.balance, currency)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
