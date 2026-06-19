import { redirect } from "next/navigation";
import { requireRole, getAuthUserInfo } from "@/server/auth";
import { getCurrencies } from "@/server/queries/currencies";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminSidebarFooter } from "@/components/admin/AdminSidebarFooter";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole();
  } catch {
    redirect("/dashboard");
  }
  const [currencies, account] = await Promise.all([getCurrencies(), getAuthUserInfo()]);
  const accountName = [account.firstName, account.lastName].filter(Boolean).join(" ") || null;

  return (
    <CurrencyProvider currencies={currencies}>
      <div className="admin-shell bg-slate-50 text-slate-900">
        <aside className="hidden border-r border-slate-200 bg-white sm:flex sm:flex-col">
          <div className="px-4 py-4">
            <span className="text-sm font-extrabold tracking-tight">Libretta Admin</span>
          </div>
          <AdminNav />
          <AdminSidebarFooter name={accountName} email={account.email} />
        </aside>
        <main className="min-w-0 p-5">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </CurrencyProvider>
  );
}
