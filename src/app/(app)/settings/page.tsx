import Link from "next/link";
import { Download, ShieldCheck, ShieldAlert } from "lucide-react";
import { requireUser, getAuthUserInfo, isPrivileged } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppHeader } from "@/components/nav/AppHeader";
import { AccountButton } from "@/components/nav/AccountButton";
import { ProfileForm } from "@/components/ledger/ProfileForm";

export default async function SettingsPage() {
  const userId = await requireUser();
  const [user, dbUser, admin] = await Promise.all([
    getAuthUserInfo(),
    prisma.user.findUnique({ where: { id: userId } }),
    isPrivileged(),
  ]);

  return (
    <>
      <AppHeader title="Profile" contained />

      <div className="mx-auto max-w-3xl px-5 pt-4 md:px-8 md:pt-6">
        <section className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-4">
          <AccountButton />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Account"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </section>

        <section className="mt-5">
          <ProfileForm
            businessName={dbUser?.businessName ?? ""}
            baseCurrency={dbUser?.baseCurrency ?? "INR"}
          />
        </section>

        <section className="mt-5 space-y-2">
          <a
            href="/api/export/csv"
            className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3.5 transition active:scale-[.99]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Download className="h-4 w-4 text-muted-foreground" /> Export all data (CSV)
            </span>
          </a>

          {admin && (
            <Link
              href="/admin"
              className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3.5 transition active:scale-[.99]"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" /> Admin panel
              </span>
            </Link>
          )}

          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> Your data is private to your account.
          </div>
        </section>
      </div>
    </>
  );
}
