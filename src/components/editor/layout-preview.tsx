"use client";

import { cn } from "@/lib/utils";
import type { LayoutDef } from "@/lib/data/layouts";
import {
  getPrintDimensions,
  type PhoneModelDef,
} from "@/lib/data/phone-models";

/**
 * Preview de un layout: renderiza los slots como divs posicionados,
 * dentro de la silueta del modelo elegido (forma del case + camara).
 *
 * Si no hay modelo, usa un aspect 9:18 default.
 *
 * El tamaño se controla por `height`. El width se calcula desde el aspect.
 *
 * El canvas representa el AREA DE IMPRESION TOTAL (cuerpo + wrap).
 */
export function LayoutPreview({
  layout,
  model,
  height = 130,
  selected = false,
  showCamera = true,
}: {
  layout: LayoutDef;
  model: PhoneModelDef | null;
  height?: number;
  selected?: boolean;
  showCamera?: boolean;
}) {
  const printDims = model
    ? getPrintDimensions(model)
    : { widthMm: 75, heightMm: 150, wrapMm: 0 };
  const aspectW = printDims.widthMm;
  const aspectH = printDims.heightMm;
  const width = (aspectW / aspectH) * height;
  const cornerRadius = model
    ? (model.cornerRadiusMm / aspectH) * height
    : 10;

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex-shrink-0 overflow-hidden border transition-colors",
        selected
          ? "border-[color:var(--color-navy)] bg-[color:var(--color-navy)]/12"
          : "border-[color:var(--color-navy)]/15 bg-[color:var(--color-navy)]/5",
      )}
      style={{
        width,
        height,
        borderRadius: cornerRadius,
      }}
    >
      {/* Slots */}
      {layout.slots.map((slot, i) => (
        <div
          key={i}
          className={cn(
            "absolute flex items-center justify-center text-[8px] font-mono font-semibold transition-colors",
            selected
              ? "bg-[color:var(--color-cream-warm)]/80 text-[color:var(--color-navy)]"
              : "bg-[color:var(--color-cream-soft)]/85 text-[color:var(--color-navy)]/45",
          )}
          style={{
            left: `${slot.x * 100}%`,
            top: `${slot.y * 100}%`,
            width: `${slot.w * 100}%`,
            height: `${slot.h * 100}%`,
            outline: "1px solid rgba(255,255,255,0.5)",
            outlineOffset: "-1px",
          }}
        >
          {layout.count <= 9 ? i + 1 : ""}
        </div>
      ))}

      {/* Camera bbox — coords del cuerpo del telefono, centrado dentro del
          print area (corrido por el wrap). */}
      {showCamera && model?.camera && (
        <div
          className="pointer-events-none absolute rounded-[3px] bg-[color:var(--color-navy)]/55 ring-1 ring-[color:var(--color-cream-soft)]/40"
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
