import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <>
      <div
        className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/85 px-5 backdrop-blur-md md:px-8"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="mx-auto max-w-3xl px-5 pt-4 md:px-8 md:pt-6">
        <Skeleton className="h-[72px] w-full rounded-2xl" />
        <div className="mt-5 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    </>
  );
}
