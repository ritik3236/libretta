import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppHeader } from "@/components/nav/AppHeader";
import { AddCustomerForm } from "@/components/ledger/AddCustomerForm";

export default async function NewCustomerPage() {
  const userId = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { canCreateBanks: true },
  });
  // Admin may have disabled self-creation for this user.
  if (!user?.canCreateBanks) redirect("/banks");

  return (
    <>
      <AppHeader title="New bank" backHref="/banks" />
      <div className="px-5 pt-4">
        <AddCustomerForm />
      </div>
    </>
  );
}
