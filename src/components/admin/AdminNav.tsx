"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/entries", label: "Entries" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/parties", label: "Parties" },
  { href: "/admin/currencies", label: "Currencies" },
  { href: "/admin/audits", label: "Audits" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 sm:flex-col sm:gap-0.5">
      {links.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-semibold transition",
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
