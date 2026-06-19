import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { DEV_AUTH_BYPASS } from "@/lib/dev-auth";

export default function SignUpPage() {
  // No Clerk in bypass mode — treat everyone as signed in.
  if (DEV_AUTH_BYPASS) redirect("/dashboard");
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <SignUp appearance={{ elements: { rootBox: "mx-auto" } }} />
    </main>
  );
}
