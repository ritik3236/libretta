import Link from "next/link";
import { Download } from "lucide-react";
import { requireUser } from "@/server/auth";
import { getDashboard } from "@/server/queries/dashboard";
import { AppHeader } from "@/components/nav/AppHeader";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export default async function ReportsPage() {
  const userId = await requireUser();
  const { totals, customerCount } = await getDashboard(userId);

  return (
    <>
      <AppHeader
        title="Reports"
        subtitle={`${customerCount} parties`}
        right={
          <Button asChild size="sm" variant="outline">
            <a href="/api/export/csv">
              <Download className="h-4 w-4" /> CSV
            </a>
          </Button>
        }
      />

      <div className="px-5 pt-4">
        <section className="space-y-3">
          {totals.length === 0 && (
            <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No data yet — add some entries.
            </p>
          )}
          {totals.map((t) => (
            <div key={t.currency} className="rounded-2xl border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{t.currency}</span>
                <span
                  className={`text-sm font-extrabold ${
                    t.net >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  Net {formatMoney(t.net, t.currency)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-card p-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    You&apos;ll get
                  </p>
                  <p className="mt-0.5 font-bold text-emerald-600">
                    {formatMoney(t.get, t.currency)}
                  </p>
                </div>
                <div className="rounded-xl bg-card p-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    You&apos;ll give
                  </p>
                  <p className="mt-0.5 font-bold text-red-600">
                    {formatMoney(t.give, t.currency)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
