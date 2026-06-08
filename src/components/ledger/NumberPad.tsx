"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;

/**
 * In-sheet numeric keypad for amount entry, so the OS keyboard never covers
 * the form. Enforces a single decimal point and max 2 decimal places.
 */
export function NumberPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  function press(k: string) {
    if (k === "del") {
      onChange(value.slice(0, -1));
      return;
    }
    if (k === ".") {
      if (value.includes(".")) return;
      onChange((value === "" ? "0" : value) + ".");
      return;
    }
    // digit
    if (value.includes(".")) {
      const dec = value.split(".")[1] ?? "";
      if (dec.length >= 2) return;
    }
    if (value === "0") {
      onChange(k);
      return;
    }
    if (value.replace(".", "").length >= 12) return; // sane upper bound
    onChange(value + k);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => press(k)}
          className={cn(
            "flex h-14 items-center justify-center rounded-xl bg-muted text-xl font-semibold transition active:scale-95 active:bg-muted/70",
            k === "del" && "text-muted-foreground",
          )}
          aria-label={k === "del" ? "Delete" : k}
        >
          {k === "del" ? <Delete className="h-5 w-5" /> : k}
        </button>
      ))}
    </div>
  );
}
