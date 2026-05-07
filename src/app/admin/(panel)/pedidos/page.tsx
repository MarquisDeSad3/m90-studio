import Link from "next/link";
import { desc, inArray, sql } from "drizzle-orm";
import {
  Clock3,
  Hammer,
  Package,
  PackageCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { StatCard } from "@/components/admin/ui/stat-card";
import {
  OrdersListClient,
  type OrderRow,
} from "@/components/admin/orders-list-client";
import { cn } from "@/lib/utils";

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

const TABS: { key: View; label: string; shortLabel?: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "submitted", label: "Recibidos" },
  { key: "ready", label: "Listos" },
  { key: "delivered", label: "Entregados", shortLabel: "Entreg." },
  { key: "cancelled", label: "Cancelados", shortLabel: "Canc." },
  { key: "all", label: "Todos" },
];

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view: View =
    params.view && params.view in VIEW_FILTERS
      ? (params.view as View)
      : "pending";

  const statusFilter = VIEW_FILTERS[view];

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
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
      <AdminPageHeader
        eyebrow="Pedidos"
        title="Bandeja"
        description="Pedidos que entraron desde el editor de m90.studio. Filtrá por estado, buscá por código, teléfono o modelo."
      />

      {/* Stats — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Pendientes"
          value={pendingCount}
          icon={Clock3}
          tone="blue"
        />
        <StatCard
          label="En producción"
          value={byStatus.in_production ?? 0}
          icon={Hammer}
          tone="violet"
        />
        <StatCard
          label="Listos"
          value={byStatus.ready ?? 0}
          icon={PackageCheck}
          tone="emerald"
        />
        <StatCard
          label="Entregados"
          value={byStatus.delivered ?? 0}
          icon={Package}
          tone="muted"
          hint="histórico"
        />
      </div>

      {/* Tabs filtro — scroll horizontal en mobile */}
      <div className="mt-6 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex flex-nowrap gap-2 pb-2 md:flex-wrap md:pb-0">
          {TABS.map((tab) => {
            const active = tab.key === view;
            const count = COUNT_FOR_TAB[tab.key];
            return (
              <Link
                key={tab.key}
                href={
                  tab.key === "pending"
                    ? "/admin/pedidos"
                    : `/admin/pedidos?view=${tab.key}`
                }
                scroll={false}
                className={cn(
                  "inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors md:text-[11px]",
                  active
                    ? "border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]"
                    : "border-[color:var(--color-navy)]/15 bg-white text-[color:var(--color-navy)]/70 hover:bg-[color:var(--color-navy)]/[0.04] hover:text-[color:var(--color-navy)]",
                )}
              >
                <span>{tab.shortLabel ?? tab.label}</span>
                <span
                  className={cn(
                    "inline-flex min-w-[1.4rem] justify-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                    active
                      ? "bg-[color:var(--color-cream-soft)]/20 text-[color:var(--color-cream-soft)]"
                      : "bg-[color:var(--color-navy)]/10 text-[color:var(--color-navy)]/65",
                  )}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        {total === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-[color:var(--color-navy)]/20 px-6 py-20 text-center">
            <Package className="h-8 w-8 text-[color:var(--color-navy)]/30" />
            <p className="mt-4 max-w-[40ch] text-[14px] text-[color:var(--color-navy)]/55">
              Todavía no hay pedidos. Cuando un cliente envíe el suyo desde{" "}
              <code className="mx-1 rounded bg-[color:var(--color-navy)]/8 px-1.5 py-0.5 font-mono text-[12px]">
                /disenar
              </code>{" "}
              aparece acá.
            </p>
          </div>
        ) : (
          <OrdersListClient items={rows} />
        )}
      </div>
    </div>
  );
}
