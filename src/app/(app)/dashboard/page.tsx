import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Download, BarChart3, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { requireUser } from "@/server/auth";
import { getDashboard } from "@/server/queries/dashboard";
import { getBalanceTrend } from "@/server/queries/trend";
import { AppHeader } from "@/components/nav/AppHeader";
import { CountUp } from "@/components/ledger/CountUp";
import { CustomerCard } from "@/components/ledger/CustomerCard";
import { BalanceTrendChart } from "@/components/charts/BalanceTrendChart";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const userId = await requireUser();
  const [data, user, trend] = await Promise.all([
    getDashboard(userId),
    currentUser(),
    getBalanceTrend(userId),
  ]);

  const primary = data.totals[0];
  const firstName = user?.firstName ?? "there";
  const businessName =
    typeof user?.publicMetadata?.businessName === "string"
      ? user.publicMetadata.businessName
      : null;

  return (
    <>
      <AppHeader
        left={
          <div className="min-w-0">
            <p className="text-[12px] leading-tight text-muted-foreground">Good day,</p>
            <h1 className="truncate text-base font-extrabold leading-tight tracking-tight">
              {businessName || `${firstName} 👋`}
            </h1>
          </div>
        }
        right={<UserButton afterSignOutUrl="/" />}
      />

      <div className="px-5 pt-4">
        {/* Hero balance */}
        <section className="rounded-3xl border bg-muted/40 p-5">
          <p className="text-xs font-semibold text-muted-foreground">Net balance</p>
          {primary ? (
            <CountUp
              minor={primary.net}
              currency={primary.currency}
              className="mt-1 block text-[32px] font-extrabold leading-none tracking-tight"
            />
          ) : (
            <p className="mt-1 text-[32px] font-extrabold tracking-tight text-muted-foreground/40">
              —
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-card p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" /> You&apos;ll get
              </div>
              <div className="mt-1 text-base font-extrabold text-emerald-600">
                {primary ? formatMoney(primary.get, primary.currency) : "—"}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <ArrowDownLeft className="h-3.5 w-3.5 text-red-600" /> You&apos;ll give
              </div>
              <div className="mt-1 text-base font-extrabold text-red-600">
                {primary ? formatMoney(primary.give, primary.currency) : "—"}
              </div>
            </div>
          </div>

          {data.totals.length > 1 && (
            <div className="mt-3 space-y-1.5">
              {data.totals.slice(1).map((t) => (
                <div
                  key={t.currency}
                  className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-muted-foreground">{t.currency}</span>
                  <span className={`font-bold ${t.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatMoney(t.net, t.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Balance trend */}
        {trend && trend.points.length > 1 && (
          <section className="mt-4 rounded-3xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold">Net balance trend</h2>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {trend.currency} · last {trend.points.length} mo
              </span>
            </div>
            <BalanceTrendChart points={trend.points} currency={trend.currency} />
          </section>
        )}

        {/* Quick actions */}
        <section className="mt-4 grid grid-cols-3 gap-2.5">
          <Quick href="/parties" icon={<Users className="h-5 w-5" />} label="Customers" tint="sky" />
          <Quick href="/api/export/csv" icon={<Download className="h-5 w-5" />} label="Export" tint="amber" external />
          <Quick href="/reports" icon={<BarChart3 className="h-5 w-5" />} label="Reports" tint="violet" />
        </section>

        {/* Recent customers */}
        <section className="mt-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-bold">Customers</h2>
            <Link href="/parties" className="text-xs font-semibold text-primary">
              See all
            </Link>
          </div>
          {data.recent.length === 0 ? (
            <EmptyCustomers />
          ) : (
            <div>
              {data.recent.map((c) => (
                <CustomerCard key={c.id} customer={c} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

const tints: Record<string, string> = {
  sky: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

function Quick({
  href,
  icon,
  label,
  tint,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tint: string;
  external?: boolean;
}) {
  const inner = (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card py-3.5 transition active:scale-[.97]">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tints[tint]}`}>
        {icon}
      </span>
      <span className="text-[10px] font-bold text-foreground/70">{label}</span>
    </div>
  );
  return external ? <a href={href}>{inner}</a> : <Link href={href}>{inner}</Link>;
}

function EmptyCustomers() {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">No customers yet</p>
      <Link
        href="/parties/new"
        className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Add your first customer
      </Link>
    </div>
  );
}
