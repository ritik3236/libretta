import Link from "next/link";
import { getAdminOverview, listAuditLogs } from "@/server/queries/admin";
import { formatDateTimeIST } from "@/lib/datetime";

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboardPage() {
  const [o, logs] = await Promise.all([getAdminOverview(), listAuditLogs(8)]);
  return (
    <div className="space-y-5">
      <h1 className="text-lg font-extrabold tracking-tight">Dashboard</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Users" value={o.userCount} href="/admin/users" />
        <Stat label="Banks" value={o.customerCount} />
        <Stat label="Predefined" value={o.predefinedCount} href="/admin/banks" />
        <Stat label="Currencies" value={o.currencyCount} href="/admin/currencies" />
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-bold text-slate-700">Entries by status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Pending" value={o.byStatus.PENDING} href="/admin/entries?status=PENDING&status__op=in" />
          <Stat label="Approved" value={o.byStatus.APPROVED} href="/admin/entries?status=APPROVED&status__op=in" />
          <Stat label="Rejected" value={o.byStatus.REJECTED} href="/admin/entries?status=REJECTED&status__op=in" />
          <Stat label="Archived" value={o.byStatus.ARCHIVED} href="/admin/entries?status=ARCHIVED&status__op=in" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-slate-700">Recent activity</h2>
            <Link href="/admin/audits" className="text-[12px] font-semibold text-slate-500 hover:underline">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {logs.length === 0 && (
              <li className="p-3 text-[13px] text-slate-500">No admin activity yet.</li>
            )}
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 p-2.5 text-[13px]">
                <span className="truncate">
                  <span className="font-semibold">{l.action}</span>
                  <span className="text-slate-500"> · {l.targetType}</span>
                </span>
                <span className="whitespace-nowrap text-[11px] text-slate-500">
                  {formatDateTimeIST(l.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {o.byStatus.PENDING > 0 && (
          <div className="self-start rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="text-[13px] font-bold text-amber-800">
              {o.byStatus.PENDING} {o.byStatus.PENDING === 1 ? "entry" : "entries"} awaiting review
            </div>
            <p className="mt-1 text-[12px] text-amber-700">
              Review and approve pending entries from the Entries queue.
            </p>
            <Link
              href="/admin/entries?status=PENDING&status__op=in"
              className="mt-3 inline-block rounded-md bg-amber-600 px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              Review pending
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
