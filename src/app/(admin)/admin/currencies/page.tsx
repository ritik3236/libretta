import { getCurrencies } from "@/server/queries/currencies";
import { CurrencyManager } from "@/components/admin/CurrencyManager";

export default async function AdminCurrenciesPage() {
  const currencies = await getCurrencies();
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold tracking-tight">Currencies</h1>
      <p className="text-[13px] text-slate-500">
        Inactive currencies are hidden from user pickers. Decimals can&apos;t change once a
        currency is in use.
      </p>
      <CurrencyManager currencies={currencies} />
    </div>
  );
}
