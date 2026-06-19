"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, fromMinor } from "@/lib/money";
import { getCurrencyMeta } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Point = { label: string; gave: number; got: number; net: number };

export function ReportChart({ monthly, currency }: { monthly: Point[]; currency: string }) {
  const [view, setView] = useState<"bars" | "line">("bars");
  const symbol = getCurrencyMeta(currency)?.symbol ?? "";

  const data = monthly.map((m) => ({
    label: m.label,
    gave: fromMinor(m.gave, currency),
    got: fromMinor(m.got, currency),
    net: fromMinor(m.net, currency),
  }));

  const tickFmt = (v: number) =>
    `${symbol}${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold">
          {view === "bars" ? "Gave vs got per month" : "Net balance trend"}
        </h2>
        <div className="flex gap-0.5 rounded-lg bg-muted p-0.5 text-[11px] font-semibold">
          <button
            onClick={() => setView("bars")}
            className={cn(
              "rounded-md px-2.5 py-1 transition",
              view === "bars" ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
          >
            Bars
          </button>
          <button
            onClick={() => setView("line")}
            className={cn(
              "rounded-md px-2.5 py-1 transition",
              view === "line" ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
          >
            Line
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No activity in this period.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          {view === "bars" ? (
            <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={tickFmt}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                formatter={(value, name) => [
                  formatMoney(Number(value) * 100, currency),
                  name === "gave" ? "You gave" : "You got",
                ]}
              />
              <Bar dataKey="gave" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="got" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="reportNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={tickFmt}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                formatter={(value) => [formatMoney(Number(value) * 100, currency), "Net"]}
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#reportNet)"
                dot={{ r: 2.5, fill: "var(--chart-1)" }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
