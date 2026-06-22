import "server-only";
import { EntryStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { istDayStartUTC, istDayEndUTC } from "@/lib/datetime";
import type { Filter } from "@/lib/admin-filters";

/** String column ops → Prisma StringFilter (like/not_like/eq/neq + null). */
function stringOp(op: string, v: string): Prisma.StringFilter | string | null {
  switch (op) {
    case "like":
      return { contains: v };
    case "not_like":
      return { not: { contains: v } };
    case "eq":
      return v;
    case "neq":
      return { not: v };
    default:
      return null;
  }
}

/** Maps a single advanced filter to a Prisma EntryWhereInput fragment. */
function filterToWhere(f: Filter): Prisma.EntryWhereInput | null {
  const v = f.value;
  switch (f.field) {
    case "occurredAt": {
      if (f.op === "between") {
        const [a, b] = v.split(",");
        if (!a || !b) return null;
        return { occurredAt: { gte: istDayStartUTC(a), lte: istDayEndUTC(b) } };
      }
      if (f.op === "eq") return { occurredAt: { gte: istDayStartUTC(v), lte: istDayEndUTC(v) } };
      if (f.op === "gte") return { occurredAt: { gte: istDayStartUTC(v) } };
      if (f.op === "lte") return { occurredAt: { lte: istDayEndUTC(v) } };
      if (f.op === "gt") return { occurredAt: { gt: istDayEndUTC(v) } };
      if (f.op === "lt") return { occurredAt: { lt: istDayStartUTC(v) } };
      return null;
    }
    case "amount": {
      if (Number.isNaN(Number(v))) return null;
      const minor = BigInt(Math.round(Number(v) * 100)); // major → minor (2dp)
      const map: Record<string, Prisma.BigIntFilter> = {
        eq: { equals: minor },
        neq: { not: minor },
        gt: { gt: minor },
        gte: { gte: minor },
        lt: { lt: minor },
        lte: { lte: minor },
      };
      return map[f.op] ? { amountMinor: map[f.op] } : null;
    }
    case "version": {
      const n = Number(v);
      if (Number.isNaN(n)) return null;
      const map: Record<string, Prisma.IntFilter> = {
        eq: { equals: n },
        neq: { not: n },
        gt: { gt: n },
        gte: { gte: n },
        lt: { lt: n },
        lte: { lte: n },
      };
      return map[f.op] ? { version: map[f.op] } : null;
    }
    case "direction": {
      const codes = v.split(",").filter(Boolean) as Prisma.EnumDirectionFilter["in"];
      if (!codes || codes.length === 0) return null;
      if (f.op === "in") return { direction: { in: codes } };
      if (f.op === "not_in") return { direction: { notIn: codes } };
      return null;
    }
    case "status": {
      const codes = v.split(",").filter(Boolean) as EntryStatus[];
      if (codes.length === 0) return null;
      if (f.op === "in") return { status: { in: codes } };
      if (f.op === "not_in") return { status: { notIn: codes } };
      return null;
    }
    case "currency": {
      const codes = v.split(",").filter(Boolean);
      if (codes.length === 0) return null;
      if (f.op === "in") return { currency: { in: codes } };
      if (f.op === "not_in") return { currency: { notIn: codes } };
      return null;
    }
    case "note": {
      if (f.op === "is_null") return { note: null };
      if (f.op === "not_null") return { note: { not: null } };
      const c = stringOp(f.op, v);
      return c === null ? null : { note: c };
    }
    case "customer": {
      const c = stringOp(f.op, v);
      return c === null ? null : { customer: { name: c } };
    }
    case "user": {
      const ids = v.split(",").filter(Boolean);
      if (ids.length === 0) return null;
      if (f.op === "in") return { userId: { in: ids } };
      if (f.op === "not_in") return { userId: { notIn: ids } };
      return null;
    }
    default:
      return null;
  }
}

/** Combines advanced filters into a single AND'd EntryWhereInput. */
export function buildEntryWhere(filters: Filter[]): Prisma.EntryWhereInput {
  const frags = filters.map(filterToWhere).filter(Boolean) as Prisma.EntryWhereInput[];
  return frags.length ? { AND: frags } : {};
}

export async function getAdminOverview() {
  const [userCount, customerCount, predefinedCount, statusGroups, currencyCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.predefinedBank.count(),
      prisma.entry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.currency.count(),
    ]);

  const byStatus: Record<string, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  };
  for (const g of statusGroups) byStatus[g.status] = g._count._all;

  return { userCount, customerCount, predefinedCount, currencyCount, byStatus };
}

