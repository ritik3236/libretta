import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Unified sticky app header — fixed height, bottom border, safe-area aware.
 * Used on every screen for a consistent top bar.
 */
export function AppHeader({
  title,
  subtitle,
  backHref,
  left,
  right,
  className,
}: {
  title?: string;
  subtitle?: string;
  backHref?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md",
        className,
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center gap-2.5 px-5">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-foreground/70 transition hover:bg-muted active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}

        {left ?? (
          <div className="min-w-0">
            {title && (
              <h1 className="truncate text-base font-extrabold leading-tight tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {right && <div className="ml-auto flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
