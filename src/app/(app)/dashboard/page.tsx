import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { requireUser, getAuthUserInfo } from "@/server/auth";
import { AccountButton } from "@/components/nav/AccountButton";
import { getDashboard } from "@/server/queries/dashboard";
import { AppHeader } from "@/components/nav/AppHeader";
import { CountUp } from "@/components/ledger/CountUp";
import { TransactionsSection } from "@/components/ledger/TransactionsSection";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const userId = await requireUser();
  const [data, user] = await Promise.all([getDashboard(userId), getAuthUserInfo()]);

  const firstName = user.firstName ?? "there";
  const businessName = data.businessName;

  const base = data.baseCurrency;
  const baseTotal =
    data.totals.find((t) => t.currency === base) ??
    { currency: base, get: 0, give: 0, net: 0 };
  const otherTotals = data.totals.filter((t) => t.currency !== base);

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
        right={<AccountButton />}
      />

      <div className="px-5 pt-4">
        {/* You'll get / You'll give in base currency */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">
              <ArrowUpRight className="h-3.5 w-3.5" /> You&apos;ll get
            </div>
            <CountUp
              minor={baseTotal.get}
              currency={base}
              className="mt-1.5 block font-extrabold tracking-tight text-emerald-600"
              baseSize={24}
              minSize={13}
            />
          </div>
          <div className="rounded-3xl border border-red-100 bg-red-50/60 p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-700/80">
              <ArrowDownLeft className="h-3.5 w-3.5" /> You&apos;ll give
            </div>
            <CountUp
              minor={baseTotal.give}
              currency={base}
              className="mt-1.5 block font-extrabold tracking-tight text-red-600"
              baseSize={24}
              minSize={13}
            />
          </div>
        </section>

        {/* Other currencies (compact get/give) */}
        {otherTotals.length > 0 && (
          <section className="mt-3 space-y-1.5">
            {otherTotals.map((t) => (
              <div
                key={t.currency}
                className="flex items-center justify-between rounded-xl border bg-card px-3 py-2 text-xs"
              >
                <span className="font-bold text-muted-foreground">{t.currency}</span>
                <span className="flex gap-3">
                  <span className="font-semibold text-emerald-600">
                    +{formatMoney(t.get, t.currency)}
                  </span>
                  <span className="font-semibold text-red-600">
                    −{formatMoney(t.give, t.currency)}
                  </span>
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Latest transactions (with filter + export) */}
        <TransactionsSection
          entries={data.recentEntries}
          currencies={data.totals.map((t) => t.currency)}
          customers={data.customers}
        />
      </div>
    </>
  );
}
