export type EntryStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

/** Display metadata for an entry status: a label, a dot bg class, and a badge class. */
export function statusMeta(status: EntryStatus): {
  label: string;
  dot: string;
  badge: string;
} {
  switch (status) {
    case "APPROVED":
      return { label: "Approved", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" };
    case "REJECTED":
      return { label: "Rejected", dot: "bg-red-500", badge: "bg-red-50 text-red-700" };
    case "ARCHIVED":
      return { label: "Deleted", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" };
    default:
      return { label: "Pending", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" };
  }
}
