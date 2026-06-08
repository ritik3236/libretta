"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteEntry } from "@/server/actions/entries";
import { EntryRow } from "./EntryRow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { format } from "date-fns";

type Entry = {
  id: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  note: string | null;
  occurredAt: Date;
};

export function EntryItem({ entry }: { entry: Entry }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full rounded-xl text-left transition active:bg-muted/40">
          <EntryRow entry={entry} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {entry.direction === "CREDIT" ? "You gave" : "You got"}{" "}
            {formatMoney(entry.amount, entry.currency)}
          </DialogTitle>
          <DialogDescription>
            {entry.note ? `"${entry.note}" · ` : ""}
            {format(entry.occurredAt, "d MMM yyyy")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Close
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteEntry(entry.id);
                if (res.ok) toast.success("Entry deleted");
                else toast.error(res.error);
                setOpen(false);
              })
            }
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
