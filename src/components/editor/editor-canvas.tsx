"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LayoutDef } from "@/lib/data/layouts";
import {
  getPrintDimensions,
  type PhoneModelDef,
} from "@/lib/data/phone-models";
import type { Photo } from "@/lib/editor/store";

/**
 * Canvas interactivo del editor: cada slot del layout es un boton clickeable.
 *
 * El canvas representa el AREA DE IMPRESION TOTAL del cover:
 *   cuerpo del telefono + (grosor + 3mm de curvatura) por cada lado
 *
 * Los slots cubren toda esa area. La cara trasera del cover (la zona
 * central) está marcada con un borde sutil para que el cliente sepa que
 * lo importante (caras, texto) va ahí — los bordes envuelven los lados
 * del cover en el wrap del cover.
 */
export function EditorCanvas({
  layout,
  model,
  photos,
  onSlotClick,
  height,
}: {
  layout: LayoutDef;
  model: PhoneModelDef | null;
  photos: Photo[];
  onSlotClick: (slotIndex: number) => void;
  height: number;
}) {
  const printDims = model
    ? getPrintDimensions(model)
    : { widthMm: 81, heightMm: 156, wrapMm: 0 };
  const aspectW = printDims.widthMm;
  const aspectH = printDims.heightMm;
  const width = (aspectW / aspectH) * height;
  const cornerRadius = model
    ? (model.cornerRadiusMm / aspectH) * height
    : 12;

  // Cara del cover (zona segura) en porcentaje del canvas
  const safeInsetXPct =
    printDims.wrapMm > 0 ? (printDims.wrapMm / aspectW) * 100 : 0;
  const safeInsetYPct =
    printDims.wrapMm > 0 ? (printDims.wrapMm / aspectH) * 100 : 0;

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden border border-[color:var(--color-navy)]/20 bg-[color:var(--color-navy)]/8 shadow-[0_30px_80px_-30px_rgba(1,27,83,0.45)]"
      style={{
        width,
        height,
        borderRadius: cornerRadius,
      }}
    >
      {layout.slots.map((slot, i) => {
        const photo = photos.find((p) => p.slotIndex === i);
        const filled = !!photo;
        return (
          <button
            key={i}
            onClick={() => onSlotClick(i)}
            className={cn(
              "group/slot absolute overflow-hidden transition-all",
              filled
                ? "ring-1 ring-[color:var(--color-cream-soft)]/50 ring-inset"
                : "bg-[color:var(--color-cream-soft)]/85 hover:bg-[color:var(--color-cream-warm)]/95 active:bg-[color:var(--color-cream-warm)]",
            )}
            style={{
              left: `${slot.x * 100}%`,
              top: `${slot.y * 100}%`,
              width: `${slot.w * 100}%`,
              height: `${slot.h * 100}%`,
              outline: "1px solid rgba(255,255,255,0.6)",
              outlineOffset: "-1px",
            }}
            aria-label={
              filled
                ? `Editar foto ${i + 1}`
                : `Subir foto al slot ${i + 1}`
            }
          >
            {filled ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Overlay al hover/active para indicar que es editable */}
                <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--color-navy-900)]/0 opacity-0 transition-all group-hover/slot:bg-[color:var(--color-navy-900)]/45 group-hover/slot:opacity-100">
                  <span className="rounded-full border border-[color:var(--color-cream-soft)]/40 bg-[color:var(--color-navy-900)]/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] backdrop-blur md:text-[10px]">
                    Tocar para editar
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[color:var(--color-navy)]/45 transition-colors group-hover/slot:text-[color:var(--color-navy)]/70">
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
                <span className="font-mono text-[8px] uppercase tracking-[0.22em] md:text-[9px]">
                  Foto {i + 1}
                </span>
              </div>
            )}
          </button>
        );
      })}

      {/* Cara segura — borde sutil que marca dónde queda la cara
          trasera del cover (lo que se ve al frente). Lo demás envuelve
          los lados. */}
      {printDims.wrapMm > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute border border-dashed border-[color:var(--color-cream-soft)]/55"
          style={{
            left: `${safeInsetXPct}%`,
            top: `${safeInsetYPct}%`,
            right: `${safeInsetXPct}%`,
            bottom: `${safeInsetYPct}%`,
          }}
        />
      )}

      {/* Camera bbox — posicionada relative al cuerpo del telefono que
          está centrado dentro del print area. */}
      {model?.camera && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-[3px] bg-[color:var(--color-navy)]/65 ring-1 ring-[color:var(--color-cream-soft)]/40"
          style={{
            left: `${((printDims.wrapMm + model.camera[0]) / aspectW) * 100}%`,
            top: `${((printDims.wrapMm + model.camera[1]) / aspectH) * 100}%`,
            width: `${(model.camera[2] / aspectW) * 100}%`,
            height: `${(model.camera[3] / aspectH) * 100}%`,
          }}
        />
      )}
    </div>
  );
}
