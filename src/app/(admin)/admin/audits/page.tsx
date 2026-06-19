import { listAuditLogs } from "@/server/queries/admin";
import { formatDateTimeIST } from "@/lib/datetime";
import { AdminCard } from "@/components/admin/AdminCard";

export default async function AdminAuditsPage() {
  const logs = await listAuditLogs(150);
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold tracking-tight">Audit log</h1>
      <AdminCard>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-semibold">When</th>
              <th className="font-semibold">Action</th>
              <th className="font-semibold">Target</th>
              <th className="font-semibold">Actor</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-slate-500">
                  No admin actions recorded yet.
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 whitespace-nowrap text-slate-500">
                  {formatDateTimeIST(l.createdAt)}
                </td>
                <td className="font-semibold">{l.action}</td>
                <td className="text-slate-600">
                  {l.targetType}
                  <span className="text-slate-500"> · {l.targetId.slice(0, 10)}</span>
                </td>
                <td className="max-w-[160px] truncate text-slate-500">{l.actorId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
