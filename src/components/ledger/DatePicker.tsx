"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameDay,
  isSameMonth,
  isAfter,
} from "date-fns";
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Inline (in-flow) date picker — the calendar expands below the field instead
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
  const [view, setView] = useState(() => startOfMonth(value ?? new Date()));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(view)),
    end: endOfWeek(endOfMonth(view)),
  });

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
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(addMonths(view, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-bold">{format(view, "MMMM yyyy")}</div>
            <button
              type="button"
              onClick={() => setView(addMonths(view, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
            {WEEKDAYS.map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const selected = value ? isSameDay(day, value) : false;
              const disabled = max ? isAfter(day, max) : false;
              const outside = !isSameMonth(day, view);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(day);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-lg text-sm transition",
                    selected
                      ? "bg-primary font-bold text-primary-foreground"
                      : "hover:bg-muted",
                    outside && !selected && "text-muted-foreground/40",
                    disabled && "pointer-events-none opacity-30",
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
