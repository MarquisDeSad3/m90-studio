"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

export function AdminNotesEditor({
  code,
  initial,
}: {
  code: string;
  initial: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = (value.trim() || null) !== (initial?.trim() || null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(code)}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminNotes: value }),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "No se pudo guardar");
      }
      setSavedAt(Date.now());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-navy-500)]">
          · Notas internas
        </h3>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
          no visible al cliente
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Recordatorios, pagos pendientes, notas de envío…"
        className="mt-3 block w-full resize-y rounded-xl border border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)] px-3 py-2.5 text-[13px] leading-relaxed text-[color:var(--color-navy)] focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-[11px] text-[color:var(--color-navy)]/55">
          {error ? (
            <span className="text-red-700">{error}</span>
          ) : savedAt && !dirty ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Check className="h-3 w-3" />
              Guardado
            </span>
          ) : (
            <span>{value.length}/2000</span>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-navy)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none"
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          Guardar
        </button>
      </div>
    </div>
  );
}
