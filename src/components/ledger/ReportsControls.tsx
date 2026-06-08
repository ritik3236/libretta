"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { DatePicker } from "./DatePicker";
import { cn } from "@/lib/utils";

type Period = "month" | "30d" | "year" | "all" | "custom";

const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "30d", label: "30 days" },
  { value: "year", label: "Year" },
  { value: "all", label: "All" },
  { value: "custom", label: "Custom" },
];

export function ReportsControls({
  period,
  currency,
  currencies,
  from,
  to,
}: {
  period: Period;
  currency: string;
  currencies: string[];
  from: string | null;
  to: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParams(next: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    router.push(`/reports?${p.toString()}`);
  }

  return (
    <div className="space-y-3">
      {/* Period */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {PERIODS.map((pr) => (
          <button
            key={pr.value}
            onClick={() => setParams({ period: pr.value })}
            className={cn(
              "shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition",
              period === pr.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-muted-foreground",
            )}
          >
            {pr.label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      {period === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            value={from ? new Date(from) : null}
            onChange={(d) => setParams({ from: format(d, "yyyy-MM-dd") })}
            max={to ? new Date(to) : new Date()}
            placeholder="From"
            className="h-10 text-sm"
          />
          <DatePicker
            value={to ? new Date(to) : null}
            onChange={(d) => setParams({ to: format(d, "yyyy-MM-dd") })}
            max={new Date()}
            placeholder="To"
            className="h-10 text-sm"
          />
        </div>
      )}

      {/* Currency */}
      {currencies.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => setParams({ currency: c })}
              className={cn(
                "rounded-lg border px-3 py-1 text-xs font-semibold transition",
                currency === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
