import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppHeader } from "@/components/nav/AppHeader";
import { AddCustomerForm } from "@/components/ledger/AddCustomerForm";

export default async function NewCustomerPage() {
  const userId = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { canCreateParties: true },
  });
  // Admin may have disabled self-creation for this user.
  if (!user?.canCreateParties) redirect("/parties");

  return (
    <>
      <AppHeader title="New party" backHref="/parties" />
      <div className="px-5 pt-4">
        <AddCustomerForm />
      </div>
    </>
  );
}
