"use client";

import { createContext, useContext } from "react";
import { hydrateCurrencies, type CurrencyMeta } from "@/lib/currency";

const CurrencyContext = createContext<CurrencyMeta[]>([]);

/**
 * Hydrates the client-side currency registry. Hydration happens SYNCHRONOUSLY
 * in the render body (not in an effect) so that any child component calling
 * formatMoney / getCurrencyMeta during the same render — including SSR and the
 * first client paint — sees a populated registry. This avoids a formatting
 * flash and React hydration mismatches.
 */
export function CurrencyProvider({
  currencies,
  children,
}: {
  currencies: CurrencyMeta[];
  children: React.ReactNode;
}) {
  hydrateCurrencies(currencies);
  return (
    <CurrencyContext.Provider value={currencies}>
      {children}
    </CurrencyContext.Provider>
  );
}

/** All currencies passed to the provider. */
export function useCurrencies(): CurrencyMeta[] {
  return useContext(CurrencyContext);
}

/** Active currencies only — for pickers that prefer a hook over props. */
export function useActiveCurrencies(): CurrencyMeta[] {
  return useContext(CurrencyContext).filter((c) => c.isActive !== false);
}
