import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { listCustomers } from "@/server/queries/customers";
import { AppHeader } from "@/components/nav/AppHeader";
import { PartiesList } from "@/components/ledger/PartiesList";
import { Button } from "@/components/ui/button";

export default async function PartiesPage() {
  const userId = await requireUser();
  const [customers, user] = await Promise.all([
    listCustomers(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { canCreateParties: true } }),
  ]);
  const canCreate = user?.canCreateParties ?? true;

  return (
    <>
      <AppHeader
        title="Parties"
        subtitle={`${customers.length} total`}
        right={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/parties/new">
                <UserPlus className="h-4 w-4" /> Add
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="px-5 pt-3">
        {customers.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed p-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">No parties yet</p>
            {canCreate ? (
              <Button asChild className="mt-3">
                <Link href="/parties/new">Add your first party</Link>
              </Button>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Your admin will assign parties to your account.
              </p>
            )}
          </div>
        ) : (
          <PartiesList customers={customers} />
        )}
      </div>
    </>
  );
}
