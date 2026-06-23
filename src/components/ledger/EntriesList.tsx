"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { EntryRow } from "./EntryRow";
import { formatMoney } from "@/lib/money";
import { formatDateTimeShortIST } from "@/lib/datetime";
import { statusMeta, type EntryStatus } from "@/lib/entry-status";
import { cn } from "@/lib/utils";

type Entry = {
  id: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  note: string | null;
  occurredAt: Date;
  status: EntryStatus;
};

/** True once the viewport is desktop-width. Starts false (mobile-first SSR). */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}

/**
 * Entries list. Mobile: window-virtualized cards (note-headline). Desktop: a
 * full-width statement table (Date · Note · Status · Amount) where notes get a
 * generous column and wrap freely. Both link a row to its detail page; optimistic
 * rows (tmp- ids) render inert until the save confirms.
 */
export function EntriesList({
  entries,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: {
  entries: Entry[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const isDesktop = useIsDesktop();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Pull the next page when a sentinel below the list nears the viewport.
  // The 600px rootMargin prefetches before the user actually hits the bottom.
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (obs) => {
        if (obs[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onLoadMore, hasMore]);

  return (
    <>
      {isDesktop ? <EntriesTable entries={entries} /> : <EntriesCards entries={entries} />}
      {hasMore && <div ref={sentinelRef} aria-hidden className="h-px" />}
      {loadingMore && (
        <div className="py-4 text-center text-xs text-muted-foreground">Loading more…</div>
      )}
    </>
  );
}

function EntriesTable({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  return (
    <table className="w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <th className="whitespace-nowrap border-b py-2 pr-4 font-medium">Date</th>
          <th className="w-full border-b py-2 pr-4 font-medium">Note</th>
          <th className="whitespace-nowrap border-b py-2 pr-4 font-medium">Status</th>
          <th className="whitespace-nowrap border-b py-2 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => {
          const gave = e.direction === "CREDIT";
          const sm = statusMeta(e.status);
          const pending = e.id.startsWith("tmp-");
          return (
            <tr
              key={e.id}
              onClick={pending ? undefined : () => router.push(`/entries/${e.id}`)}
              className={cn(
                "border-b border-border/50 align-top transition",
                pending ? "opacity-60" : "cursor-pointer hover:bg-muted/40",
              )}
            >
              <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                {formatDateTimeShortIST(e.occurredAt)}
              </td>
              <td className="py-3 pr-4">
                <span className={cn("break-words", e.note ? "text-slate-800" : "text-slate-400")}>
                  {e.note || "No note"}
                </span>
              </td>
              <td className="whitespace-nowrap py-3 pr-4">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className={cn("h-1.5 w-1.5 rounded-full", sm.dot)} aria-hidden />
                  {sm.label}
                </span>
              </td>
              <td
                className={cn(
                  "whitespace-nowrap py-3 text-right font-extrabold tabular-nums",
                  gave ? "text-emerald-600" : "text-red-600",
                )}
              >
                {gave ? "+" : "−"}
                {formatMoney(e.amount, e.currency)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function EntriesCards({ entries }: { entries: Entry[] }) {
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
    estimateSize: () => 72,
    overscan: 8,
    scrollMargin,
  });

  return (
    <div ref={listRef} style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
      {virtualizer.getVirtualItems().map((vi) => {
        const e = entries[vi.index];
        const pending = e.id.startsWith("tmp-");
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
            {pending ? (
              <div className="block w-full border-b border-border/60 opacity-60">
                <EntryRow entry={e} />
              </div>
            ) : (
              <Link
                href={`/entries/${e.id}`}
                className="block w-full border-b border-border/60 text-left transition active:bg-muted/40"
              >
                <EntryRow entry={e} />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
