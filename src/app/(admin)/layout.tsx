import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth";
import { getCurrencies } from "@/server/queries/currencies";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole();
  } catch {
    redirect("/dashboard");
  }
  const currencies = await getCurrencies();

  return (
    <CurrencyProvider currencies={currencies}>
      <div className="admin-shell bg-slate-50 text-slate-900">
        <aside className="hidden border-r border-slate-200 bg-white sm:block">
          <div className="px-4 py-4">
            <span className="text-sm font-extrabold tracking-tight">Libretta Admin</span>
          </div>
          <AdminNav />
        </aside>
        <main className="min-w-0 p-5">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </CurrencyProvider>
  );
}
