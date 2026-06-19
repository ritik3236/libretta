"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { EntryRow } from "./EntryRow";

type Entry = {
  id: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  note: string | null;
  occurredAt: Date;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
};

/**
 * Window-virtualized entry list — only the visible rows are mounted, so a party
 * with thousands of entries stays fast. Tapping a row opens the edit sheet.
 */
export function EntriesList({
  entries,
  onSelect,
}: {
  entries: Entry[];
  onSelect: (e: Entry) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (listRef.current) setScrollMargin(listRef.current.offsetTop);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: entries.length,
    estimateSize: () => 64,
    overscan: 8,
    scrollMargin,
  });

  return (
    <div ref={listRef} style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
      {virtualizer.getVirtualItems().map((vi) => {
        const e = entries[vi.index];
        return (
          <div
            key={e.id}
            ref={virtualizer.measureElement}
            data-index={vi.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vi.start - scrollMargin}px)`,
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(e)}
              className="block w-full border-b border-border/60 text-left transition active:bg-muted/40"
            >
              <EntryRow entry={e} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
