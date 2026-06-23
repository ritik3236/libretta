import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerLedgerLoading() {
  return (
    <>
      <div
        className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b border-border bg-background/85 px-5 backdrop-blur-md md:px-8"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-5 pt-4 md:max-w-none md:px-8 md:pt-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
