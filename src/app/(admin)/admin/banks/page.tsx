import { listPredefinedBanks } from "@/server/queries/admin";
import { PredefinedBankManager } from "@/components/admin/PredefinedBankManager";

export default async function AdminBanksPage() {
  const banks = await listPredefinedBanks();
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold tracking-tight">Predefined banks</h1>
      <p className="text-[13px] text-slate-500">
        A catalog of bank templates you can assign to users from their detail page.
      </p>
      <PredefinedBankManager
        banks={banks.map((p) => ({
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
