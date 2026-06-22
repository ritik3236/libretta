import { requireUser } from "@/server/auth";
import { listCustomers } from "@/server/queries/customers";
import { AppHeader } from "@/components/nav/AppHeader";
import { AddEntryForm } from "@/components/ledger/AddEntryForm";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; direction?: string }>;
}) {
  const { customerId, direction } = await searchParams;
  const userId = await requireUser();
  const customers = await listCustomers(userId);
  const defaultDirection = direction === "DEBIT" ? "DEBIT" : "CREDIT";

  return (
    <>
      <AppHeader title="Add entry" backHref={customerId ? `/banks/${customerId}` : "/dashboard"} />
      <div className="mx-auto max-w-lg px-5 pt-4 md:pt-6">
        <AddEntryForm
          customers={customers.map((c) => ({ id: c.id, name: c.name, currency: c.currency }))}
          defaultCustomerId={customerId}
          defaultDirection={defaultDirection}
        />
      </div>
    </>
  );
}
