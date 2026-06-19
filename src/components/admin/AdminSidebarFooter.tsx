"use client";

import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { ArrowLeft, LogOut } from "lucide-react";
import { DEV_AUTH_BYPASS } from "@/lib/dev-auth";

/**
 * Pinned to the bottom of the admin sidebar: a link back to the user app plus
 * the account identity and sign-out. In dev-bypass mode Clerk isn't mounted, so
 * we show a static note instead of <SignOutButton> (mirrors AccountButton).
 */
export function AdminSidebarFooter({
  name,
  email,
}: {
  name: string | null;
  email: string | null;
}) {
  const initial = (name ?? email ?? "D").charAt(0).toUpperCase();

  return (
    <div className="mt-auto space-y-1 border-t border-slate-200 px-2 py-3">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to app
      </Link>

      <div className="flex items-center gap-2 px-3 pt-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-700">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-slate-900">{name ?? "Account"}</div>
          {email && <div className="truncate text-[11px] text-slate-500">{email}</div>}
        </div>
      </div>

      {DEV_AUTH_BYPASS ? (
        <p className="px-3 pt-1 text-[11px] text-slate-400">Dev mode — auth bypassed</p>
      ) : (
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </SignOutButton>
      )}
    </div>
  );
}
