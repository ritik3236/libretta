import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

type ClerkEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string | null;
    last_name?: string | null;
  };
};

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("CLERK_WEBHOOK_SECRET not configured", { status: 500 });
  }

  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  let evt: ClerkEvent;
  try {
    evt = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;

  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses?.[0]?.email_address ?? `${data.id}@placeholder.local`;
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;
    await prisma.user.upsert({
      where: { id: data.id },
      create: { id: data.id, email, name },
      update: { email, name },
    });
  } else if (type === "user.deleted") {
    await prisma.user.delete({ where: { id: data.id } }).catch(() => {});
  }

  return new Response("ok", { status: 200 });
}
