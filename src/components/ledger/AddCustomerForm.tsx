"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCustomer } from "@/server/actions/customers";
import { CURRENCY_LIST } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddCustomerForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    currency: "INR",
    note: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createCustomer(form);
      if (res.ok) {
        toast.success("Party added");
        router.push(`/parties/${res.id}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Party name</Label>
        <Input
          id="name"
          autoFocus
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Amit Sharma"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+91 …"
          inputMode="tel"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Ledger currency</Label>
        <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_LIST.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          rows={2}
        />
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save party"}
      </Button>
    </form>
  );
}
