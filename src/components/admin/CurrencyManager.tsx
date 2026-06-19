"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCurrency, toggleCurrencyActive } from "@/server/actions/admin/currencies";
import { AdminCard } from "@/components/admin/AdminCard";
import type { CurrencyMeta } from "@/lib/currency";

export function CurrencyManager({ currencies }: { currencies: CurrencyMeta[] }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ code: "", symbol: "", decimals: "2", label: "" });

  function toggle(code: string, isActive: boolean) {
    startTransition(async () => {
      const res = await toggleCurrencyActive(code, isActive);
      if (!res.ok) toast.error(res.error);
    });
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createCurrency({
        code: form.code,
        symbol: form.symbol,
        decimals: Number(form.decimals),
        label: form.label,
      });
      if (res.ok) {
        toast.success(`Added ${form.code.toUpperCase()}`);
        setForm({ code: "", symbol: "", decimals: "2", label: "" });
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <AdminCard>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-semibold">Code</th>
              <th className="font-semibold">Symbol</th>
              <th className="font-semibold">Decimals</th>
              <th className="font-semibold">Label</th>
              <th className="font-semibold">Active</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((c) => (
              <tr key={c.code} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 font-bold">{c.code}</td>
                <td>{c.symbol}</td>
                <td className="tabular-nums">{c.decimals}</td>
                <td className="text-slate-600">{c.label}</td>
                <td>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(c.code, !(c.isActive ?? true))}
                    className={
                      (c.isActive ?? true)
                        ? "rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700"
                        : "rounded bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600"
                    }
                  >
                    {(c.isActive ?? true) ? "Active" : "Inactive"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>

      <form onSubmit={create} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <Field label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} w="w-20" />
        <Field label="Symbol" value={form.symbol} onChange={(v) => setForm({ ...form, symbol: v })} w="w-16" />
        <Field label="Decimals" value={form.decimals} onChange={(v) => setForm({ ...form, decimals: v })} w="w-20" />
        <Field label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} w="w-44" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          Add currency
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  w,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  w: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${w} rounded-md border border-slate-300 px-2 py-1 text-[13px] outline-none focus:border-slate-500`}
      />
    </label>
  );
}
