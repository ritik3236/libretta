"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { appConfig } from "@/lib/app-config";
import { AccountButton } from "@/components/nav/AccountButton";
import { AddEntrySheet, type CustomerOpt } from "@/components/ledger/AddEntrySheet";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/banks", label: "Banks", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Profile", icon: User },
];

/**
 * Desktop-only left navigation rail — the wide-screen counterpart to
 * {@link BottomNav}. Carries the brand, the shared add-entry control, the same
 * four destinations, and the account button. Hidden below md (mobile keeps the
 * bottom tab bar).
 */
export function SideNav({ customers }: { customers: CustomerOpt[] }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-30 hidden h-dvh flex-col border-r border-border bg-background px-3 py-4 md:flex">
      <div className="px-2 pb-4">
        <Link href="/dashboard" className="text-lg font-extrabold tracking-tight">
          {appConfig.name}
        </Link>
      </div>

      <div className="px-1 pb-3">
        <AddEntrySheet customers={customers} variant="rail" />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-border px-2 pt-3">
        <AccountButton />
        <span className="truncate text-xs font-medium text-muted-foreground">Account</span>
      </div>
    </aside>
  );
}
