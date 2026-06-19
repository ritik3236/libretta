import { requireUser } from "@/server/auth";
import { listCustomers } from "@/server/queries/customers";
import { getCurrencies } from "@/server/queries/currencies";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { BottomNav } from "@/components/nav/BottomNav";
import { AddEntryFab } from "@/components/nav/AddEntryFab";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUser();
  // getCurrencies() also hydrates the server-side registry for this request.
  const [customers, currencies] = await Promise.all([
    listCustomers(userId),
    getCurrencies(),
  ]);

  return (
    <CurrencyProvider currencies={currencies}>
      <div className="app-shell bg-white">
        <div className="min-h-dvh pb-28">{children}</div>
        <AddEntryFab
          customers={customers.map((c) => ({ id: c.id, name: c.name, currency: c.currency }))}
        />
        <BottomNav />
      </div>
    </CurrencyProvider>
  );
}
