"use client";

import { UserButton } from "@clerk/nextjs";
import { DEV_AUTH_BYPASS } from "@/lib/dev-auth";

/**
 * Account avatar in the header. Renders Clerk's <UserButton> normally, but a
 * static placeholder when the dev bypass is on (UserButton requires
 * <ClerkProvider>, which we don't mount in bypass mode).
 */
export function AccountButton() {
  if (DEV_AUTH_BYPASS) {
    return (
      <div
        title="Dev user (Clerk auth bypassed)"
        className="grid h-7 w-7 place-items-center rounded-full bg-foreground/10 text-[11px] font-bold text-foreground/70"
      >
        D
      </div>
    );
  }
  return <UserButton afterSignOutUrl="/" />;
}