export async function listAdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      businessName: true,
      baseCurrency: true,
      canCreateBanks: true,
      createdAt: true,
      _count: { select: { customers: true, entries: true } },
    },
  });
  return users;
}

export async function getAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      businessName: true,
      baseCurrency: true,
      canCreateBanks: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const [customers, predefined] = await Promise.all([
    prisma.customer.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        currency: true,
        balanceMinor: true,
        sourcePredefinedId: true,
      },
    }),
    prisma.predefinedBank.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const assignedIds = new Set(
    customers.map((c) => c.sourcePredefinedId).filter(Boolean) as string[],
  );

  return {
    user,
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      currency: c.currency,
      balance: Number(c.balanceMinor),
      fromPredefined: !!c.sourcePredefinedId,
    })),
    // catalog banks not yet assigned to this user
    assignable: predefined.filter((p) => !assignedIds.has(p.id)),
  };
}

export type AdminEntryRow = {
  id: string;
  userId: string;
  userLabel: string;
  customerName: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  note: string | null;
  status: EntryStatus;
  version: number;
  occurredAt: Date;
  updatedAt: Date;
};

export const PAGE_SIZES = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

export function clampPageSize(n: number | undefined): number {
  return PAGE_SIZES.includes(n as (typeof PAGE_SIZES)[number]) ? (n as number) : DEFAULT_PAGE_SIZE;
}

// Map a sort key to the Prisma orderBy column.
const SORT_COLUMN: Record<string, keyof Prisma.EntryOrderByWithRelationInput> = {
  updatedAt: "updatedAt",
  occurredAt: "occurredAt",
  amount: "amountMinor",
  version: "version",
};

function adminEntriesOrderBy(
  sort?: string,
  order?: "asc" | "desc",
): Prisma.EntryOrderByWithRelationInput {
  const column = SORT_COLUMN[sort ?? "updatedAt"] ?? "updatedAt";
  return { [column]: order ?? "desc" } as Prisma.EntryOrderByWithRelationInput;
}

const entryInclude = {
  customer: { select: { name: true } },
  user: { select: { email: true, businessName: true } },
} as const;

export async function listAdminEntries(opts: {
  page?: number;
  pageSize?: number;
  filters?: Filter[];
  sort?: string;
  order?: "asc" | "desc";
}): Promise<{ rows: AdminEntryRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = clampPageSize(opts.pageSize);
  const page = Math.max(1, opts.page ?? 1);
  const where = buildEntryWhere(opts.filters ?? []);
  const orderBy = adminEntriesOrderBy(opts.sort, opts.order);

  const [rows, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: entryInclude,
    }),
    prisma.entry.count({ where }),
  ]);

  return {
    page,
    pageSize,
    total,
    rows: rows.map((e) => ({
      id: e.id,
      userId: e.userId,
      userLabel: e.user.businessName || e.user.email,
      customerName: e.customer.name,
      direction: e.direction,
      amount: Number(e.amountMinor),
      currency: e.currency,
      note: e.note,
      status: e.status,
      version: e.version,
      occurredAt: e.occurredAt,
      updatedAt: e.updatedAt,
    })),
  };
}

/** All entries matching the current filters/sort (no pagination), for CSV export. */
export async function getAdminEntriesForExport(opts: {
  filters?: Filter[];
  sort?: string;
  order?: "asc" | "desc";
}) {
  return prisma.entry.findMany({
    where: buildEntryWhere(opts.filters ?? []),
    orderBy: adminEntriesOrderBy(opts.sort, opts.order),
    include: entryInclude,
    take: 10000, // safety cap
  });
}

export type AdminEntryVersion = {
  version: number;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  note: string | null;
  status: EntryStatus;
  changeType: string;
  changedById: string;
  isAdmin: boolean;
  occurredAt: Date;
  validFrom: Date;
  validTo: Date | null;
};

export async function getEntryVersions(entryId: string): Promise<AdminEntryVersion[]> {
  const versions = await prisma.entryVersion.findMany({
    where: { entryId },
    orderBy: { version: "desc" },
  });
  return versions.map((v) => ({
    version: v.version,
    direction: v.direction,
    amount: Number(v.amountMinor),
    currency: v.currency,
    note: v.note,
    status: v.status,
    changeType: v.changeType,
    changedById: v.changedById,
    isAdmin: v.isAdmin,
    occurredAt: v.occurredAt,
    validFrom: v.validFrom,
    validTo: v.validTo,
  }));
}

export async function listAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listPredefinedBanks() {
  return prisma.predefinedBank.findMany({ orderBy: { createdAt: "desc" } });
}
