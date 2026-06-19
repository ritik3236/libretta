import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { DEV_AUTH_BYPASS } from "@/lib/dev-auth";

export default function SignInPage() {
  // No Clerk in bypass mode — treat everyone as signed in.
  if (DEV_AUTH_BYPASS) redirect("/dashboard");
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <SignIn appearance={{ elements: { rootBox: "mx-auto" } }} />
    </main>
  );
}
