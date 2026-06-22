import Link from "next/link";
import { UserPlus, Landmark } from "lucide-react";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { listCustomers } from "@/server/queries/customers";
import { AppHeader } from "@/components/nav/AppHeader";
import { BanksList } from "@/components/ledger/BanksList";
import { Button } from "@/components/ui/button";

export default async function BanksPage() {
  const userId = await requireUser();
  const [customers, user] = await Promise.all([
    listCustomers(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { canCreateBanks: true } }),
  ]);
  const canCreate = user?.canCreateBanks ?? true;

  return (
    <>
      {/* Mobile: header + full list. On desktop the list lives in the rail
          (banks/layout), so this whole block is hidden there. */}
      <div className="md:hidden">
        <AppHeader
          title="Banks"
          subtitle={`${customers.length} total`}
          right={
            canCreate ? (
              <Button asChild size="sm">
                <Link href="/banks/new">
                  <UserPlus className="h-4 w-4" /> Add
                </Link>
              </Button>
            ) : undefined
          }
        />

        <div className="px-5 pt-3">
          {customers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed p-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">No banks yet</p>
              {canCreate ? (
                <Button asChild className="mt-3">
                  <Link href="/banks/new">Add your first bank</Link>
                </Button>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Your admin will assign banks to your account.
                </p>
              )}
            </div>
          ) : (
            <BanksList customers={customers} />
          )}
        </div>
      </div>

      {/* Desktop: rail handles the list — this pane prompts a selection. */}
      <div className="hidden h-dvh flex-col items-center justify-center px-6 text-center md:flex">
        <Landmark className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          {customers.length === 0 ? "No banks yet" : "Select a bank"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {customers.length === 0
            ? canCreate
              ? "Add your first bank to get started."
              : "Your admin will assign banks to your account."
            : "Choose a bank from the list to view its ledger."}
        </p>
      </div>
    </>
  );
}
