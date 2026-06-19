"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react";
import { formatDateTimeIST } from "@/lib/datetime";
import {
  approveEntry,
  rejectEntry,
  archiveEntry,
  unarchiveEntry,
  bulkApprove,
  loadEntryVersions,
} from "@/server/actions/admin/entries";
import type { AdminEntryRow, AdminEntryVersion } from "@/server/queries/admin";
import { formatAbs } from "@/lib/money";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-slate-200 text-slate-500",
};

// emerald-700 / red-600 — AA-safe direction colors
const dirColor = (d: "CREDIT" | "DEBIT") =>
  d === "CREDIT" ? "text-emerald-700" : "text-red-600";

type ActFn = (id: string) => Promise<{ ok: boolean; error?: string }>;

const BULK = "__bulk__";

export function AdminEntriesTable({ rows }: { rows: AdminEntryRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, AdminEntryVersion[]>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Which row (or the bulk op) is currently mutating — so we disable only that
  // row's buttons, not every row in the table.
  const [busyId, setBusyId] = useState<string | null>(null);
  const bulkBusy = busyId === BULK;

  const pendingIds = rows.filter((r) => r.status === "PENDING").map((r) => r.id);
  const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(pendingIds));
  }

  function expand(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!versions[id]) {
      startTransition(async () => {
        const v = await loadEntryVersions(id);
        setVersions((prev) => ({ ...prev, [id]: v }));
      });
    }
  }

  function act(fn: ActFn, id: string, label: string) {
    setBusyId(id);
    startTransition(async () => {
      try {
        const res = await fn(id);
        if (res.ok) {
          toast.success(label);
          const v = await loadEntryVersions(id);
          setVersions((prev) => ({ ...prev, [id]: v }));
          router.refresh();
        } else {
          toast.error(res.error ?? "Failed");
        }
      } finally {
        setBusyId(null);
      }
    });
  }

  function approveSelected() {
    const ids = [...selected];
    setBusyId(BULK);
    startTransition(async () => {
      try {
        const res = await bulkApprove(ids);
        if (res.ok) {
          toast.success(`Approved ${res.approved} ${res.approved === 1 ? "entry" : "entries"}`);
          setSelected(new Set());
          router.refresh();
        } else {
          toast.error(res.error);
        }
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-2 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px]">
          <span className="font-semibold text-emerald-800">{selected.size} selected</span>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={approveSelected}
            className="rounded-md bg-emerald-700 px-3 py-1 font-semibold text-white disabled:opacity-50"
          >
            {bulkBusy ? "Approving…" : "Approve selected"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="font-semibold text-slate-500 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Solid white card around the table (table-fixed + explicit column
          widths so expanding a row never reflows the columns). */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white px-3">
      <table className="w-full table-fixed text-[13px]">
        <colgroup>
          <col className="w-9" />
          <col className="w-48" />
          <col className="w-36" />
          <col className="w-44" />
          <col className="w-14" />
          <col className="w-36" />
          <col className="w-28" />
          <col className="w-36" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-1.5">
              <input
                type="checkbox"
                aria-label="Select all pending"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 cursor-pointer accent-emerald-700"
              />
            </th>
            <th className="font-semibold">Date</th>
            <th className="font-semibold">User</th>
            <th className="font-semibold">Party</th>
            <th className="font-semibold">Type</th>
            <th className="font-semibold text-right pr-6">Amount</th>
            <th className="font-semibold">Status</th>
            <th className="font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isOpen = openId === r.id;
            return (
              <Fragment key={r.id}>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select entry ${r.customerName}`}
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      disabled={r.status !== "PENDING"}
                      className="h-3.5 w-3.5 cursor-pointer accent-emerald-700 disabled:opacity-30"
                    />
                  </td>
                  <td
                    className="cursor-pointer whitespace-nowrap text-slate-600"
                    onClick={() => expand(r.id)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      )}
                      {formatDateTimeIST(r.occurredAt)}
                    </span>
                  </td>
                  <td className="max-w-[140px] cursor-pointer truncate" onClick={() => expand(r.id)}>
                    {r.userLabel}
                  </td>
                  <td className="cursor-pointer align-top" onClick={() => expand(r.id)}>
                    <div className="truncate font-semibold">{r.customerName}</div>
                    {r.note && (
                      <div className="truncate text-[11px] font-normal text-slate-500" title={r.note}>
                        {r.note}
                      </div>
                    )}
                  </td>
                  <td className={`cursor-pointer ${dirColor(r.direction)}`} onClick={() => expand(r.id)}>
                    {r.direction === "CREDIT" ? "gave" : "got"}
                  </td>
                  <td
                    className={`cursor-pointer text-right font-semibold tabular-nums pr-6 ${dirColor(r.direction)}`}
                    onClick={() => expand(r.id)}
                  >
                    {formatAbs(r.amount, r.currency)}
                  </td>
                  <td className="cursor-pointer" onClick={() => expand(r.id)}>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${statusStyle[r.status]}`}>
                      {r.status}
                      {r.version > 1 ? ` · v${r.version}` : ""}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <RowActions row={r} act={act} pending={busyId === r.id || bulkBusy} />
                  </td>
                </tr>

                {isOpen &&
                  (versions[r.id] ? (
                    versions[r.id].map((v) => (
                      <tr
                        key={`${r.id}-v${v.version}`}
                        className="border-b border-slate-100 bg-slate-50/70 text-[12px] text-slate-600 animate-in fade-in-0 duration-200"
                      >
                        <td />
                        <td className="whitespace-nowrap py-1 pl-5 text-slate-500">
                          {formatDateTimeIST(v.validFrom)}
                        </td>
                        <td className="text-slate-500">
                          <span className="font-bold">v{v.version}</span>
                          <span className="ml-1 text-slate-500">{v.isAdmin ? "admin" : "user"}</span>
                        </td>
                        <td className="truncate text-slate-500" title={v.note ?? undefined}>
                          {v.note || <span className="text-slate-300">—</span>}
                        </td>
                        <td className={dirColor(v.direction)}>
                          {v.direction === "CREDIT" ? "gave" : "got"}
                        </td>
                        <td className={`text-right tabular-nums pr-6 ${dirColor(v.direction)}`}>
                          {formatAbs(v.amount, v.currency)}
                        </td>
                        <td className="whitespace-nowrap">
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] font-bold ${statusStyle[v.status]}`}
                          >
                            {v.status}
                          </span>
                          {!v.validTo && (
                            <span className="ml-1 text-[10px] font-bold text-emerald-700">live</span>
                          )}
                        </td>
                        <td className="text-right">
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {v.changeType}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-slate-50/70 animate-in fade-in-0 duration-200">
                      <td />
                      <td colSpan={7} className="px-3 py-2 text-[12px] text-slate-500">
                        Loading history…
                      </td>
                    </tr>
                  ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

/** Primary action inline + destructive/secondary actions behind a ⋯ menu. */
function RowActions({
  row,
  act,
  pending,
}: {
  row: AdminEntryRow;
  act: (fn: ActFn, id: string, label: string) => void;
  pending: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const run = (fn: ActFn, label: string) => {
    setMenuOpen(false);
    act(fn, row.id, label);
  };

  // primary inline action + the items shown in the overflow menu.
  // Only PENDING entries can be approved.
  const primary =
    row.status === "PENDING"
      ? { label: "Approve", fn: approveEntry, toast: "Approved" }
      : row.status === "ARCHIVED"
        ? { label: "Restore", fn: unarchiveEntry, toast: "Restored" }
        : null; // APPROVED / REJECTED have no inline primary

  const menu: { label: string; fn: ActFn; toast: string; danger?: boolean }[] = [];
  if (row.status === "PENDING" || row.status === "APPROVED")
    menu.push({ label: "Reject", fn: rejectEntry, toast: "Rejected", danger: true });
  if (row.status !== "ARCHIVED")
    menu.push({ label: "Archive", fn: archiveEntry, toast: "Archived" });

  return (
    <div className="inline-flex items-center gap-1">
      {primary && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(primary.fn, primary.toast)}
          className="rounded-md bg-emerald-700 px-2.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {primary.label}
        </button>
      )}
      {menu.length > 0 && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="More actions"
              disabled={pending}
              className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-36 p-1">
            {menu.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => run(m.fn, m.toast)}
                className={`block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium ${
                  m.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {m.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
