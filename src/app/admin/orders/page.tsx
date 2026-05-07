import Link from "next/link";
import { desc, inArray, sql } from "drizzle-orm";
import { Package } from "lucide-react";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { Logo } from "@/components/logo";
import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  OrdersListClient,
  type OrderRow,
} from "@/components/admin/orders-list-client";

export const dynamic = "force-dynamic";

type OrderStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "in_production"
  | "ready"
  | "delivered"
  | "cancelled";

type View =
  | "pending"
  | "submitted"
  | "ready"
  | "delivered"
  | "cancelled"
  | "all";

const VIEW_FILTERS: Record<View, OrderStatus[] | null> = {
  pending: ["submitted", "confirmed", "in_production", "ready"],
  submitted: ["submitted"],
  ready: ["ready"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
  all: null,
};

const TABS: { key: View; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "submitted", label: "Recibidos" },
  { key: "ready", label: "Listos" },
  { key: "delivered", label: "Entregados" },
  { key: "cancelled", label: "Cancelados" },
  { key: "all", label: "Todos" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view: View =
    params.view && params.view in VIEW_FILTERS
      ? (params.view as View)
      : "pending";

  const me = await getCurrentAdmin();

  const statusFilter = VIEW_FILTERS[view];

  // Counts globales por estado para los badges en las tabs
  const counts = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(orders)
    .groupBy(orders.status);

  const byStatus: Partial<Record<OrderStatus, number>> = {};
  let total = 0;
  for (const c of counts) {
    byStatus[c.status as OrderStatus] = c.count;
    total += c.count;
  }
  const pendingCount =
    (byStatus.submitted ?? 0) +
    (byStatus.confirmed ?? 0) +
    (byStatus.in_production ?? 0) +
    (byStatus.ready ?? 0);

  const COUNT_FOR_TAB: Record<View, number> = {
    pending: pendingCount,
    submitted: byStatus.submitted ?? 0,
    ready: byStatus.ready ?? 0,
    delivered: byStatus.delivered ?? 0,
    cancelled: byStatus.cancelled ?? 0,
    all: total,
  };

  const list = await db
    .select({
      id: orders.id,
      code: orders.code,
      status: orders.status,
      phoneModelName: orders.phoneModelName,
      layoutName: orders.layoutName,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      submittedAt: orders.submittedAt,
      createdAt: orders.createdAt,
      coverType: orders.coverType,
      priceUsdCents: orders.priceUsdCents,
      photoCount: sql<number>`(
        SELECT count(*)::int FROM order_photos WHERE order_id = ${orders.id}
      )`.as("photo_count"),
      hasInternalNotes: sql<boolean>`(
        ${orders.adminNotes} IS NOT NULL AND length(trim(${orders.adminNotes})) > 0
      )`.as("has_internal_notes"),
    })
    .from(orders)
    .where(statusFilter ? inArray(orders.status, statusFilter) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(200);

  const rows: OrderRow[] = list.map((o) => ({
    ...o,
    coverType: (o.coverType ?? "normal") as "normal" | "coated",
    submittedAt: o.submittedAt ? o.submittedAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-[color:var(--color-paper)]">
      <header className="sticky top-0 z-30 border-b border-[color:var(--color-navy)]/10 bg-[color:var(--color-paper)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Logo variant="navy" className="text-[22px]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            {me?.role === "owner" && (
              <Link
                href="/admin/usuarios"
                className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)]"
              >
                Usuarios
              </Link>
            )}
            <Link
              href="/admin/ajustes"
              className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)]"
            >
              Ajustes
            </Link>
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)]"
              >
                Cerrar sesión {me ? `· ${me.name}` : ""}
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Pedidos
            </span>
            <h1 className="mt-2 font-display text-[clamp(36px,6vw,56px)] italic leading-tight text-[color:var(--color-navy)]">
              Bandeja de pedidos
            </h1>
          </div>
        </div>

        <StatStrip
          pending={pendingCount}
          inProduction={byStatus.in_production ?? 0}
          ready={byStatus.ready ?? 0}
          delivered={byStatus.delivered ?? 0}
        />

        <div className="mt-8 mb-5 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const active = tab.key === view;
            const count = COUNT_FOR_TAB[tab.key];
            return (
              <Link
                key={tab.key}
                href={tab.key === "pending" ? "/admin/orders" : `/admin/orders?view=${tab.key}`}
                scroll={false}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors md:text-[11px] ${
                  active
                    ? "border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]"
                    : "border-[color:var(--color-navy)]/15 bg-white text-[color:var(--color-navy)]/70 hover:bg-[color:var(--color-navy)]/[0.04] hover:text-[color:var(--color-navy)]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    active
                      ? "bg-[color:var(--color-cream-soft)]/20 text-[color:var(--color-cream-soft)]"
                      : "bg-[color:var(--color-navy)]/10 text-[color:var(--color-navy)]/65"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        {total === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-[color:var(--color-navy)]/20 px-6 py-20 text-center">
            <Package className="h-8 w-8 text-[color:var(--color-navy)]/30" />
            <p className="mt-4 max-w-[40ch] text-[14px] text-[color:var(--color-navy)]/55">
              Todavía no hay pedidos. Cuando un cliente envíe el suyo desde
              <code className="mx-1 rounded bg-[color:var(--color-navy)]/8 px-1.5 py-0.5 font-mono text-[12px]">
                /disenar
              </code>
              aparece acá.
            </p>
          </div>
        ) : (
          <OrdersListClient items={rows} />
        )}
      </section>
    </main>
  );
}

function StatStrip({
  pending,
  inProduction,
  ready,
  delivered,
}: {
  pending: number;
  inProduction: number;
  ready: number;
  delivered: number;
}) {
  const cells: { label: string; value: number; tint: string }[] = [
    { label: "Pendientes", value: pending, tint: "text-blue-700" },
    { label: "En producción", value: inProduction, tint: "text-violet-700" },
    { label: "Listos para entregar", value: ready, tint: "text-emerald-700" },
    { label: "Entregados (total)", value: delivered, tint: "text-[color:var(--color-navy)]/70" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-4"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-navy)]/55">
            {c.label}
          </div>
          <div className={`mt-1 font-mono text-[28px] font-semibold tracking-tight ${c.tint}`}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
