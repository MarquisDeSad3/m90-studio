"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";

export type OrderRow = {
  id: string;
  code: string;
  status: string;
  phoneModelName: string;
  layoutName: string;
  customerName: string | null;
  customerPhone: string | null;
  submittedAt: string | null;
  createdAt: string;
  photoCount: number;
  hasInternalNotes: boolean;
  coverType: "normal" | "coated";
  priceUsdCents: number;
};

export function OrdersListClient({ items }: { items: OrderRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((o) => {
      return (
        o.code.toLowerCase().includes(q) ||
        o.phoneModelName.toLowerCase().includes(q) ||
        o.layoutName.toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.customerPhone ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-navy)]/40"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código, teléfono, modelo…"
          className="h-11 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-white pl-11 pr-10 text-[14px] text-[color:var(--color-navy)] placeholder:text-[color:var(--color-navy)]/40 focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15"
        />
        {query.length > 0 && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[color:var(--color-navy)]/45 hover:bg-[color:var(--color-navy)]/8 hover:text-[color:var(--color-navy)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-[color:var(--color-navy)]/20 px-6 py-16 text-center">
          <p className="text-[13px] text-[color:var(--color-navy)]/55">
            {query
              ? `Ningún pedido coincide con "${query}".`
              : "No hay pedidos en esta vista."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--color-navy)]/10 overflow-hidden rounded-3xl border border-[color:var(--color-navy)]/12 bg-white">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/pedidos/${o.code}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[color:var(--color-navy)]/[0.02] md:px-8 md:py-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-mono text-[13px] font-semibold tracking-tight text-[color:var(--color-navy)] md:text-[14px]">
                      {o.code}
                    </span>
                    <StatusBadge status={o.status} />
                    {o.coverType === "coated" && (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                        recub.
                      </span>
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
                      {o.photoCount} foto{o.photoCount === 1 ? "" : "s"} · ${(o.priceUsdCents / 100).toFixed(0)}
                    </span>
                    {o.hasInternalNotes && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-700">
                        · nota
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-[13px] text-[color:var(--color-navy)]/70 md:text-[14px]">
                    {o.phoneModelName} · {o.layoutName}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[color:var(--color-navy)]/45 md:text-[12px]">
                    <span>
                      {fmt(o.submittedAt ?? o.createdAt)}
                    </span>
                    {o.customerName && <span>· {o.customerName}</span>}
                    {o.customerPhone && <span>· {o.customerPhone}</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-[color:var(--color-navy)]/30 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {query && (
        <div className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
          {filtered.length} de {items.length} en esta vista
        </div>
      )}
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-CU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Havana",
  });
}

const PALETTE: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  confirmed: "bg-amber-100 text-amber-800",
  in_production: "bg-violet-100 text-violet-800",
  ready: "bg-emerald-100 text-emerald-800",
  delivered: "bg-emerald-200 text-emerald-900",
  cancelled: "bg-red-100 text-red-800",
  draft: "bg-neutral-200 text-neutral-700",
};

const LABEL: Record<string, string> = {
  submitted: "Recibido",
  confirmed: "Confirmado",
  in_production: "En producción",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
  draft: "Borrador",
};

function StatusBadge({ status }: { status: string }) {
  const cls = PALETTE[status] ?? "bg-neutral-200 text-neutral-700";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
