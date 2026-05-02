"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Search } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import {
  PHONE_MODELS,
  type PhoneBrand,
  type PhoneModelDef,
} from "@/lib/data/phone-models";
import { cn } from "@/lib/utils";
import { NextCta } from "./next-cta";

const BRAND_ORDER: PhoneBrand[] = [
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "motorola",
  "other",
];

const BRAND_LABELS: Record<PhoneBrand, string> = {
  apple: "Apple iPhone",
  samsung: "Samsung Galaxy",
  xiaomi: "Xiaomi · Redmi · POCO",
  huawei: "Huawei · Honor",
  motorola: "Motorola",
  other: "Otros",
};

export function StepModel() {
  const { state, dispatch, goNext } = useEditor();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHONE_MODELS;
    return PHONE_MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.aliases.some((a) => a.toLowerCase().includes(q)) ||
        m.brand.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<PhoneBrand, PhoneModelDef[]>();
    for (const m of filtered) {
      if (!map.has(m.brand)) map.set(m.brand, []);
      map.get(m.brand)!.push(m);
    }
    map.forEach((arr) => arr.sort((a, b) => b.popularity - a.popularity));
    return map;
  }, [filtered]);

  const selectedModel = useMemo(
    () => PHONE_MODELS.find((m) => m.slug === state.modelSlug) ?? null,
    [state.modelSlug],
  );

  return (
    <section className="mx-auto max-w-[920px] px-4 pb-4 pt-6 md:px-8 md:pt-12">
      {/* Header del step */}
      <div className="mb-8 md:mb-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
          · Paso 1 de 4
        </span>
        <h1 className="mt-2 font-display text-[clamp(34px,7.5vw,64px)] italic leading-[0.98] text-[color:var(--color-navy)]">
          ¿Qué teléfono <br className="sm:hidden" />
          tenés?
        </h1>
        <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[color:var(--color-navy)]/65 md:mt-4 md:text-[15px]">
          Cargamos la plantilla exacta de tu modelo. Si el tuyo no aparece, es
          porque comparte molde con uno que sí está — buscá por marca.
        </p>
      </div>

      {/* Search sticky */}
      <div className="sticky top-[57px] z-10 -mx-4 mb-6 bg-[color:var(--color-paper)]/95 px-4 pb-3 pt-1 backdrop-blur-md md:-mx-8 md:top-[73px] md:px-8">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-navy)]/40"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="iPhone 13, Galaxy S22, Redmi Note…"
            inputMode="search"
            autoComplete="off"
            className="h-12 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-white pl-11 pr-4 text-[14px] text-[color:var(--color-navy)] placeholder:text-[color:var(--color-navy)]/35 focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15 md:h-13 md:text-[15px]"
          />
        </div>
      </div>

      {/* Grupos por marca */}
      <div className="space-y-7 md:space-y-9">
        {BRAND_ORDER.map((brand) => {
          const list = grouped.get(brand);
          if (!list || list.length === 0) return null;
          return (
            <div key={brand}>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy)]/55 md:text-[11px]">
                · {BRAND_LABELS[brand]}
                <span className="ml-2 text-[color:var(--color-navy)]/30">
                  {list.length}
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {list.map((m) => (
                  <ModelCard
                    key={m.slug}
                    model={m}
                    selected={state.modelSlug === m.slug}
                    onSelect={() =>
                      dispatch({ type: "SET_MODEL", slug: m.slug })
                    }
                  />
                ))}
              </ul>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[color:var(--color-navy)]/20 p-8 text-center">
            <p className="text-[14px] text-[color:var(--color-navy)]/55">
              No encontramos ese modelo. Probá con la marca o el nombre exacto.
            </p>
            <p className="mt-2 text-[12px] text-[color:var(--color-navy)]/45">
              ¿Sigue sin aparecer? Te lo conseguimos por WhatsApp.
            </p>
          </div>
        )}
      </div>

      <NextCta
        onClick={goNext}
        disabled={!state.modelSlug}
        helper={
          selectedModel ? `Seleccionado: ${selectedModel.name}` : undefined
        }
      />
    </section>
  );
}

function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: PhoneModelDef;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "group flex w-full items-center gap-4 rounded-2xl border bg-white p-3 text-left transition-all md:p-4",
          selected
            ? "border-[color:var(--color-navy)] shadow-[0_10px_30px_-12px_rgba(1,27,83,0.32)]"
            : "border-[color:var(--color-navy)]/10 hover:border-[color:var(--color-navy)]/30 hover:shadow-[0_6px_20px_-12px_rgba(1,27,83,0.18)] active:scale-[0.99]",
        )}
      >
        <PhoneSilhouette model={model} selected={selected} />

        <div className="min-w-0 flex-1">
          <div className="font-display text-[16px] leading-tight text-[color:var(--color-navy)] md:text-[17px]">
            {model.name}
          </div>
          {model.aliases.length > 0 && (
            <div className="mt-0.5 truncate text-[11px] text-[color:var(--color-navy)]/45 md:text-[12px]">
              {model.aliases.join(" · ")}
            </div>
          )}
        </div>

        {selected ? (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </div>
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-[color:var(--color-navy)]/30 transition-transform group-hover:translate-x-0.5" />
        )}
      </button>
    </li>
  );
}

function PhoneSilhouette({
  model,
  selected,
}: {
  model: PhoneModelDef;
  selected: boolean;
}) {
  const HEIGHT = 64;
  const width = (model.widthMm / model.heightMm) * HEIGHT;
  const cornerRadius = (model.cornerRadiusMm / model.heightMm) * HEIGHT;

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex-shrink-0 transition-colors",
        selected
          ? "bg-[color:var(--color-navy)]/15"
          : "bg-[color:var(--color-navy)]/8",
      )}
      style={{
        width,
        height: HEIGHT,
        borderRadius: cornerRadius,
      }}
    >
      {model.camera && (
        <div
          className={cn(
            "absolute rounded-md transition-colors",
            selected
              ? "bg-[color:var(--color-navy)]/35"
              : "bg-[color:var(--color-navy)]/22",
          )}
          style={{
            left: `${(model.camera[0] / model.widthMm) * 100}%`,
            top: `${(model.camera[1] / model.heightMm) * 100}%`,
            width: `${(model.camera[2] / model.widthMm) * 100}%`,
            height: `${(model.camera[3] / model.heightMm) * 100}%`,
          }}
        />
      )}
    </div>
  );
}
