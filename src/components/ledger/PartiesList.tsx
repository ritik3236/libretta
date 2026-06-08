"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CustomerCard } from "./CustomerCard";

type Party = {
  id: string;
  name: string;
  currency: string;
  balance: number;
  updatedAt: Date;
};

export function PartiesList({ customers }: { customers: Party[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(query));
  }, [customers, q]);

  return (
    <>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search parties"
          className="h-11 pl-9 text-sm"
          autoComplete="off"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No parties match “{q.trim()}”.
        </p>
      ) : (
        filtered.map((c) => <CustomerCard key={c.id} customer={c} />)
      )}
    </>
  );
}
