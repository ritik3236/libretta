import { Skeleton } from "@/components/ui/skeleton";

export default function PartiesLoading() {
  return (
    <>
      <div
        className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
      <div className="space-y-3 px-5 pt-5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </>
  );
}
