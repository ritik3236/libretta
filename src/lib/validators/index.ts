import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
  // Currency validity is checked against the DB catalog in the action
  // (isActiveCurrencyDB) since the supported set is now dynamic.
  currency: z.string().min(1, "Currency is required"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const entrySchema = z.object({
  customerId: z.string().min(1),
  direction: z.enum(["CREDIT", "DEBIT"]),
  amount: z.coerce.number().positive("Amount must be greater than 0").finite(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  occurredAt: z.coerce.date().optional(),
});
export type EntryInput = z.infer<typeof entrySchema>;

export const entryUpdateSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(["CREDIT", "DEBIT"]),
  amount: z.coerce.number().positive("Amount must be greater than 0").finite(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  occurredAt: z.coerce.date().optional(),
});
export type EntryUpdateInput = z.infer<typeof entryUpdateSchema>;
