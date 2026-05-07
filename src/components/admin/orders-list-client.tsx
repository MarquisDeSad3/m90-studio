"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronRight,
  Hammer,
  Loader2,
  PackageCheck,
  RotateCcw,
  Search,
  Truck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Status =
  | "draft"
  | "submitted"
  | "confirmed"
  | "in_production"
  | "ready"
  | "delivered"
  | "cancelled";

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

/** Próximo step lógico por estado. */
const NEXT_STEP: Partial<
  Record<Status, { to: Status; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }>
> = {
  submitted: { to: "confirmed", label: "Confirmar", icon: Check },
  confirmed: { to: "in_production", label: "Producir", icon: Hammer },
  in_production: { to: "ready", label: "Listo", icon: PackageCheck },
  ready: { to: "delivered", label: "Entregar", icon: Truck },
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
            <OrderItem key={o.id} order={o} />
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

/* ============================================================
   Item individual con acciones rápidas
   ============================================================ */

function OrderItem({ order }: { order: OrderRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = order.status as Status;
  const next = NEXT_STEP[status];
  const canCancel = status !== "delivered" && status !== "cancelled";
  const canReopen = status === "cancelled";

  async function changeStatus(to: Status) {
    setBusy(to);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.code)}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: to }),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "No se pudo actualizar");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setTimeout(() => setError(null), 3500);
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="relative">
      <div
        className={cn(
          "flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-[color:var(--color-navy)]/[0.02] md:flex-row md:items-center md:gap-4 md:px-6 md:py-4",
          (busy !== null || isPending) && "opacity-60",
        )}
      >
        {/* Click area: link al detalle */}
        <Link
          href={`/admin/pedidos/${order.code}`}
          className="group flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[13px] font-semibold tracking-tight text-[color:var(--color-navy)] md:text-[14px]">
                {order.code}
              </span>
              <StatusBadge status={status} />
              {order.coverType === "coated" && (
                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  recub.
                </span>
              )}
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
                {order.photoCount} foto{order.photoCount === 1 ? "" : "s"} · $
                {(order.priceUsdCents / 100).toFixed(0)}
              </span>
              {order.hasInternalNotes && (
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-700">
                  · nota
                </span>
              )}
            </div>
            <div className="mt-1 truncate text-[13px] text-[color:var(--color-navy)]/70 md:text-[14px]">
              {order.phoneModelName} · {order.layoutName}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[color:var(--color-navy)]/45 md:text-[12px]">
              <span>{fmt(order.submittedAt ?? order.createdAt)}</span>
              {order.customerName && <span>· {order.customerName}</span>}
              {order.customerPhone && <span>· {order.customerPhone}</span>}
            </div>
          </div>
          <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-[color:var(--color-navy)]/30 transition-transform group-hover:translate-x-0.5 md:block" />
        </Link>

        {/* Action buttons row */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-1.5 md:gap-2">
          {next && (
            <ActionBtn
              variant="primary"
              icon={next.icon}
              label={next.label}
              loading={busy === next.to}
              disabled={busy !== null || isPending}
              onClick={() => changeStatus(next.to)}
            />
          )}
          {canReopen && (
            <ActionBtn
              variant="secondary"
              icon={RotateCcw}
              label="Reabrir"
              loading={busy === "submitted"}
              disabled={busy !== null || isPending}
              onClick={() => changeStatus("submitted")}
            />
          )}
          {canCancel && (
            <ActionBtn
              variant="danger"
              icon={X}
              label="Cancelar"
              loading={busy === "cancelled"}
              disabled={busy !== null || isPending}
              onClick={() => {
                if (confirm(`¿Cancelar el pedido ${order.code}?`)) {
                  changeStatus("cancelled");
                }
              }}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="absolute inset-x-4 bottom-1 rounded-md bg-red-50 px-3 py-1 text-[11px] text-red-700">
          {error}
        </div>
      )}
    </li>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function ActionBtn({
  variant,
  icon: Icon,
  label,
  loading,
  disabled,
  onClick,
}: {
  variant: "primary" | "secondary" | "danger";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const styles = {
    primary:
      "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 active:bg-emerald-300",
    secondary:
      "border border-[color:var(--color-navy)]/15 bg-white text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04] hover:text-[color:var(--color-navy)]",
    danger:
      "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full px-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-3",
        styles[variant],
      )}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" strokeWidth={2.4} />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
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
  in_production: "Producción",
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
