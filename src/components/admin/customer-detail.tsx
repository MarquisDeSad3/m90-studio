"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageCircle, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  phone: string;
  name: string | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderRow = {
  id: string;
  code: string;
  status: string;
  coverType: string;
  phoneModelName: string;
  layoutName: string;
  priceCup: number;
  priceUsdCents: number;
  submittedAt: string | null;
  createdAt: string;
  deliveredAt: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  submitted: "bg-amber-50 text-amber-800",
  confirmed: "bg-blue-50 text-blue-800",
  in_production: "bg-purple-50 text-purple-800",
  ready: "bg-teal-50 text-teal-800",
  delivered: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  submitted: "Enviado",
  confirmed: "Confirmado",
  in_production: "Producción",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export function CustomerDetail({
  customer,
  orders,
}: {
  customer: Customer;
  orders: OrderRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState(customer.name ?? "");
  const [tags, setTags] = useState<string[]>(customer.tags);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, startRefresh] = useTransition();

  const dirty =
    (name || null) !== (customer.name ?? null) ||
    JSON.stringify(tags) !== JSON.stringify(customer.tags) ||
    (notes || null) !== (customer.notes ?? null);

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) {
      setTagInput("");
      return;
    }
    setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/customers/${encodeURIComponent(customer.phone)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || null,
            tags,
            notes: notes.trim() || null,
          }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setSavedAt(Date.now());
      startRefresh(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  // Stats derivadas
  const totalUsd =
    orders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, o) => acc + o.priceUsdCents, 0) / 100;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      {/* Columna izq: pedidos */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy-500)]">
            · Pedidos ({orders.length})
          </h2>
          <a
            href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 hover:bg-emerald-50"
          >
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </a>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--color-navy)]/10 bg-white p-6 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
              Sin pedidos
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/pedidos/${o.code}`}
                className="block rounded-xl border border-[color:var(--color-navy)]/10 bg-white p-3 transition-colors hover:bg-[color:var(--color-navy)]/[0.03]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-semibold text-[color:var(--color-navy)]">
                        {o.code}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]",
                          STATUS_BADGE[o.status] ??
                            "bg-neutral-100 text-neutral-600",
                        )}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[12px] text-[color:var(--color-navy)]/65">
                      {o.phoneModelName} · {o.layoutName} ·{" "}
                      {o.coverType === "coated" ? "Recubrimiento" : "Normal"}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="font-mono text-[12px] font-semibold text-[color:var(--color-navy)]">
                      ${(o.priceUsdCents / 100).toFixed(2)}
                    </div>
                    <div className="font-mono text-[10px] text-[color:var(--color-navy)]/45">
                      {new Date(o.submittedAt ?? o.createdAt).toLocaleDateString(
                        "es-CU",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Columna der: stats + form */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-[color:var(--color-navy)]/10 bg-white p-4">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy-500)]">
            · Resumen
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
            <Stat label="Total $" value={`$${totalUsd.toFixed(2)}`} />
            <Stat label="Pedidos" value={String(orders.length)} />
            <Stat label="Entregados" value={String(delivered)} />
            <Stat label="Cancelados" value={String(cancelled)} />
          </dl>
        </div>

        <div className="rounded-2xl border border-[color:var(--color-navy)]/10 bg-white p-4">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy-500)]">
            · CRM (interno)
          </h3>

          <div className="mt-3 space-y-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/65">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
                className="mt-1 h-9 w-full rounded-md border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[12px] text-[color:var(--color-navy)] focus:border-[color:var(--color-navy)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/65">
                Tags
              </label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-cream-warm)]/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/85"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="rounded-full p-0.5 hover:bg-[color:var(--color-navy)]/[0.08]"
                      aria-label={`Quitar ${t}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="recurrente, vip…"
                    className="h-7 min-w-[110px] flex-1 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)] placeholder:normal-case placeholder:tracking-normal placeholder:text-[color:var(--color-navy)]/40 focus:border-[color:var(--color-navy)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)] disabled:opacity-30"
                    aria-label="Agregar tag"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/65">
                Notas internas (no visibles al cliente)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Cualquier detalle útil sobre este cliente — preferencias, problemas pasados, etc."
                className="mt-1 w-full resize-none rounded-md border border-[color:var(--color-navy)]/15 bg-white p-3 font-mono text-[12px] leading-relaxed text-[color:var(--color-navy)] focus:border-[color:var(--color-navy)] focus:outline-none"
              />
            </div>

            {error && (
              <p className="font-mono text-[11px] text-red-700">{error}</p>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] text-[color:var(--color-navy)]/45">
                {savedAt && !dirty
                  ? "Guardado"
                  : dirty
                    ? "Cambios sin guardar"
                    : ""}
              </p>
              <button
                type="button"
                onClick={save}
                disabled={!dirty || saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--color-navy)] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/55">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-[20px] italic text-[color:var(--color-navy)]">
        {value}
      </dd>
    </div>
  );
}
