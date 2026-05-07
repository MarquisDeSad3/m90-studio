"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Search } from "lucide-react";
import { useEditor, usePhoneModels } from "@/lib/editor/store";
import {
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
  "lg",
  "nokia",
  "zte",
  "alcatel",
  "blu",
  "pixel",
  "oneplus",
  "other",
];

const BRAND_LABELS: Record<PhoneBrand, string> = {
  apple: "Apple iPhone",
  samsung: "Samsung Galaxy",
  xiaomi: "Xiaomi · Redmi · POCO",
  huawei: "Huawei · Honor",
  motorola: "Motorola",
  lg: "LG",
  nokia: "Nokia",
  zte: "ZTE · Blade",
  alcatel: "Alcatel · TCL",
  blu: "BLU",
  pixel: "Google Pixel",
  oneplus: "OnePlus",
  other: "Tecno · Infinix · Realme · OPPO",
};

const BRAND_HINT: Record<PhoneBrand, string> = {
  apple: "iPhone 5 → iPhone 17",
  samsung: "Galaxy J · A · S · Note",
  xiaomi: "Redmi · Mi · POCO · Xiaomi",
  huawei: "P · Y · Mate · Nova · Honor",
  motorola: "Moto E · G · Edge",
  lg: "K · G · V · Stylo · Velvet",
  nokia: "1 · 5 · 6 · G · X series",
  zte: "Blade A · V · Axon",
  alcatel: "Alcatel 1/3/5 · TCL 10/20/30",
  blu: "G · V · Vivo · Studio",
  pixel: "Pixel 3 → Pixel 9",
  oneplus: "OnePlus 7 → 12 · Nord",
  other: "Tecno · Infinix · Realme · OPPO",
};

/**
 * Cada `PhoneModelDef` agrupa varios modelos comerciales bajo un mismo
 * molde de funda. Aquí los expandimos para que el cliente vea cada modelo
 * como entrada individual ("iPhone 13" en vez de "iPhone 12 / 13 / 14").
 *
 * El `slug` apunta al GRUPO (lo que el backend imprime). El `displayName`
 * es el nombre exacto que el cliente eligió, se manda al pedido para que
 * aparezca tal cual en WhatsApp y en el admin.
 */
type ModelOption = {
  slug: string;
  displayName: string;
  brand: PhoneBrand;
  group: PhoneModelDef;
  /** Para ordenar dentro de la marca: heredamos popularity del grupo. */
  popularity: number;
};

function expandModels(models: PhoneModelDef[]): ModelOption[] {
  const out: ModelOption[] = [];
  for (const m of models) {
    if (m.aliases.length === 0) {
      out.push({
        slug: m.slug,
        displayName: m.name,
        brand: m.brand,
        group: m,
        popularity: m.popularity,
      });
    } else {
      for (const alias of m.aliases) {
        out.push({
          slug: m.slug,
          displayName: alias,
          brand: m.brand,
          group: m,
          popularity: m.popularity,
        });
      }
    }
  }
  return out;
}

