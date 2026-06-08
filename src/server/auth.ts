import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

/**
 * Resolves the Clerk userId and guarantees a matching User row exists.
 * Acts as a fallback in case the Clerk webhook hasn't synced yet.
 */
export async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");

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
  return userId;
}

export async function getOptionalUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
