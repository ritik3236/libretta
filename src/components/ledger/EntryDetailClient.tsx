"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Calendar as CalIcon, StickyNote, Lock } from "lucide-react";
import { updateEntry, deleteEntry } from "@/server/actions/entries";
import { istInputToUTC, formatDateTimeIST } from "@/lib/datetime";
import { fromMinor, formatMoney, groupAmountInput } from "@/lib/money";
import { getCurrencyMeta } from "@/lib/currency";
import { statusMeta } from "@/lib/entry-status";
import { cn } from "@/lib/utils";
import { NumberPad } from "./NumberPad";
import { DirectionChip, DateChipField, NoteField } from "./entry-chips";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { EntryDetail, EntryVersionView } from "@/server/queries/entry-detail";

function changeLabel(v: EntryVersionView): string {
  switch (v.changeType) {
    case "CREATE":
      return "Created";
    case "EDIT":
      return "Edited";
    case "ARCHIVE":
      return "Deleted";
    case "UNARCHIVE":
      return "Restored";
    case "STATUS_CHANGE":
      return v.status === "APPROVED"
        ? "Approved"
        : v.status === "REJECTED"
          ? "Rejected"
          : "Status updated";
    default:
      return v.changeType;
  }
}

export function EntryDetailClient({ entry }: { entry: EntryDetail }) {
  const router = useRouter();
  const cur = entry.currency;
  const symbol = getCurrencyMeta(cur)?.symbol ?? "";
  const gave = entry.direction === "CREDIT";
  const sm = statusMeta(entry.status);
  const editable = entry.status === "PENDING";

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, startTransition] = useTransition();

  // Edit-form state (prefilled when the sheet opens).
  const [direction, setDirection] = useState(entry.direction);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState(entry.note ?? "");
  const [date, setDate] = useState<Date>(entry.occurredAt);
  const eGave = direction === "CREDIT";

  // Inline note editing (no sheet) — separate draft from the edit sheet's note.
  const [inlineNote, setInlineNote] = useState(entry.note ?? "");
  const noteDirty = inlineNote !== (entry.note ?? "");

  function saveNote() {
    startTransition(async () => {
      const res = await updateEntry({
        id: entry.id,
        direction: entry.direction,
        amount: fromMinor(entry.amount, cur),
        note: inlineNote,
        occurredAt: entry.occurredAt,
      });
      if (res.ok) {
        toast.success("Note updated");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function openEdit() {
    setDirection(entry.direction);
    setAmount(String(fromMinor(entry.amount, cur)));
    setNote(entry.note ?? "");
    setDate(entry.occurredAt);
    setEditOpen(true);
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setEditOpen(false);
    startTransition(async () => {
      const res = await updateEntry({
        id: entry.id,
        direction,
        amount: amt,
        note,
        occurredAt: istInputToUTC(date),
      });
      if (res.ok) {
        toast.success("Entry updated");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteEntry(entry.id);
      if (res.ok) {
        toast.success("Entry deleted");
        router.push(`/banks/${entry.customerId}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div>
      {/* Amount (colored by direction) + meta */}
      <div
        className={cn(
          "text-[34px] font-extrabold leading-none tracking-tight tabular-nums",
          gave ? "text-emerald-600" : "text-red-600",
        )}
      >
        {gave ? "+" : "−"}
        {formatMoney(entry.amount, cur)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{entry.customerName}</span>
        <span aria-hidden>·</span>
        <span>{gave ? "Credit" : "Debit"}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sm.badge)}>
          {sm.label}
        </span>
      </div>

      <div className="my-4 h-px bg-border" />

      {/* Details */}
      <div className="flex items-center justify-between border-b border-border py-2.5 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <CalIcon className="h-4 w-4" /> Date
        </span>
        <span>{formatDateTimeIST(entry.occurredAt)}</span>
      </div>
      <div className="border-b border-border py-2.5 text-sm">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" /> Note
          </span>
          {editable && noteDirty && (
            <span className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setInlineNote(entry.note ?? "")}
                className="text-xs text-muted-foreground"
              >
                Cancel
              </button>
              <button type="button" onClick={saveNote} className="text-xs font-semibold text-primary">
                Save
              </button>
            </span>
          )}
        </div>
        {editable ? (
          <textarea
            value={inlineNote}
            onChange={(e) => setInlineNote(e.target.value)}
            placeholder="Add a note"
            rows={2}
            className="mt-1 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
        ) : (
          <p className={cn("mt-1 leading-relaxed", !entry.note && "text-muted-foreground")}>
            {entry.note || "No note"}
          </p>
        )}
      </div>

      {/* History */}
      <div className="mb-3 mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        History
      </div>
      <div>
        {entry.versions.map((v, i) => (
          <div key={v.version} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                  i === 0 ? "bg-foreground" : "border-2 border-muted-foreground/40 bg-background",
                )}
              />
              {i < entry.versions.length - 1 && <span className="my-1 w-0.5 flex-1 bg-border" />}
            </div>
            <div className="pb-4">
              <div className="text-sm">
                {changeLabel(v)} ·{" "}
                <span className={v.direction === "CREDIT" ? "text-emerald-600" : "text-red-600"}>
                  {formatMoney(v.amount, v.currency)}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {formatDateTimeIST(v.validFrom)} · {v.isAdmin ? "admin" : "you"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4">
        {editable ? (
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={openEdit}>
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn("flex-1", confirmDelete && "border-destructive text-destructive")}
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {confirmDelete ? "Tap to confirm" : "Delete"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/50 py-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Locked after review
          </div>
        )}
      </div>

      {/* Edit sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent>
          <SheetTitle>Edit entry</SheetTitle>
          <form onSubmit={submitEdit} className="mt-2 space-y-3">
            <div className="py-1 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-muted-foreground">{symbol}</span>
                <span
                  className={cn(
                    "text-[40px] font-extrabold leading-none tracking-tight",
                    !amount && "text-muted-foreground/40",
                  )}
                >
                  {groupAmountInput(amount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DirectionChip value={direction} onChange={setDirection} className="flex-1 justify-center" />
              <DateChipField value={date} onChange={setDate} max={new Date()} className="flex-1 justify-center" />
            </div>
            <NoteField value={note} onChange={setNote} />

            <NumberPad value={amount} onChange={setAmount} />

            <Button
              type="submit"
              size="lg"
              variant={eGave ? "default" : "destructive"}
              disabled={!amount}
              className="w-full"
            >
              Save changes
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
