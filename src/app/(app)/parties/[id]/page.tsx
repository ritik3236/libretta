import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Phone, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { requireUser } from "@/server/auth";
import { getCustomer } from "@/server/queries/customers";
import { AppHeader } from "@/components/nav/AppHeader";
import { EntryItem } from "@/components/ledger/EntryItem";
import { CountUp } from "@/components/ledger/CountUp";
import { DeleteCustomerButton } from "@/components/ledger/DeleteCustomerButton";
import { initials } from "@/lib/utils";

export default async function CustomerLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUser();
  const customer = await getCustomer(userId, id);
  if (!customer) notFound();

  const positive = customer.balance >= 0;
  const settled = customer.balance === 0;

  return (
    <>
      <AppHeader
        backHref="/parties"
        left={
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
              {initials(customer.name)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-extrabold leading-tight tracking-tight">
                {customer.name}
              </h1>
              {customer.phone && (
                <p className="flex items-center gap-1 truncate text-[11px] leading-tight text-muted-foreground">
                  <Phone className="h-3 w-3" /> {customer.phone}
                </p>
              )}
            </div>
          </div>
        }
        right={
          <>
            <a
              href={`/statement/${customer.id}`}
              target="_blank"
              aria-label="Download statement PDF"
              className="flex h-9 w-9 items-center justify-center rounded-xl border text-foreground/70 transition hover:bg-muted active:scale-95"
            >
              <FileDown className="h-5 w-5" />
            </a>
            <DeleteCustomerButton id={customer.id} name={customer.name} />
          </>
        }
      />

      <div className="px-5 pt-4 pb-4">
        {/* Balance hero */}
        <section
          className={`rounded-3xl p-5 text-white ${
            settled ? "bg-slate-700" : positive ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          <p className="text-xs font-semibold opacity-80">
            {settled ? "All settled" : positive ? "You'll get" : "You'll give"}
          </p>
          <CountUp
            minor={Math.abs(customer.balance)}
            currency={customer.currency}
            className="mt-1 block text-[30px] font-extrabold tracking-tight"
          />
        </section>

        {/* Entries */}
        <section className="mt-5">
          <h2 className="mb-1 text-sm font-bold">Entries</h2>
          {customer.entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">No entries yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use <span className="font-semibold text-emerald-600">You gave</span> or{" "}
                <span className="font-semibold text-red-600">You got</span> below to add the first one.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {customer.entries.map((e) => (
                <EntryItem key={e.id} entry={e} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Thumb-zone dual CTA: pinned above the tab bar, direction preset → one fewer tap */}
      <div className="fixed bottom-[84px] left-1/2 z-20 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-2 gap-3 px-5">
        <Link
          href={`/entries/new?customerId=${customer.id}&direction=DEBIT`}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/30 active:scale-[.98]"
        >
          <ArrowDownLeft className="h-4 w-4" /> You got
        </Link>
        <Link
          href={`/entries/new?customerId=${customer.id}&direction=CREDIT`}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 active:scale-[.98]"
        >
          <ArrowUpRight className="h-4 w-4" /> You gave
        </Link>
      </div>
    </>
  );
}
