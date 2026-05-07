"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-provider";

type SubscriberStatus = "pending" | "approved" | "rejected";

export type Subscriber = {
  chatId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  status: SubscriberStatus;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
};

const STATUS_LABEL: Record<SubscriberStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const STATUS_BADGE: Record<SubscriberStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export function TelegramSubscribersManager({
  initial,
}: {
  initial: Subscriber[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function action(
    chatId: string,
    kind: "approve" | "reject" | "delete",
  ) {
    if (kind === "delete") {
      const ok = await confirm({
        title: "¿Quitar este suscriptor?",
        message: "Puede volver a hacer /start si quiere reaplicar.",
        confirmLabel: "Quitar",
        variant: "danger",
      });
      if (!ok) return;
    }
    setBusy(`${chatId}:${kind}`);
    setError(null);
    try {
      const url = `/api/admin/telegram-subscribers/${encodeURIComponent(chatId)}`;
      const res =
        kind === "delete"
          ? await fetch(url, { method: "DELETE" })
          : await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: kind }),
            });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Error");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  const pending = initial.filter((s) => s.status === "pending");
  const approved = initial.filter((s) => s.status === "approved");
  const rejected = initial.filter((s) => s.status === "rejected");

  return (
    <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] leading-tight text-[color:var(--color-navy)] md:text-[22px]">
            Notificaciones Telegram
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55 md:text-[11px]">
            Quién recibe los pedidos automáticamente
          </p>
        </div>
        <div className="flex gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/55 md:text-[11px]">
          {pending.length > 0 && (
            <span className="text-amber-700">
              {pending.length} pendiente{pending.length === 1 ? "" : "s"}
            </span>
          )}
          <span>{approved.length} aprob.</span>
        </div>
      </div>

      {initial.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)] p-8 text-center">
          <p className="text-[13px] text-[color:var(--color-navy)]/55">
            Nadie le ha hablado al bot todavía.
          </p>
          <p className="mt-2 text-[12px] text-[color:var(--color-navy)]/45">
            Compartí el link <span className="font-mono">t.me/m90studio_pedidos_bot</span> con quien quieras que reciba notificaciones.
            Cuando esa persona toque <strong>Iniciar</strong> aparece acá pendiente.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {[...pending, ...approved, ...rejected].map((s) => (
            <SubscriberRow
              key={s.chatId}
              s={s}
              busy={busy}
              onAction={action}
            />
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-3 text-[12px] text-red-700">{error}</p>
      )}

      <p className="mt-5 text-[11px] leading-relaxed text-[color:var(--color-navy)]/55 md:text-[12px]">
        <strong>Cómo funciona:</strong> cuando alguien le manda{" "}
        <code className="rounded bg-[color:var(--color-navy)]/8 px-1 py-0.5 font-mono text-[10px]">
          /start
        </code>{" "}
        al bot aparece como <em>pendiente</em>. Lo aprobás aquí y empieza a
        recibir los pedidos. Si lo rechazás o quitás, deja de recibir. Las
        notificaciones se mandan a TODOS los aprobados.
      </p>
    </div>
  );
}

function SubscriberRow({
  s,
  busy,
  onAction,
}: {
  s: Subscriber;
  busy: string | null;
  onAction: (chatId: string, kind: "approve" | "reject" | "delete") => void;
}) {
  const fullName = [s.firstName, s.lastName].filter(Boolean).join(" ");
  const handle = s.username ? `@${s.username}` : "";
  const display = fullName || handle || `id ${s.chatId}`;
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-navy)]/10 bg-[color:var(--color-paper)] p-3 md:p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-display text-[15px] leading-tight text-[color:var(--color-navy)]">
            {display}
          </span>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] ${STATUS_BADGE[s.status]}`}
          >
            {STATUS_LABEL[s.status]}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[color:var(--color-navy)]/55">
          {handle && fullName && <span>{handle}</span>}
          <span className="font-mono">id {s.chatId}</span>
          <span>· {fmtDate(s.requestedAt)}</span>
        </div>
      </div>

      <div className="flex flex-shrink-0 gap-1.5">
        {s.status === "pending" && (
          <>
            <ActionButton
              label="Aprobar"
              icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />}
              variant="approve"
              loading={busy === `${s.chatId}:approve`}
              disabled={busy !== null}
              onClick={() => onAction(s.chatId, "approve")}
            />
            <ActionButton
              label="Rechazar"
              icon={<X className="h-3.5 w-3.5" strokeWidth={3} />}
              variant="reject"
              loading={busy === `${s.chatId}:reject`}
              disabled={busy !== null}
              onClick={() => onAction(s.chatId, "reject")}
            />
          </>
        )}
        {s.status === "approved" && (
          <ActionButton
            label="Revocar"
            icon={<X className="h-3.5 w-3.5" strokeWidth={3} />}
            variant="reject"
            loading={busy === `${s.chatId}:reject`}
            disabled={busy !== null}
            onClick={() => onAction(s.chatId, "reject")}
          />
        )}
        {s.status === "rejected" && (
          <ActionButton
            label="Reaprobar"
            icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />}
            variant="approve"
            loading={busy === `${s.chatId}:approve`}
            disabled={busy !== null}
            onClick={() => onAction(s.chatId, "approve")}
          />
        )}
        <ActionButton
          label="Quitar"
          icon={<Trash2 className="h-3.5 w-3.5" />}
          variant="delete"
          loading={busy === `${s.chatId}:delete`}
          disabled={busy !== null}
          onClick={() => onAction(s.chatId, "delete")}
        />
      </div>
    </li>
  );
}

function ActionButton({
  label,
  icon,
  variant,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  variant: "approve" | "reject" | "delete";
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const base =
    "inline-flex h-8 items-center gap-1 rounded-full px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const styles = {
    approve:
      "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    reject: "bg-red-100 text-red-800 hover:bg-red-200",
    delete:
      "border border-[color:var(--color-navy)]/15 bg-white text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]}`}
      aria-label={label}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CU", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Havana",
  });
}
