"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setCanCreateParties } from "@/server/actions/admin/users";
import { assignPredefinedPartyToUser } from "@/server/actions/admin/parties";
import { formatAbs } from "@/lib/money";

type Customer = { id: string; name: string; currency: string; balance: number; fromPredefined: boolean };
type Predefined = { id: string; name: string; currency: string };

export function UserDetailClient({
  userId,
  canCreateParties,
  customers,
  assignable,
}: {
  userId: string;
  canCreateParties: boolean;
  customers: Customer[];
  assignable: Predefined[];
}) {
  const [pending, startTransition] = useTransition();

  function togglePerm() {
    startTransition(async () => {
      const res = await setCanCreateParties(userId, !canCreateParties);
      if (res.ok) toast.success("Permission updated");
      else toast.error(res.error);
    });
  }

  function assign(predefinedId: string, name: string) {
    startTransition(async () => {
      const res = await assignPredefinedPartyToUser(userId, predefinedId);
      if (res.ok) toast.success(`Assigned ${name}`);
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold">Can create own parties</div>
            <div className="text-[11px] text-slate-500">
              When off, this user can only use parties you assign.
            </div>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={togglePerm}
            className={
              canCreateParties
                ? "rounded-md bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
                : "rounded-md bg-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-700 disabled:opacity-50"
            }
          >
            {canCreateParties ? "Enabled" : "Disabled"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-bold text-slate-700">Parties ({customers.length})</h2>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {customers.length === 0 && (
            <li className="p-3 text-[13px] text-slate-500">No parties yet.</li>
          )}
          {customers.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-2.5 text-[13px]">
              <span className="font-semibold">
                {c.name}
                {c.fromPredefined && (
                  <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    assigned
                  </span>
                )}
              </span>
              <span className="text-slate-600">{formatAbs(c.balance, c.currency)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-bold text-slate-700">
          Assign predefined party ({assignable.length} available)
        </h2>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {assignable.length === 0 && (
            <li className="p-3 text-[13px] text-slate-500">Nothing left to assign.</li>
          )}
          {assignable.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-2.5 text-[13px]">
              <span className="font-semibold">
                {p.name} <span className="text-[11px] text-slate-500">({p.currency})</span>
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => assign(p.id, p.name)}
                className="rounded-md bg-slate-900 px-2.5 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Assign
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
