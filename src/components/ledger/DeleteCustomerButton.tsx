"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteCustomer } from "@/server/actions/customers";
import { ConfirmDialog } from "./ConfirmDialog";

export function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title={`Delete ${name}?`}
      description="This permanently removes the bank and all its entries. This can't be undone."
      confirmLabel="Delete bank"
      onConfirm={async () => {
        const res = await deleteCustomer(id);
        if (res.ok) {
          toast.success("Customer deleted");
          router.replace("/banks");
        } else {
          toast.error(res.error);
        }
      }}
      trigger={
        <button
          aria-label="Delete bank"
          className="flex h-9 w-9 items-center justify-center rounded-xl border text-destructive transition hover:bg-destructive/10 active:scale-95"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      }
    />
  );
}
