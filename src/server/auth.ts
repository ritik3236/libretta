import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";
import { DEV_AUTH_BYPASS, DEV_USER, DEV_ROLES } from "@/lib/dev-auth";

/** Roles that may access the admin area. v1: any of these gets full access. */
export const PRIVILEGED_ROLES = ["admin", "ops"] as const;

/**
 * User ids we've already guaranteed a row for in this server process, so
 * `requireUser` can skip the existence round-trip on every subsequent call.
 * (A deleted user mid-process is an admin edge case; the FK guard still holds
 * because the row was ensured at least once.)
 */
const ensuredUsers = new Set<string>();

/**
 * Upserts the seeded dev user (used only when DEV_AUTH_BYPASS is on).
 * Memoized per process — the upsert runs once, not on every save.
 */
let devUserReady: Promise<string> | null = null;
function ensureDevUser(): Promise<string> {
  if (!devUserReady) {
    devUserReady = prisma.user
      .upsert({
        where: { id: DEV_USER.id },
        create: {
          id: DEV_USER.id,
          email: DEV_USER.email,
          name: `${DEV_USER.firstName} ${DEV_USER.lastName}`,
        },
        update: {},
      })
      .then(() => DEV_USER.id)
      .catch((e) => {
        devUserReady = null; // let the next call retry on failure
        throw e;
      });
  }
  return devUserReady;
}

/**
 * Resolves the Clerk userId and guarantees a matching User row exists.
 * Acts as a fallback in case the Clerk webhook hasn't synced yet.
 *
 * With DEV_AUTH_BYPASS on, returns the seeded dev user instead of calling Clerk.
 */
export async function requireUser(): Promise<string> {
  if (DEV_AUTH_BYPASS) return ensureDevUser();

  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  if (ensuredUsers.has(userId)) return userId;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    const cu = await currentUser();
    const email =
      cu?.primaryEmailAddress?.emailAddress ?? `${userId}@placeholder.local`;
    const name = cu
      ? [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null
      : null;
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email, name },
      update: {},
    });
  }
  ensuredUsers.add(userId);
  return userId;
}

export async function getOptionalUserId(): Promise<string | null> {
  if (DEV_AUTH_BYPASS) return DEV_USER.id;
  const { userId } = await auth();
  return userId;
}

/**
 * Display-only profile info for headers/settings. Returns the seeded dev user
 * when the bypass is on, otherwise the Clerk `currentUser()`.
 */
export async function getAuthUserInfo(): Promise<{
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}> {
  if (DEV_AUTH_BYPASS) {
    return {
      firstName: DEV_USER.firstName,
      lastName: DEV_USER.lastName,
      email: DEV_USER.email,
    };
  }
  const cu = await currentUser();
  return {
    firstName: cu?.firstName ?? null,
    lastName: cu?.lastName ?? null,
    email: cu?.primaryEmailAddress?.emailAddress ?? null,
  };
}

function normalizeRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((r): r is string => typeof r === "string");
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

/**
 * The current user's roles (always an array). Sourced from Clerk
 * `publicMetadata.roles`, surfaced either via session claims (`metadata.roles`)
 * or `currentUser().publicMetadata.roles`. Under the dev bypass, comes from
 * `NEXT_PUBLIC_DEV_ROLES`.
 */
export async function getRoles(): Promise<string[]> {
  if (DEV_AUTH_BYPASS) return DEV_ROLES;
  const { sessionClaims } = await auth();
  const fromClaims = normalizeRoles(
    (sessionClaims as { metadata?: { roles?: unknown } } | null)?.metadata?.roles,
  );
  if (fromClaims.length) return fromClaims;
  const cu = await currentUser();
  return normalizeRoles((cu?.publicMetadata as { roles?: unknown } | undefined)?.roles);
}

export async function hasRole(role: string): Promise<boolean> {
  return (await getRoles()).includes(role);
}

/** True if the user holds any privileged (admin-area) role. */
export async function isPrivileged(): Promise<boolean> {
  const roles = await getRoles();
  return PRIVILEGED_ROLES.some((r) => roles.includes(r));
}

/**
 * Guards admin-area code. Returns the actor's userId, or throws "FORBIDDEN" if
 * the user has none of `allowed`. Also ensures a User row exists (via
 * requireUser) so admin actions can reference the actor.
 */
export async function requireRole(
  allowed: readonly string[] = PRIVILEGED_ROLES,
): Promise<string> {
  const userId = await requireUser();
  const roles = await getRoles();
  if (!allowed.some((r) => roles.includes(r))) throw new Error("FORBIDDEN");
  return userId;
}
