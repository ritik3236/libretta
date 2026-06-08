"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mb-6 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white print:hidden"
    >
      <Printer className="h-4 w-4" /> Save as PDF / Print
    </button>
  );
}
