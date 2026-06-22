import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { listCustomers } from "@/server/queries/customers";
import { BanksRail } from "@/components/ledger/BanksRail";

/**
 * Desktop two-pane layout for the banks section: a persistent master list (left)
 * beside the active ledger / form (right, `children`). On mobile the rail is
 * hidden and `children` renders full-screen as before.
 */
export default async function BanksLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUser();
  const [customers, user] = await Promise.all([
    listCustomers(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { canCreateBanks: true } }),
  ]);

  return (
    <div className="md:grid md:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh overflow-y-auto border-r border-border md:block">
        <BanksRail customers={customers} canCreate={user?.canCreateBanks ?? true} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
