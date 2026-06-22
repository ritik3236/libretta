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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Month grid + month navigation. Selection is controlled by the caller
 * (`value`/`onChange`); only the visible month is local state. Used inline by
 * DatePicker and inside a popover by the entry chips.
 */
export function Calendar({
  value,
  onChange,
  max,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  max?: Date;
}) {
  const [view, setView] = useState(() => startOfMonth(value ?? new Date()));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(view)),
    end: endOfWeek(endOfMonth(view)),
  });

  return (
    <div>
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
              onClick={() => onChange(day)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-sm transition",
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
  );
}
