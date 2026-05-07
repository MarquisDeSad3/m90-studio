"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useEditor, usePhoneModel } from "@/lib/editor/store";
import { LAYOUTS, type LayoutDef } from "@/lib/data/layouts";
import { cn } from "@/lib/utils";
import { NextCta } from "./next-cta";
import { LayoutPreview } from "./layout-preview";

/* Counts disponibles en el catalogo, en el orden que queremos mostrar */
const COUNT_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "1", label: "1 foto" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "9", label: "9" },
] as const;

export function StepLayout() {
  const { state, dispatch, goNext } = useEditor();
  const [filter, setFilter] = useState<string>("all");

  const model = usePhoneModel(state.modelSlug);

  const list = useMemo(() => {
    if (filter === "all") return LAYOUTS;
    const n = Number(filter);
    return LAYOUTS.filter((l) => l.count === n);
  }, [filter]);

  const selectedLayout = useMemo(
    () => LAYOUTS.find((l) => l.id === state.layoutId) ?? null,
    [state.layoutId],
  );

  return (
    <section className="mx-auto max-w-[920px] px-4 pb-4 pt-6 md:px-8 md:pt-12">
      {/* Header del step */}
      <div className="mb-6 md:mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
          · Paso 2 de 4
        </span>
        <h1 className="mt-2 font-display text-[clamp(34px,7.5vw,64px)] italic leading-[0.98] text-[color:var(--color-navy)]">
          Elegí el layout
        </h1>
        <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[15px]">
          Cómo se acomodan tus fotos en la funda. Cada número en el preview es
          un slot donde irá una foto.
          {model && (
            <span className="mt-1 block text-[color:var(--color-navy)]/45">
              Vista previa con la silueta de tu {model.name}.
            </span>
          )}
        </p>
      </div>

      {/* Filtro por cantidad de fotos */}
      <div className="sticky top-[57px] z-10 -mx-4 mb-6 overflow-x-auto bg-[color:var(--color-paper)]/95 px-4 pb-3 pt-1 backdrop-blur-md md:-mx-8 md:top-[73px] md:px-8">
        <div className="flex gap-2">
          {COUNT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex-shrink-0 rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] transition-all md:px-5 md:text-[13px]",
                filter === f.value
                  ? "border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]"
                  : "border-[color:var(--color-navy)]/15 bg-white text-[color:var(--color-navy)]/70 hover:border-[color:var(--color-navy)]/35 hover:text-[color:var(--color-navy)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de layouts */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {list.map((layout) => (
          <LayoutCard
            key={layout.id}
            layout={layout}
            selected={state.layoutId === layout.id}
            onSelect={() => dispatch({ type: "SET_LAYOUT", id: layout.id })}
            model={model}
          />
        ))}
      </ul>

      {list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-navy)]/20 p-8 text-center">
          <p className="text-[14px] text-[color:var(--color-navy)]/55">
            No hay layouts con esa cantidad de fotos. Probá con "Todos".
          </p>
        </div>
      )}

      <NextCta
        onClick={goNext}
        disabled={!state.layoutId}
        helper={
          selectedLayout
            ? `${selectedLayout.count} foto${selectedLayout.count > 1 ? "s" : ""} · ${selectedLayout.name.split(" · ")[1] ?? selectedLayout.name}`
            : undefined
        }
      />
    </section>
  );
}

function LayoutCard({
  layout,
  selected,
  onSelect,
  model,
}: {
  layout: LayoutDef;
  selected: boolean;
  onSelect: () => void;
  model: Parameters<typeof LayoutPreview>[0]["model"];
}) {
  const [, ...nameParts] = layout.name.split(" · ");
  const subtitle = nameParts.join(" · ");

  return (
    <li>
      <button
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "group flex w-full flex-col items-center gap-3 rounded-2xl border bg-white p-3 text-center transition-all md:p-4",
          selected
            ? "border-[color:var(--color-navy)] shadow-[0_10px_30px_-12px_rgba(1,27,83,0.32)]"
            : "border-[color:var(--color-navy)]/10 hover:border-[color:var(--color-navy)]/30 hover:shadow-[0_6px_20px_-12px_rgba(1,27,83,0.18)] active:scale-[0.99]",
        )}
      >
        <div className="relative">
          <LayoutPreview
            layout={layout}
            model={model}
            height={130}
            selected={selected}
          />
          {selected && (
            <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)] shadow-md">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="w-full">
          <div className="font-display text-[14px] leading-tight text-[color:var(--color-navy)] md:text-[15px]">
            {layout.count} {layout.count === 1 ? "foto" : "fotos"}
          </div>
          <div className="mt-0.5 truncate text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/45 md:text-[11px]">
            {subtitle || layout.category}
          </div>
        </div>
      </button>
    </li>
  );
}
