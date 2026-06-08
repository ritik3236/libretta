import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// No marketing page: signed-in users go to the dashboard, everyone else to sign-in.
export default async function Home() {
  const { userId } = await auth();
  redirect(userId ? "/dashboard" : "/sign-in");
}
