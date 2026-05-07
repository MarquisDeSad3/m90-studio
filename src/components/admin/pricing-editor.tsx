"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

type PricingRow = {
  type: "normal" | "coated";
  priceUsdCents: number;
  priceCup: number;
  updatedAt: string;
};

type Pricing = Record<"normal" | "coated", { usd: string; cup: string }>;

const LABEL: Record<"normal" | "coated", { title: string; sub: string }> = {
  normal: {
    title: "Funda Normal",
    sub: "Transferencia térmica simple sobre TPU",
  },
  coated: {
    title: "Funda con Recubrimiento",
    sub: "Placa blanca de aluminio (2-en-1)",
  },
};

export function PricingEditor({ initial }: { initial: PricingRow[] }) {
  const router = useRouter();
  const initialMap: Pricing = {
    normal: { usd: "7", cup: "2100" },
    coated: { usd: "15", cup: "4500" },
  };
  for (const r of initial) {
    initialMap[r.type] = {
      usd: (r.priceUsdCents / 100).toString(),
      cup: r.priceCup.toString(),
    };
  }

  const [pricing, setPricing] = useState<Pricing>(initialMap);
  const [savingType, setSavingType] = useState<"normal" | "coated" | null>(null);
  const [savedType, setSavedType] = useState<"normal" | "coated" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!savedType) return;
    const id = setTimeout(() => setSavedType(null), 2500);
    return () => clearTimeout(id);
  }, [savedType]);

  async function save(type: "normal" | "coated") {
    setSavingType(type);
    setError(null);
    try {
      const usd = Number(pricing[type].usd);
      const cup = Number(pricing[type].cup);
      if (!Number.isFinite(usd) || usd < 0) throw new Error("USD inválido");
      if (!Number.isFinite(cup) || cup < 0) throw new Error("CUP inválido");

      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          priceUsdCents: Math.round(usd * 100),
          priceCup: Math.round(cup),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "No se pudo guardar");
      }
      setSavedType(type);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingType(null);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {(["normal", "coated"] as const).map((type) => {
        const meta = LABEL[type];
        const usdVal = pricing[type].usd;
        const cupVal = pricing[type].cup;
        const ratio =
          Number(usdVal) > 0 ? (Number(cupVal) / Number(usdVal)).toFixed(0) : "—";
        return (
          <div
            key={type}
            className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 md:p-6"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="font-display text-[20px] leading-tight text-[color:var(--color-navy)] md:text-[22px]">
                  {meta.title}
                </h2>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55 md:text-[11px]">
                  {meta.sub}
                </p>
              </div>
              {type === "coated" && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  premium
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <Field
                id={`${type}-usd`}
                label="Precio USD"
                value={usdVal}
                onChange={(v) =>
                  setPricing((p) => ({ ...p, [type]: { ...p[type], usd: v } }))
                }
                prefix="$"
                inputMode="decimal"
              />
              <Field
                id={`${type}-cup`}
                label="Precio CUP"
                value={cupVal}
                onChange={(v) =>
                  setPricing((p) => ({ ...p, [type]: { ...p[type], cup: v } }))
                }
                suffix="CUP"
                inputMode="numeric"
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/45">
                Ratio actual: {ratio} CUP/USD
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-[11px] text-[color:var(--color-navy)]/55">
                {savedType === type ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <Check className="h-3 w-3" /> Guardado
                  </span>
                ) : (
                  "Cambios snapshoteados al pedido en el momento de la compra."
                )}
              </span>
              <button
                type="button"
                onClick={() => save(type)}
                disabled={savingType !== null}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-navy)] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none"
              >
                {savingType === type ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                Guardar
              </button>
            </div>
          </div>
        );
      })}
      {error && (
        <p className="md:col-span-2 text-[12px] text-red-700">{error}</p>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65"
      >
        {label}
      </label>
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-[15px] text-[color:var(--color-navy)]/55">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)] text-[15px] text-[color:var(--color-navy)] focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15 ${
            prefix ? "pl-9" : "pl-4"
          } ${suffix ? "pr-16" : "pr-4"}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
