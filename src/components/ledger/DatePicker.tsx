"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "./Calendar";

/**
 * Inline (in-flow) date field — the calendar expands below the trigger instead
 * of floating in a portal, so it never drops off-screen inside a scrollable
 * bottom sheet on mobile.
 */
export function DatePicker({
  value,
  onChange,
  max,
  placeholder = "Select date",
  className,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  max?: Date;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center gap-2 rounded-xl border border-input bg-background px-4 text-left text-base shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
          className,
        )}
      >
        <CalIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value ? format(value, "d MMM yyyy") : placeholder}
        </span>
      </button>

      {open && (
        <div className="mt-1.5 rounded-xl border bg-popover p-3 shadow-sm">
          <Calendar
            value={value}
            max={max}
            onChange={(d) => {
              onChange(d);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
