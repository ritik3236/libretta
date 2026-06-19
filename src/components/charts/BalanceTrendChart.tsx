"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, fromMinor } from "@/lib/money";
import { getCurrencyMeta } from "@/lib/currency";

type Point = { label: string; value: number };

export function BalanceTrendChart({
  points,
  currency,
}: {
  points: Point[];
  currency: string;
}) {
  const data = points.map((p) => ({ ...p, major: fromMinor(p.value, currency) }));
  const symbol = getCurrencyMeta(currency)?.symbol ?? "";

  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
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
          tickFormatter={(v: number) =>
            `${symbol}${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
          }
        />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            fontSize: 12,
            padding: "6px 10px",
            boxShadow: "0 6px 20px -8px rgba(0,0,0,.25)",
          }}
          formatter={(value) => [formatMoney(Number(value) * 100, currency), "Net"]}
        />
        <Area
          type="monotone"
          dataKey="major"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          fill="url(#balanceFill)"
          dot={{ r: 2.5, fill: "var(--chart-1)" }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
