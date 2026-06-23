"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
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
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const statusPill: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-slate-200 text-slate-500",
};

// 3px left-edge accent — the at-a-glance status signal in dense view.
const statusAccent: Record<string, string> = {
  PENDING: "border-l-amber-400",
  APPROVED: "border-l-emerald-500",
  REJECTED: "border-l-red-400",
  ARCHIVED: "border-l-slate-300",
};

// emerald-700 / red-600 — AA-safe direction colors
const dirColor = (d: "CREDIT" | "DEBIT") =>
  d === "CREDIT" ? "text-emerald-700" : "text-red-600";

type ActFn = (id: string) => Promise<{ ok: boolean; error?: string }>;
type View = "grid" | "dense";

const BULK = "__bulk__";
const VIEW_KEY = "adminEntriesView";

export function AdminEntriesTable({ rows }: { rows: AdminEntryRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, AdminEntryVersion[]>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useState<View>("grid");
  const bulkBusy = busyId === BULK;

  // Restore the saved view preference on mount (SSR renders the "grid" default).
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "grid" || saved === "dense") setView(saved);
  }, []);
  function changeView(v: View) {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  }

  const grid = view === "grid";
  // Grid: every cell ruled (spreadsheet). Dense: row separators only, tighter.
  const cell = grid
    ? "border border-slate-200 px-2.5 py-1.5 align-middle"
    : "border-b border-slate-100 px-2 py-1 align-middle";
  const headCell = grid
    ? "border border-slate-200 px-2.5 py-2"
    : "border-b border-slate-200 px-2 py-1.5";

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
      {/* Toolbar: bulk actions (left) + view switch (right) */}
      <div className="mb-2 flex items-center gap-3">
        {selected.size > 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px]">
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
        ) : (
          <span />
        )}

        <div className="ml-auto inline-flex items-center rounded-lg border border-slate-200 p-0.5 text-[12px]">
          {(["grid", "dense"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => changeView(v)}
              className={cn(
                "rounded-md px-2.5 py-1 font-semibold capitalize transition",
                view === v ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className={cn("w-full table-fixed", grid ? "text-[12.5px]" : "text-[12px]")}>
          <colgroup>
            <col className="w-10" />
            <col className="w-36" />
            <col className="w-44" />
            <col className="w-32" />
            {/* Notes — absorbs the slack */}
            <col />
            <col className="w-40" />
            <col className="w-28" />
            <col className="w-32" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <th className={cn(headCell, "text-center")}>
                <input
                  type="checkbox"
                  aria-label="Select all pending"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 cursor-pointer accent-emerald-700 align-middle"
                />
              </th>
              <th className={headCell}>Date</th>
              <th className={headCell}>Bank</th>
              <th className={cn(headCell, "text-right")}>Amount</th>
              <th className={headCell}>Notes</th>
              <th className={headCell}>User</th>
              <th className={headCell}>Status</th>
              <th className={cn(headCell, "text-right")}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = openId === r.id;
              const gave = r.direction === "CREDIT";
              return (
                <Fragment key={r.id}>
                  <tr className="group hover:bg-slate-50/80">
                    <td
                      className={cn(cell, "text-center", !grid && cn("border-l-[3px]", statusAccent[r.status]))}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select entry ${r.customerName}`}
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        disabled={r.status !== "PENDING"}
                        className="h-3.5 w-3.5 cursor-pointer accent-emerald-700 align-middle disabled:opacity-30"
                      />
                    </td>

                    {/* Date — leads the row; click (with the chevron) expands history */}
                    <td
                      className={cn(cell, "cursor-pointer whitespace-nowrap text-slate-500")}
                      onClick={() => expand(r.id)}
                    >
                      <span className="flex items-center gap-1.5">
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        )}
                        {formatDateTimeIST(r.occurredAt)}
                      </span>
                    </td>

                    <td className={cn(cell, "cursor-pointer")} onClick={() => expand(r.id)}>
                      <span className="block truncate font-semibold text-slate-800">{r.customerName}</span>
                    </td>

                    {/* Amount — direction encoded by sign + color */}
                    <td
                      className={cn(
                        cell,
                        "whitespace-nowrap text-right font-semibold tabular-nums",
                        grid ? "" : "font-mono",
                        dirColor(r.direction),
                      )}
                    >
                      {gave ? "+" : "−"}
                      {formatAbs(r.amount, r.currency)}
                    </td>

                    {/* Notes — dedicated column, truncated with full text on hover */}
                    <td className={cell} title={r.note ?? undefined}>
                      <span className={cn("block truncate", r.note ? "text-slate-600" : "text-slate-300")}>
                        {r.note || "—"}
                      </span>
                    </td>

                    <td className={cn(cell, "truncate text-slate-500")} title={r.userLabel}>
                      {r.userLabel}
                    </td>

                    <td className={cell}>
                      <span className={cn("rounded px-2 py-0.5 text-[11px] font-semibold", statusPill[r.status])}>
                        {r.status.toLowerCase()}
                        {r.version > 1 ? ` · v${r.version}` : ""}
                      </span>
                    </td>

                    <td className={cn(cell, "whitespace-nowrap text-right")}>
                      <RowActions row={r} act={act} pending={busyId === r.id || bulkBusy} />
                    </td>
                  </tr>

                  {isOpen &&
                    (versions[r.id] ? (
                      versions[r.id].map((v) => (
                        <tr
                          key={`${r.id}-v${v.version}`}
                          className="bg-slate-50/60 text-[11.5px] text-slate-500 animate-in fade-in-0 duration-200"
                        >
                          <td className={cell} />
                          <td className={cn(cell, "whitespace-nowrap pl-7 text-slate-400")}>
                            {formatDateTimeIST(v.validFrom)}
                          </td>
                          <td className={cell}>
                            <span className="font-bold text-slate-600">v{v.version}</span>
                            <span className="ml-1.5">{v.isAdmin ? "admin" : "user"}</span>
                          </td>
                          <td className={cn(cell, "whitespace-nowrap text-right tabular-nums", dirColor(v.direction))}>
                            {v.direction === "CREDIT" ? "+" : "−"}
                            {formatAbs(v.amount, v.currency)}
                          </td>
                          <td className={cell} title={v.note ?? undefined}>
                            <span className="block truncate">{v.note || "—"}</span>
                          </td>
                          <td className={cn(cell, "text-slate-400")}>{v.changeType.toLowerCase()}</td>
                          <td className={cell}>
                            <span className={cn("rounded px-2 py-0.5 text-[11px] font-semibold", statusPill[v.status])}>
                              {v.status.toLowerCase()}
                            </span>
                          </td>
                          <td className={cn(cell, "text-right")}>
                            {!v.validTo && (
                              <span className="text-[10px] font-bold uppercase text-emerald-700">live</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="bg-slate-50/60 animate-in fade-in-0 duration-200">
                        <td className={cell} />
                        <td className={cn(cell, "pl-7 text-slate-400")} colSpan={7}>
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

  const primary =
    row.status === "PENDING"
      ? { label: "Approve", fn: approveEntry, toast: "Approved" }
      : row.status === "ARCHIVED"
        ? { label: "Restore", fn: unarchiveEntry, toast: "Restored" }
        : null;

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
          className="rounded-md border border-emerald-600 px-2.5 py-1 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white disabled:opacity-50"
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
