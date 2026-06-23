import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <>
      <div
        className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/85 px-5 backdrop-blur-md md:px-8"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="mx-auto max-w-3xl space-y-5 px-5 pt-4 md:px-8 md:pt-6">
        <Skeleton className="h-9 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-3xl" />
        <div className="space-y-3 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
