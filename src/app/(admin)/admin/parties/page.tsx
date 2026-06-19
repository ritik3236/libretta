import { listPredefinedParties } from "@/server/queries/admin";
import { PredefinedPartyManager } from "@/components/admin/PredefinedPartyManager";

export default async function AdminPartiesPage() {
  const parties = await listPredefinedParties();
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold tracking-tight">Predefined parties</h1>
      <p className="text-[13px] text-slate-500">
        A catalog of party templates you can assign to users from their detail page.
      </p>
      <PredefinedPartyManager
        parties={parties.map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          currency: p.currency,
          isActive: p.isActive,
        }))}
      />
    </div>
  );
}
