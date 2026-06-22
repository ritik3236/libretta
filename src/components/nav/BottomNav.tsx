"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Users, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/banks", label: "Banks", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background/90 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex min-h-[48px] flex-col items-center justify-center gap-1 py-1 text-[10px] font-semibold",
                active ? "text-emerald-600" : "text-slate-400",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute -top-1 h-1 w-6 rounded-full bg-emerald-600"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
