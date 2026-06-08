import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Download, ShieldCheck } from "lucide-react";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppHeader } from "@/components/nav/AppHeader";
import { CURRENCIES } from "@/lib/currency";

export default async function SettingsPage() {
  const userId = await requireUser();
  const [user, dbUser] = await Promise.all([
    currentUser(),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  return (
    <>
      <AppHeader title="Profile" />

      <div className="px-5 pt-4">
        <section className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-4">
          <UserButton afterSignOutUrl="/" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Account"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </section>

        <section className="mt-4 space-y-2">
          <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground/80">Base currency</span>
            <span className="text-sm font-bold">
              {CURRENCIES[dbUser?.baseCurrency ?? "INR"]?.symbol ?? ""}{" "}
              {dbUser?.baseCurrency ?? "INR"}
            </span>
          </div>

          <a
            href="/api/export/csv"
            className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3.5 transition active:scale-[.99]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Download className="h-4 w-4 text-muted-foreground" /> Export all data (CSV)
            </span>
          </a>

          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> Your data is private to your account.
          </div>
        </section>
      </div>
    </>
  );
}
