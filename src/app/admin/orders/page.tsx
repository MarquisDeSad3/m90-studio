import Link from "next/link";
import { desc } from "drizzle-orm";
import { ChevronRight, Package } from "lucide-react";
import { db } from "@/lib/db";
import { orders, orderPhotos } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const list = await db
    .select({
      id: orders.id,
      code: orders.code,
      status: orders.status,
      phoneModelName: orders.phoneModelName,
      layoutName: orders.layoutName,
      customerPhone: orders.customerPhone,
      submittedAt: orders.submittedAt,
      createdAt: orders.createdAt,
      photoCount: sql<number>`(
        SELECT count(*)::int FROM order_photos WHERE order_id = ${orders.id}
      )`.as("photo_count"),
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(200);

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
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)]"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Pedidos
            </span>
            <h1 className="mt-2 font-display text-[clamp(36px,6vw,56px)] italic leading-tight text-[color:var(--color-navy)]">
              Bandeja de pedidos
            </h1>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 md:text-[12px]">
            {list.length} {list.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>

        {list.length === 0 ? (
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
          <ul className="divide-y divide-[color:var(--color-navy)]/10 overflow-hidden rounded-3xl border border-[color:var(--color-navy)]/12 bg-white">
            {list.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.code}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[color:var(--color-navy)]/[0.02] md:px-8 md:py-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-mono text-[13px] font-semibold tracking-tight text-[color:var(--color-navy)] md:text-[14px]">
                        {o.code}
                      </span>
                      <StatusBadge status={o.status} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
                        {o.photoCount} foto{o.photoCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[13px] text-[color:var(--color-navy)]/70 md:text-[14px]">
                      {o.phoneModelName} · {o.layoutName}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[color:var(--color-navy)]/45 md:text-[12px]">
                      <span>
                        {(o.submittedAt ?? o.createdAt).toLocaleString("es-CU", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "America/Havana",
                        })}
                      </span>
                      {o.customerPhone && <span>· {o.customerPhone}</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-[color:var(--color-navy)]/30 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    confirmed: "bg-amber-100 text-amber-800",
    in_production: "bg-violet-100 text-violet-800",
    ready: "bg-emerald-100 text-emerald-800",
    delivered: "bg-emerald-200 text-emerald-900",
    cancelled: "bg-red-100 text-red-800",
    draft: "bg-neutral-200 text-neutral-700",
  };
  const cls = palette[status] ?? "bg-neutral-200 text-neutral-700";
  const label: Record<string, string> = {
    submitted: "Recibido",
    confirmed: "Confirmado",
    in_production: "En producción",
    ready: "Listo",
    delivered: "Entregado",
    cancelled: "Cancelado",
    draft: "Borrador",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {label[status] ?? status}
    </span>
  );
}
