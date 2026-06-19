import Link from "next/link";
import { listAdminUsers } from "@/server/queries/admin";
import { AdminCard } from "@/components/admin/AdminCard";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold tracking-tight">Users</h1>
      <AdminCard>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-semibold">User</th>
              <th className="font-semibold">Base</th>
              <th className="font-semibold">Parties</th>
              <th className="font-semibold">Entries</th>
              <th className="font-semibold">Can create</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    {u.businessName || u.name || u.email}
                  </Link>
                  <div className="text-[11px] text-slate-500">{u.email}</div>
                </td>
                <td>{u.baseCurrency}</td>
                <td className="tabular-nums">{u._count.customers}</td>
                <td className="tabular-nums">{u._count.entries}</td>
                <td>
                  <span
                    className={
                      u.canCreateParties
                        ? "rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700"
                        : "rounded bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600"
                    }
                  >
                    {u.canCreateParties ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
