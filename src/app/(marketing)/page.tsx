import { redirect } from "next/navigation";
import { getOptionalUserId } from "@/server/auth";

// No marketing page: signed-in users go to the dashboard, everyone else to sign-in.
export default async function Home() {
  const userId = await getOptionalUserId();
  redirect(userId ? "/dashboard" : "/sign-in");
}
