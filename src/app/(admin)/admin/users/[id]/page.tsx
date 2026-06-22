import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/server/queries/admin";
import { UserDetailClient } from "@/components/admin/UserDetailClient";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminUser(id);
  if (!data) notFound();
  const { user, customers, assignable } = data;

  return (
    <div className="space-y-4">
      <Link href="/admin/users" className="text-[12px] font-semibold text-slate-500 hover:underline">
        ← Users
      </Link>
      <div>
        <h1 className="text-lg font-extrabold tracking-tight">
          {user.businessName || user.name || user.email}
        </h1>
        <p className="text-[12px] text-slate-500">
          {user.email} · base {user.baseCurrency}
        </p>
      </div>
      <UserDetailClient
        userId={user.id}
        canCreateBanks={user.canCreateBanks}
        customers={customers}
        assignable={assignable.map((p) => ({ id: p.id, name: p.name, currency: p.currency }))}
      />
    </div>
  );
}
