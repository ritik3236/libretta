/**
 * Filter model for the admin Entries table — the "operator-pill" pattern.
 *
 * Every field is always visible in the grid and embeds its operator as a small
 * left-hand <select> pill inside the input border, then the value editor.
 *
 * URL encoding: each field stores its value under `<key>` and its operator
 * under the sibling key `<key>__op`. e.g.
 *   ?customer=Cello&customer__op=like&status=PENDING,APPROVED&status__op=in
 * Sorting: ?sort=<key>&order=asc|desc.
 */

export type FieldType = "string" | "number" | "date" | "enum";

export type FilterOp =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "not_like"
  | "in"
  | "not_in"
  | "between"
  | "is_null"
  | "not_null";

export type Filter = { field: string; op: FilterOp; value: string };

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  nullable?: boolean;
  sortable?: boolean;
  /** Options are supplied at runtime (e.g. users / currencies from the DB). */
  dynamic?: boolean;
  options?: { value: string; label: string }[];
};

export const OPERATOR_META: Record<FilterOp, { symbol: string; label: string }> = {
  eq: { symbol: "=", label: "equals" },
  neq: { symbol: "≠", label: "not equals" },
  like: { symbol: "~", label: "contains" },
  not_like: { symbol: "!~", label: "excludes" },
  gt: { symbol: ">", label: "greater than" },
  gte: { symbol: "≥", label: "at least" },
  lt: { symbol: "<", label: "less than" },
  lte: { symbol: "≤", label: "at most" },
  in: { symbol: "∈", label: "any of" },
  not_in: { symbol: "∉", label: "not any of" },
  between: { symbol: "⇿", label: "between" },
  is_null: { symbol: "∅", label: "empty" },
  not_null: { symbol: "∗", label: "not empty" },
};

/** Operators that take no value. */
export const NO_VALUE_OPS: FilterOp[] = ["is_null", "not_null"];
/** Operators whose value is a comma list of option codes. */
export const MULTI_OPS: FilterOp[] = ["in", "not_in"];
/** Operators whose value is "start,end". */
export const RANGE_OPS: FilterOp[] = ["between"];

export const FIELDS: FieldDef[] = [
  { key: "user", label: "User", type: "enum", dynamic: true },
  { key: "customer", label: "Bank", type: "string" },
  {
    key: "direction",
    label: "Type",
    type: "enum",
    options: [
      { value: "CREDIT", label: "gave" },
      { value: "DEBIT", label: "got" },
    ],
  },
  { key: "amount", label: "Amount", type: "number", sortable: true },
  {
    key: "status",
    label: "Status",
    type: "enum",
    options: [
      { value: "PENDING", label: "Pending" },
      { value: "APPROVED", label: "Approved" },
      { value: "REJECTED", label: "Rejected" },
      { value: "ARCHIVED", label: "Archived" },
    ],
  },
  { key: "version", label: "Version", type: "number", sortable: true },
  { key: "currency", label: "Currency", type: "enum", dynamic: true },
  { key: "note", label: "Note", type: "string", nullable: true },
  // Date last, always.
  { key: "occurredAt", label: "Date", type: "date", sortable: true },
];

/** Extra sortable keys not backed by a filter field. */
export const SORT_FIELDS: { key: string; label: string }[] = [
  { key: "updatedAt", label: "Last updated" },
  ...FIELDS.filter((f) => f.sortable).map((f) => ({ key: f.key, label: f.label })),
];

export function opsForField(def: FieldDef): FilterOp[] {
  let ops: FilterOp[];
  switch (def.type) {
    case "enum":
      ops = ["in", "not_in"];
      break;
    case "number":
      ops = ["eq", "neq", "gte", "gt", "lte", "lt"];
      break;
    case "date":
      ops = ["between", "eq", "gte", "gt", "lte", "lt"];
      break;
    default:
      ops = ["like", "not_like", "eq", "neq"];
  }
  if (def.nullable) ops = [...ops, "is_null", "not_null"];
  return ops;
}

export function fieldDef(key: string): FieldDef | undefined {
  return FIELDS.find((f) => f.key === key);
}

type SP = Record<string, string | string[] | undefined>;
const first = (sp: SP, k: string): string | undefined => {
  const v = sp[k];
  return Array.isArray(v) ? v[0] : v;
};

/** Parse search params into active filters (one per field). */
export function parseFilters(sp: SP): Filter[] {
  const out: Filter[] = [];
  for (const def of FIELDS) {
    const allowed = opsForField(def);
    const opRaw = first(sp, `${def.key}__op`) as FilterOp | undefined;
    const op = opRaw && allowed.includes(opRaw) ? opRaw : allowed[0];
    const value = first(sp, def.key) ?? "";
    if (NO_VALUE_OPS.includes(op)) {
      // only active if explicitly chosen via __op
      if (opRaw === op) out.push({ field: def.key, op, value: "" });
      continue;
    }
    if (value.trim() === "") continue;
    out.push({ field: def.key, op, value });
  }
  return out;
}

export function parseSort(sp: SP): { sort: string; order: "asc" | "desc" } {
  const sort = first(sp, "sort") ?? "updatedAt";
  const order = first(sp, "order") === "asc" ? "asc" : "desc";
  const valid = SORT_FIELDS.some((f) => f.key === sort) ? sort : "updatedAt";
  return { sort: valid, order };
}

/** Build the URLSearchParams query for a set of filters + sort. */
export function buildQuery(
  filters: Filter[],
  sort?: { sort: string; order: "asc" | "desc" },
): URLSearchParams {
  const params = new URLSearchParams();
  for (const f of filters) {
    if (NO_VALUE_OPS.includes(f.op)) {
      params.set(`${f.field}__op`, f.op);
    } else if (f.value.trim() !== "") {
      params.set(f.field, f.value);
      params.set(`${f.field}__op`, f.op);
    }
  }
  if (sort && (sort.sort !== "updatedAt" || sort.order !== "desc")) {
    params.set("sort", sort.sort);
    params.set("order", sort.order);
  }
  return params;
}

/** Human summary of a filter set, e.g. "Bank ~ Cello · Status ∈ PENDING, APPROVED". */
export function summarize(filters: Filter[]): string {
  if (filters.length === 0) return "No filters";
  return filters
    .map((f) => {
      const def = fieldDef(f.field);
      const sym = OPERATOR_META[f.op].symbol;
      if (NO_VALUE_OPS.includes(f.op)) return `${def?.label} ${OPERATOR_META[f.op].label}`;
      let v = f.value;
      if (MULTI_OPS.includes(f.op) && def?.options) {
        v = f.value
          .split(",")
          .map((code) => def.options!.find((o) => o.value === code)?.label ?? code)
          .join(", ");
      } else if (def?.type === "enum" && def.options) {
        v = def.options.find((o) => o.value === f.value)?.label ?? f.value;
      }
      return `${def?.label} ${sym} ${v}`;
    })
    .join(" · ");
}
