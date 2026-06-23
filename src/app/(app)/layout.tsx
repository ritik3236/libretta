import { requireUser } from "@/server/auth";
import { listCustomers } from "@/server/queries/customers";
import { getCurrencies } from "@/server/queries/currencies";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { PendingEntriesProvider } from "@/components/providers/PendingEntriesProvider";
import { BottomNav } from "@/components/nav/BottomNav";
import { SideNav } from "@/components/nav/SideNav";
import { AddEntryFab } from "@/components/nav/AddEntryFab";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUser();
  // getCurrencies() also hydrates the server-side registry for this request.
  const [customers, currencies] = await Promise.all([
    listCustomers(userId),
    getCurrencies(),
  ]);

  const customerOpts = customers.map((c) => ({
    id: c.id,
    name: c.name,
    currency: c.currency,
  }));

  return (
    <CurrencyProvider currencies={currencies}>
      <PendingEntriesProvider>
        <div className="app-shell bg-white">
          <SideNav customers={customerOpts} />
          <div className="min-w-0">
            <div className="min-h-dvh pb-28 md:pb-10">{children}</div>
          </div>
          <AddEntryFab customers={customerOpts} />
          <BottomNav />
        </div>
      </PendingEntriesProvider>
    </CurrencyProvider>
  );
}
