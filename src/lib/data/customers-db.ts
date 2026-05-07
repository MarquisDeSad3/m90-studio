import "server-only";
import { eq, isNotNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, orders } from "@/lib/db/schema";

export type CustomerWithStats = {
  id: string;
  phone: string;
  name: string | null;
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Computado desde orders */
  ordersCount: number;
  totalUsdCents: number;
  totalCup: number;
  firstOrderAt: Date | null;
  lastOrderAt: Date | null;
  recentCodes: string[];
};

/** Lista de clientes con sus stats (count, totals, primer/último pedido,
    códigos recientes). Cancelados NO suman al total $. */
export async function getCustomersWithStats(): Promise<CustomerWithStats[]> {
  // 1. Todos los clientes
  const custRows = await db.select().from(customers).orderBy(desc(customers.updatedAt));

  if (custRows.length === 0) return [];

  // 2. Todas las orders (1 query) — agregamos en JS por simplicidad. Para
  //    catálogos grandes se puede pasar a SQL aggregate.
  const ordRows = await db
    .select({
      phone: orders.customerPhone,
      code: orders.code,
      priceCup: orders.priceCup,
      priceUsdCents: orders.priceUsdCents,
      submittedAt: orders.submittedAt,
      createdAt: orders.createdAt,
      status: orders.status,
    })
    .from(orders)
    .where(isNotNull(orders.customerPhone))
    .orderBy(desc(orders.createdAt));

  type Agg = Pick<
    CustomerWithStats,
    | "ordersCount"
    | "totalUsdCents"
    | "totalCup"
    | "firstOrderAt"
    | "lastOrderAt"
    | "recentCodes"
  >;
  const aggByPhone = new Map<string, Agg>();
  for (const o of ordRows) {
    if (!o.phone) continue;
    const at = o.submittedAt ?? o.createdAt;
    const isCancelled = o.status === "cancelled";
    const ex = aggByPhone.get(o.phone);
    if (!ex) {
      aggByPhone.set(o.phone, {
        ordersCount: 1,
        totalUsdCents: isCancelled ? 0 : o.priceUsdCents,
        totalCup: isCancelled ? 0 : o.priceCup,
        firstOrderAt: at,
        lastOrderAt: at,
        recentCodes: [o.code],
      });
    } else {
      ex.ordersCount += 1;
      if (!isCancelled) {
        ex.totalUsdCents += o.priceUsdCents;
        ex.totalCup += o.priceCup;
      }
      if (!ex.firstOrderAt || at < ex.firstOrderAt) ex.firstOrderAt = at;
      if (!ex.lastOrderAt || at > ex.lastOrderAt) ex.lastOrderAt = at;
      if (ex.recentCodes.length < 4) ex.recentCodes.push(o.code);
    }
  }

  return custRows.map((c) => {
    const agg = aggByPhone.get(c.phone) ?? {
      ordersCount: 0,
      totalUsdCents: 0,
      totalCup: 0,
      firstOrderAt: null,
      lastOrderAt: null,
      recentCodes: [],
    };
    return {
      id: c.id,
      phone: c.phone,
      name: c.name,
      tags: c.tags,
      notes: c.notes,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      ...agg,
    };
  });
}

/** Detalle de un cliente: info + TODOS sus pedidos. */
export async function getCustomerByPhone(phone: string): Promise<{
  customer: typeof customers.$inferSelect;
  orderRows: Array<{
    id: string;
    code: string;
    status: string;
    coverType: string;
    phoneModelName: string;
    layoutName: string;
    priceCup: number;
    priceUsdCents: number;
    submittedAt: Date | null;
    createdAt: Date;
    deliveredAt: Date | null;
  }>;
} | null> {
  const [c] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .limit(1);
  if (!c) return null;

  const ordersRows = await db
    .select({
      id: orders.id,
      code: orders.code,
      status: orders.status,
      coverType: orders.coverType,
      phoneModelName: orders.phoneModelName,
      layoutName: orders.layoutName,
      priceCup: orders.priceCup,
      priceUsdCents: orders.priceUsdCents,
      submittedAt: orders.submittedAt,
      createdAt: orders.createdAt,
      deliveredAt: orders.deliveredAt,
    })
    .from(orders)
    .where(eq(orders.customerPhone, phone))
    .orderBy(desc(orders.createdAt));

  return { customer: c, orderRows: ordersRows };
}

export async function updateCustomer(
  phone: string,
  patch: { name?: string | null; tags?: string[]; notes?: string | null },
): Promise<typeof customers.$inferSelect | null> {
  const update: Partial<typeof customers.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.tags !== undefined) update.tags = patch.tags;
  if (patch.notes !== undefined) update.notes = patch.notes;

  const [updated] = await db
    .update(customers)
    .set(update)
    .where(eq(customers.phone, phone))
    .returning();
  return updated ?? null;
}

