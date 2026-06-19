/**
 * Dev-only auth bypass.
 *
 * When `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` (and we're NOT in a production build),
 * the app skips Clerk entirely and acts as a fixed, seeded local user. This lets
 * you work fully on localhost without Clerk's dev-browser handshake bouncing the
 * browser to `*.accounts.dev` (which the localhost-only preview can't follow).
 *
 * Hard-gated by NODE_ENV so it can NEVER activate in a production build, even if
 * the env var is set by mistake.
 */
export const DEV_AUTH_BYPASS =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

/**
 * The fake user used while the bypass is on. The id matches the seed script's
 * default (`prisma/seed.ts`), so `pnpm db:seed` data shows up immediately.
 */
export const DEV_USER = {
  id: "user_demo_seed",
  email: "dev@local.test",
  firstName: "Dev",
  lastName: "User",
} as const;

/**
 * Roles granted to the dev user while the bypass is on. Set via
 * `NEXT_PUBLIC_DEV_ROLES` (comma-separated, e.g. "admin,ops"). Required because
 * the bypass disables Clerk entirely, so there are no real session claims to
 * read roles from. Empty when unset → dev user is a plain user.
 */
export const DEV_ROLES: string[] = (process.env.NEXT_PUBLIC_DEV_ROLES ?? "")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);
