import { notFound } from "next/navigation";
import { FileDown, Phone } from "lucide-react";
import { requireUser } from "@/server/auth";
import { getCustomer } from "@/server/queries/customers";
import { AppHeader } from "@/components/nav/AppHeader";
import { DeleteCustomerButton } from "@/components/ledger/DeleteCustomerButton";
import { CustomerLedgerClient } from "@/components/ledger/CustomerLedgerClient";
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
        <CustomerLedgerClient
          customer={{
            id: customer.id,
            name: customer.name,
            currency: customer.currency,
            balance: customer.balance,
          }}
          entries={customer.entries}
          totalGave={customer.totalGave}
          totalGot={customer.totalGot}
        />
      </div>
    </>
  );
}