export function StepModel() {
  const { state, dispatch, goNext } = useEditor();
  const phoneModels = usePhoneModels();
  const allOptions = useMemo(() => expandModels(phoneModels), [phoneModels]);
  const [pickedBrand, setPickedBrand] = useState<PhoneBrand | null>(() => {
    // Si ya hay un modelo seleccionado (rehidratacion), saltar a la lista
    // de modelos de su marca para que el cliente vea su selección.
    if (state.modelSlug) {
      const m = phoneModels.find((g) => g.slug === state.modelSlug);
      return m?.brand ?? null;
    }
    return null;
  });
  const [query, setQuery] = useState("");

  // Si el cliente cambia de marca, limpiar el query
  useEffect(() => {
    setQuery("");
  }, [pickedBrand]);

  const optionsForBrand = useMemo(() => {
    if (!pickedBrand) return [];
    const list = allOptions.filter((o) => o.brand === pickedBrand);
    list.sort((a, b) => {
      if (b.popularity !== a.popularity) return b.popularity - a.popularity;
      return a.displayName.localeCompare(b.displayName);
    });
    return list;
  }, [allOptions, pickedBrand]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return optionsForBrand;
    return optionsForBrand.filter((o) =>
      o.displayName.toLowerCase().includes(q),
    );
  }, [optionsForBrand, query]);

  const brandCounts = useMemo(() => {
    const counts: Record<PhoneBrand, number> = {
      apple: 0,
      samsung: 0,
      xiaomi: 0,
      huawei: 0,
      motorola: 0,
      lg: 0,
      nokia: 0,
      zte: 0,
      alcatel: 0,
      blu: 0,
      pixel: 0,
      oneplus: 0,
      other: 0,
    };
    for (const o of allOptions) counts[o.brand]++;
    return counts;
  }, [allOptions]);

  /* ============================================================
     Sub-fase A: elegir MARCA
     ============================================================ */
  if (!pickedBrand) {
    return (
      <section className="mx-auto max-w-[920px] px-4 pb-4 pt-6 md:px-8 md:pt-12">
        <div className="mb-8 md:mb-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
            · Paso 1 de 4 · marca
          </span>
          <h1 className="mt-2 font-display text-[clamp(34px,7.5vw,64px)] italic leading-[0.98] text-[color:var(--color-navy)]">
            ¿De qué marca <br className="sm:hidden" />
            es tu teléfono?
          </h1>
          <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[color:var(--color-navy)]/65 md:mt-4 md:text-[15px]">
            Elegí la marca primero. Después buscás tu modelo exacto.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BRAND_ORDER.map((brand) => (
            <li key={brand}>
              <button
                onClick={() => setPickedBrand(brand)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-navy)]/30 hover:shadow-[0_18px_40px_-20px_rgba(1,27,83,0.25)] active:scale-[0.99] md:p-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[20px] leading-tight text-[color:var(--color-navy)] md:text-[22px]">
                    {BRAND_LABELS[brand]}
                  </div>
                  <div className="mt-1 text-[12px] text-[color:var(--color-navy)]/55 md:text-[13px]">
                    {BRAND_HINT[brand]}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-navy)]/45">
                    {brandCounts[brand]}{" "}
                    {brandCounts[brand] === 1 ? "modelo" : "modelos"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[color:var(--color-navy)]/40 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-[52ch] text-balance text-center text-[12px] text-[color:var(--color-navy)]/45 md:text-[13px]">
          Si tu marca no aparece, igual la imprimimos — escribinos por WhatsApp
          y vemos.
        </p>
      </section>
    );
  }

  /* ============================================================
     Sub-fase B: elegir MODELO dentro de la marca
     ============================================================ */
  return (
    <section className="mx-auto max-w-[920px] px-4 pb-4 pt-6 md:px-8 md:pt-12">
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => {
            setPickedBrand(null);
            setQuery("");
          }}
          className="mb-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-navy)]/55 transition-colors hover:text-[color:var(--color-navy)] md:text-[11px]"
        >
          <ArrowLeft className="h-3 w-3" />
          Cambiar marca
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
          · Paso 1 de 4 · {BRAND_LABELS[pickedBrand]}
        </span>
        <h1 className="mt-2 font-display text-[clamp(30px,6.5vw,52px)] italic leading-[0.98] text-[color:var(--color-navy)]">
          ¿Qué modelo tenés?
        </h1>
      </div>

      {/* Search sticky */}
      <div className="sticky top-[57px] z-10 -mx-4 mb-5 bg-[color:var(--color-paper)]/95 px-4 pb-3 pt-1 backdrop-blur-md md:-mx-8 md:top-[73px] md:px-8">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-navy)]/40"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              {
                apple: "iPhone 13, 14 Pro, SE…",
                samsung: "Galaxy A14, S22, J7…",
                xiaomi: "Redmi Note 12, Mi 11, POCO X3…",
                huawei: "P30, Y9, Honor X8…",
                motorola: "Moto G84, E13, Edge…",
                lg: "LG K40, G7, Stylo, Velvet…",
                nokia: "Nokia 6, G20, X20…",
                zte: "Blade A52, V40, Axon…",
                alcatel: "Alcatel 3, TCL 20, 30…",
                blu: "BLU G91, Vivo, Studio…",
                pixel: "Pixel 6, 7a, 8 Pro…",
                oneplus: "OnePlus 9, Nord 2, 11…",
                other: "Tecno Spark, Infinix Hot…",
              }[pickedBrand]
            }
            inputMode="search"
            autoComplete="off"
            autoFocus
            className="h-12 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-white pl-11 pr-4 text-[14px] text-[color:var(--color-navy)] placeholder:text-[color:var(--color-navy)]/35 focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15 md:h-13 md:text-[15px]"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[color:var(--color-navy)]/45 md:text-[12px]">
          <span>
            {filtered.length} de {optionsForBrand.length}
          </span>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="font-mono uppercase tracking-[0.2em] hover:text-[color:var(--color-navy)]"
            >
              limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista de modelos individuales */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-navy)]/20 p-8 text-center">
          <p className="text-[14px] text-[color:var(--color-navy)]/55">
            No encontramos &quot;{query}&quot; en {BRAND_LABELS[pickedBrand]}.
          </p>
          <p className="mt-2 text-[12px] text-[color:var(--color-navy)]/45">
            Probá con otro nombre o cambiá de marca. Si tu modelo no aparece,
            te lo conseguimos por WhatsApp.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((opt) => (
            <ModelCard
              key={`${opt.slug}__${opt.displayName}`}
              option={opt}
              selected={
                state.modelSlug === opt.slug &&
                state.modelDisplayName === opt.displayName
              }
              onSelect={() =>
                dispatch({
                  type: "SET_MODEL",
                  slug: opt.slug,
                  displayName: opt.displayName,
                })
              }
            />
          ))}
        </ul>
      )}

      <NextCta
        onClick={goNext}
        disabled={!state.modelSlug}
        helper={
          state.modelDisplayName
            ? `Seleccionado: ${state.modelDisplayName}`
            : undefined
        }
      />
    </section>
  );
}

function ModelCard({
  option,
  selected,
  onSelect,
}: {
  option: ModelOption;
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
        <PhoneSilhouette model={option.group} selected={selected} />

        <div className="min-w-0 flex-1">
          <div className="font-display text-[16px] leading-tight text-[color:var(--color-navy)] md:text-[17px]">
            {option.displayName}
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/45 md:text-[11px]">
            {option.group.widthMm} × {option.group.heightMm} mm
          </div>
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
