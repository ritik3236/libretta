"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, Search, X, Plus, Bookmark, ChevronDown } from "lucide-react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FIELDS,
  SORT_FIELDS,
  OPERATOR_META,
  NO_VALUE_OPS,
  MULTI_OPS,
  RANGE_OPS,
  opsForField,
  buildQuery,
  summarize,
  type Filter,
  type FilterOp,
  type FieldDef,
} from "@/lib/admin-filters";

type FieldState = Record<string, { op: FilterOp; value: string }>;
type Preset = { name: string; query: string };

const pill =
  "flex items-stretch overflow-hidden rounded-md border border-[var(--sb-border)] bg-[var(--sb-bg)] focus-within:border-slate-400";
const opSelect =
  "border-r border-[var(--sb-border)] bg-transparent px-1.5 text-[13px] text-[var(--sb-muted)] outline-none";
const valInput = "min-w-0 flex-1 bg-transparent px-2 py-1 text-[13px] outline-none";

const fmtYmd = (d: Date | null) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`
    : "";
const parseYmd = (s: string): Date | null => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Borderless react-select so it lives inside the operator-pill border.
type Opt = { value: string; label: string };
const rsStyles = {
  control: (b: Record<string, unknown>) => ({
    ...b,
    minHeight: 30,
    border: "none",
    boxShadow: "none",
    backgroundColor: "transparent",
  }),
  valueContainer: (b: Record<string, unknown>) => ({ ...b, padding: "0 6px" }),
  input: (b: Record<string, unknown>) => ({ ...b, margin: 0, padding: 0, fontSize: 13 }),
  placeholder: (b: Record<string, unknown>) => ({ ...b, fontSize: 13, color: "var(--sb-muted)" }),
  multiValue: (b: Record<string, unknown>) => ({ ...b, backgroundColor: "var(--sb-hover-bg)" }),
  multiValueLabel: (b: Record<string, unknown>) => ({ ...b, fontSize: 11, padding: "0 4px" }),
  indicatorsContainer: (b: Record<string, unknown>) => ({ ...b, height: 30 }),
  dropdownIndicator: (b: Record<string, unknown>) => ({ ...b, padding: 4 }),
  clearIndicator: (b: Record<string, unknown>) => ({ ...b, padding: 4 }),
  menu: (b: Record<string, unknown>) => ({ ...b, zIndex: 60, fontSize: 13 }),
};

export function AdminEntriesFilters({
  initial,
  initialSort,
  dynamicOptions = {},
}: {
  initial: Filter[];
  initialSort: { sort: string; order: "asc" | "desc" };
  /** Runtime options for dynamic enum fields (user, currency). */
  dynamicOptions?: Record<string, Opt[]>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(initial.length > 0);
  const [state, setState] = useState<FieldState>(() => initState(initial));
  const [sort, setSort] = useState(initialSort.sort);
  const [order, setOrder] = useState<"asc" | "desc">(initialSort.order);
  const [presets, setPresets] = useState<Preset[]>([]);

  const storeKey = `lb-admin-filters:${pathname}`;
  useEffect(() => {
    try {
      setPresets(JSON.parse(localStorage.getItem(storeKey) || "[]"));
    } catch {
      setPresets([]);
    }
  }, [storeKey]);

  function setOp(key: string, op: FilterOp) {
    setState((s) => {
      const prev = s[key];
      // clear the value when the editor shape changes
      const shapeChanged =
        NO_VALUE_OPS.includes(op) !== NO_VALUE_OPS.includes(prev.op) ||
        MULTI_OPS.includes(op) !== MULTI_OPS.includes(prev.op) ||
        RANGE_OPS.includes(op) !== RANGE_OPS.includes(prev.op);
      return { ...s, [key]: { op, value: shapeChanged ? "" : prev.value } };
    });
  }
  function setValue(key: string, value: string) {
    setState((s) => ({ ...s, [key]: { ...s[key], value } }));
  }

  function activeFilters(): Filter[] {
    const out: Filter[] = [];
    for (const def of FIELDS) {
      const { op, value } = state[def.key];
      if (NO_VALUE_OPS.includes(op)) out.push({ field: def.key, op, value: "" });
      else if (value.trim() !== "") out.push({ field: def.key, op, value });
    }
    return out;
  }

  function apply() {
    const params = buildQuery(activeFilters(), { sort, order });
    const s = params.toString();
    router.push(`${pathname}${s ? `?${s}` : ""}`);
  }
  function clearAll() {
    setState(initState([]));
    router.push(pathname);
  }
  function applyPreset(p: Preset) {
    router.push(`${pathname}${p.query ? `?${p.query}` : ""}`);
  }
  function saveCurrent() {
    const name = window.prompt("Name this filter set:");
    if (!name) return;
    const query = buildQuery(activeFilters(), { sort, order }).toString();
    const next = [...presets.filter((p) => p.name !== name), { name, query }];
    setPresets(next);
    localStorage.setItem(storeKey, JSON.stringify(next));
  }
  function deletePreset(name: string) {
    const next = presets.filter((p) => p.name !== name);
    setPresets(next);
    localStorage.setItem(storeKey, JSON.stringify(next));
  }

  const activeCount = initial.length;

  return (
    <div className="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-bg)] text-[var(--sb-fg)]">
      {/* Panel header — the whole bar toggles the panel */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-[var(--sb-hover-bg)]"
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-[var(--sb-muted)]" />
          Filters
          {activeCount > 0 && (
            <span className="rounded bg-[var(--sb-active-bg)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--sb-active-fg)]">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--sb-muted)] transition-transform ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="space-y-3 border-t border-[var(--sb-border)] p-3">
              {/* Saved-filters lane */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {presets.map((p) => (
                  <div
                    key={p.name}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] py-1 pl-2.5 pr-1 text-[12px]"
                    title={summarize(parseQuery(p.query))}
                  >
                    <button
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="flex items-center gap-1 font-semibold"
                    >
                      <Bookmark className="h-3 w-3 text-[var(--sb-muted)]" />
                      {p.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => deletePreset(p.name)}
                      className="grid h-5 w-5 place-items-center rounded-full text-[var(--sb-muted)] hover:bg-[var(--sb-border)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={saveCurrent}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-[var(--sb-border)] px-2.5 py-1 text-[12px] font-semibold text-[var(--sb-muted)] hover:bg-[var(--sb-hover-bg)]"
                >
                  <Plus className="h-3 w-3" /> Save current
                </button>
              </div>

              {/* Field grid */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {FIELDS.map((def) => (
                  <div key={def.key} className="space-y-1">
                    <label className="block text-[11px] font-semibold text-[var(--sb-muted)]">
                      {def.label}
                    </label>
                    <FieldInput
                      def={def}
                      options={def.dynamic ? dynamicOptions[def.key] ?? [] : def.options}
                      op={state[def.key].op}
                      value={state[def.key].value}
                      onOp={(op) => setOp(def.key, op)}
                      onValue={(v) => setValue(def.key, v)}
                    />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--sb-border)] pt-3">
                <span className="text-[11px] font-semibold text-[var(--sb-muted)]">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-md border border-[var(--sb-border)] px-2 py-1 text-[13px] outline-none"
                >
                  {SORT_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
                  className="rounded-md border border-[var(--sb-border)] px-2 py-1 text-[13px] outline-none"
                >
                  <option value="desc">↓ Desc</option>
                  <option value="asc">↑ Asc</option>
                </select>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[12px] font-semibold text-[var(--sb-muted)] hover:underline"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={apply}
                    className="flex items-center gap-1 rounded-md bg-[var(--sb-active-bg)] px-3 py-1.5 text-[12px] font-semibold text-[var(--sb-active-fg)]"
                  >
                    <Search className="h-3.5 w-3.5" /> Search
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Operator pill + value editor (switches by field type and current operator). */
function FieldInput({
  def,
  options,
  op,
  value,
  onOp,
  onValue,
}: {
  def: FieldDef;
  options?: Opt[];
  op: FilterOp;
  value: string;
  onOp: (op: FilterOp) => void;
  onValue: (v: string) => void;
}) {
  const ops = opsForField(def);
  const OpPill = (
    <select
      value={op}
      onChange={(e) => onOp(e.target.value as FilterOp)}
      title={OPERATOR_META[op].label}
      className={opSelect}
    >
      {ops.map((o) => (
        <option key={o} value={o} title={OPERATOR_META[o].label}>
          {OPERATOR_META[o].symbol}
        </option>
      ))}
    </select>
  );

  // no-value operators (is empty / is not empty)
  if (NO_VALUE_OPS.includes(op)) {
    return (
      <div className={pill}>
        {OpPill}
        <span className="flex-1 px-2 py-1 text-[12px] italic text-[var(--sb-muted)]">no value</span>
      </div>
    );
  }

  // enum + in/not_in → react-select multi
  if (MULTI_OPS.includes(op) && options) {
    const selectedCodes = value ? value.split(",") : [];
    const selectedOpts = options.filter((o) => selectedCodes.includes(o.value));
    return (
      <div className={`${pill} items-center`}>
        {OpPill}
        <Select<Opt, true>
          instanceId={`flt-${def.key}`}
          isMulti
          options={options}
          value={selectedOpts}
          onChange={(opts) => onValue(opts.map((o) => o.value).join(","))}
          styles={rsStyles}
          placeholder="any of…"
          className="flex-1"
          menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
        />
      </div>
    );
  }

  // date + between → react-datepicker range
  if (def.type === "date" && RANGE_OPS.includes(op)) {
    const [a = "", b = ""] = value.split(",");
    return (
      <div className={`${pill} items-center`}>
        {OpPill}
        <DatePicker
          selectsRange
          startDate={parseYmd(a) ?? undefined}
          endDate={parseYmd(b) ?? undefined}
          onChange={(range) => {
            const [s, e] = range as [Date | null, Date | null];
            onValue(`${fmtYmd(s)},${fmtYmd(e)}`);
          }}
          dateFormat="dd MMM yyyy"
          placeholderText="start – end"
          className={valInput}
          wrapperClassName="flex-1"
        />
      </div>
    );
  }

  // single date → react-datepicker
  if (def.type === "date") {
    return (
      <div className={`${pill} items-center`}>
        {OpPill}
        <DatePicker
          selected={parseYmd(value) ?? undefined}
          onChange={(d: Date | null) => onValue(fmtYmd(d))}
          dateFormat="dd MMM yyyy"
          placeholderText="pick a date"
          className={valInput}
          wrapperClassName="flex-1"
        />
      </div>
    );
  }

  // plain value input (text / number)
  return (
    <div className={pill}>
      {OpPill}
      <input
        type={def.type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        placeholder={def.type === "number" ? "amount" : ""}
        className={valInput}
      />
    </div>
  );
}

function initState(initial: Filter[]): FieldState {
  const s: FieldState = {};
  for (const def of FIELDS) {
    const found = initial.find((f) => f.field === def.key);
    s[def.key] = found ? { op: found.op, value: found.value } : { op: opsForField(def)[0], value: "" };
  }
  return s;
}

/** Parse a saved-preset query string into filters (for the summary tooltip). */
function parseQuery(query: string): Filter[] {
  const sp: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(query)) sp[k] = v;
  // reuse the same logic as the server by importing parseFilters would create a
  // server-only chain; inline the minimal parse here.
  const out: Filter[] = [];
  for (const def of FIELDS) {
    const op = (sp[`${def.key}__op`] as FilterOp) || opsForField(def)[0];
    if (NO_VALUE_OPS.includes(op)) {
      if (sp[`${def.key}__op`]) out.push({ field: def.key, op, value: "" });
      continue;
    }
    const value = sp[def.key];
    if (value) out.push({ field: def.key, op, value });
  }
  return out;
}
