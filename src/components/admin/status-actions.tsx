"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Check, XCircle, RotateCcw } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-provider";

type Status =
  | "draft"
  | "submitted"
  | "confirmed"
  | "in_production"
  | "ready"
  | "delivered"
  | "cancelled";

const NEXT_LABEL: Partial<Record<Status, { to: Status; label: string }>> = {
  submitted: { to: "confirmed", label: "Confirmar pedido" },
  confirmed: { to: "in_production", label: "Iniciar producción" },
  in_production: { to: "ready", label: "Marcar como listo" },
  ready: { to: "delivered", label: "Marcar entregado" },
};

export function StatusActions({
  code,
  status,
}: {
  code: string;
  status: Status;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = NEXT_LABEL[status];
  const canCancel = status !== "delivered" && status !== "cancelled";
  const canReopen = status === "cancelled";

  async function move(to: Status) {
    setBusy(to);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(code)}/status`,
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
    } finally {
      setBusy(null);
    }
  }

  if (status === "delivered") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-center gap-2 text-[13px] text-emerald-900">
          <Check className="h-4 w-4" />
          <span className="font-medium">Pedido entregado.</span>
        </div>
        <p className="mt-1 text-[12px] text-emerald-800/70">
          Estado final, no hay más transiciones.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-navy-500)]">
        · Acciones
      </h3>

      <div className="mt-3 flex flex-col gap-2">
        {next && (
          <button
            type="button"
            onClick={() => move(next.to)}
            disabled={busy !== null || isPending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-navy)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none"
          >
            {busy === next.to ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {next.label}
          </button>
        )}

        {canReopen && (
          <button
            type="button"
            onClick={() => move("submitted")}
            disabled={busy !== null || isPending}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--color-navy)]/15 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)] transition-colors hover:bg-[color:var(--color-navy)]/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "submitted" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Reabrir pedido
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={async () => {
              const ok = await confirm({
                title: `¿Cancelar el pedido ${code}?`,
                message: "El pedido queda en estado cancelado.",
                confirmLabel: "Cancelar pedido",
                cancelLabel: "Volver",
                variant: "danger",
              });
              if (ok) move("cancelled");
            }}
            disabled={busy !== null || isPending}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "cancelled" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            Cancelar pedido
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-[12px] text-red-700">{error}</p>
      )}
    </div>
  );
}
