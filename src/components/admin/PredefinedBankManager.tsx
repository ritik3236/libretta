"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createPredefinedBank,
  togglePredefinedBankActive,
} from "@/server/actions/admin/banks";
import { useActiveCurrencies } from "@/components/providers/CurrencyProvider";

type Bank = {
  id: string;
  name: string;
  phone: string | null;
  currency: string;
  isActive: boolean;
};

export function PredefinedBankManager({ banks }: { banks: Bank[] }) {
  const currencies = useActiveCurrencies();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", phone: "", currency: currencies[0]?.code ?? "INR", note: "" });

  function toggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const res = await togglePredefinedBankActive(id, isActive);
      if (!res.ok) toast.error(res.error);
    });
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPredefinedBank(form);
      if (res.ok) {
        toast.success(`Added ${form.name}`);
        setForm({ name: "", phone: "", currency: form.currency, note: "" });
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {banks.length === 0 && <li className="p-3 text-[13px] text-slate-500">No predefined banks.</li>}
        {banks.map((p) => (
          <li key={p.id} className="flex items-center justify-between p-2.5 text-[13px]">
            <span className="font-semibold">
              {p.name} <span className="text-[11px] text-slate-500">({p.currency})</span>
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() => toggle(p.id, !p.isActive)}
              className={
                p.isActive
                  ? "rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700"
                  : "rounded bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-500"
              }
            >
              {p.isActive ? "Active" : "Inactive"}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={create} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-500">Name</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-44 rounded-md border border-slate-300 px-2 py-1 text-[13px] outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-500">Phone</span>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-32 rounded-md border border-slate-300 px-2 py-1 text-[13px] outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-500">Currency</span>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1 text-[13px] outline-none focus:border-slate-500"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          Add bank
        </button>
      </form>
    </div>
  );
}
