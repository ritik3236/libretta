import { AppHeader } from "@/components/nav/AppHeader";
import { AddCustomerForm } from "@/components/ledger/AddCustomerForm";

export default function NewCustomerPage() {
  return (
    <>
      <AppHeader title="New customer" backHref="/parties" />
      <div className="px-5 pt-4">
        <AddCustomerForm />
      </div>
    </>
  );
}
