"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProfile } from "@/server/actions/profile";
import { useActiveCurrencies } from "@/components/providers/CurrencyProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProfileForm({
  businessName,
  baseCurrency,
}: {
  businessName: string;
  baseCurrency: string;
}) {
  const router = useRouter();
  const currencies = useActiveCurrencies();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(businessName);
  const [currency, setCurrency] = useState(baseCurrency);

  const dirty = name !== businessName || currency !== baseCurrency;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile({ businessName: name, baseCurrency: currency });
      if (res.ok) {
        toast.success("Profile saved");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="biz">Business name</Label>
        <Input
          id="biz"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ritik's Store"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Base currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          Used for the dashboard totals and as the default for new banks.
        </p>
      </div>

      <Button type="submit" disabled={pending || !dirty} className="w-full">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
