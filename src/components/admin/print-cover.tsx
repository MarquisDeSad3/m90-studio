"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FlipHorizontal2,
  Loader2,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Página de impresión optimizada para Epson L1250 (o cualquier impresora
 * A4) con papel de sublimación.
 *
 * Flujo de sublimación:
 *  1. Imprimís en papel de sublimación con tinta de sub (la imagen sale
 *     ESPEJADA en el papel)
 *  2. Aplicás calor con prensa térmica sobre la placa blanca del cover
 *  3. La tinta se transfiere y queda al derecho en el cover
 *
 * El toggle "espejar" arranca en ON SIEMPRE porque el flujo confirmado
 * con M90 es que TODOS los pedidos (normal + coated) se imprimen vía
 * sublimación. Si en algún momento cambia el proceso para "normal", se
 * usa el toggle manual.
 *
 * El @page es A4 (210×297mm) porque es lo que la L1250 acepta. La imagen
 * va centrada al tamaño físico exacto en mm; el resto del papel queda en
 * blanco para que cortes después.
 *
 * IMPORTANTE en el dialogo de impresión:
 *  - "Tamaño real" / "100%" (NO ajustar a página)
 *  - Márgenes: 0
 *  - Papel: A4
 */

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export function PrintCover({
  code,
  imageUrl,
  widthMm,
  heightMm,
  coverType,
  autoPrint = false,
}: {
  code: string;
  imageUrl: string;
  widthMm: number;
  heightMm: number;
  coverType: "normal" | "coated";
  /** Si true, dispara window.print() automáticamente al cargar la imagen.
      Default false porque preferimos que el usuario revise mirror antes. */
  autoPrint?: boolean;
}) {
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  // Mirror default: ON siempre (todos los pedidos van por sublimación)
  // Nota: `coverType` se mantiene en props por si en el futuro se
  // diferencia el proceso por tipo de funda.
  const [mirror, setMirror] = useState(true);
  const [showCutMarks, setShowCutMarks] = useState(true);
  const [autoTriggered, setAutoTriggered] = useState(false);

  useEffect(() => {
    if (!autoPrint || imgState !== "loaded" || autoTriggered) return;
    setAutoTriggered(true);
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [autoPrint, imgState, autoTriggered]);

  const dpi300W = Math.round((widthMm * 300) / 25.4);
  const dpi300H = Math.round((heightMm * 300) / 25.4);

  // Imagen centrada en A4 portrait
  const offsetXmm = (A4_WIDTH_MM - widthMm) / 2;
  const offsetYmm = (A4_HEIGHT_MM - heightMm) / 2;

  const imgTransform = mirror ? "scaleX(-1)" : "none";

  return (
    <>
      {/* CSS dinámico — A4 + posicionamiento exacto + mirror */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 0;
            }
            @media print {
              html, body {
                margin: 0;
                padding: 0;
                background: white;
                width: ${A4_WIDTH_MM}mm;
                height: ${A4_HEIGHT_MM}mm;
              }
              .no-print { display: none !important; }
              .print-page {
                position: absolute !important;
                inset: 0 !important;
                width: ${A4_WIDTH_MM}mm !important;
                height: ${A4_HEIGHT_MM}mm !important;
                background: white !important;
                box-shadow: none !important;
                padding: 0 !important;
              }
              .print-image-wrap {
                position: absolute !important;
                left: ${offsetXmm}mm !important;
                top: ${offsetYmm}mm !important;
                width: ${widthMm}mm !important;
                height: ${heightMm}mm !important;
                overflow: hidden !important;
              }
              .print-image {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                display: block !important;
                transform: ${imgTransform} !important;
              }
              .cut-mark {
                position: absolute !important;
                background: #888 !important;
              }
            }
          `,
        }}
      />

      <div className="min-h-screen bg-neutral-100">
        {/* Toolbar */}
        <div className="no-print sticky top-0 z-50 border-b border-[color:var(--color-navy)]/10 bg-white shadow-sm">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]">
                · Imprimir · {code}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-[color:var(--color-navy)]/55">
                <strong>{widthMm} × {heightMm} mm</strong> ({dpi300W}×{dpi300H}px @300dpi) en A4 ·{" "}
                <strong>{coverType === "coated" ? "Recubrimiento (sublimación)" : "Normal (TPU)"}</strong>
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04]"
              >
                <ArrowLeft className="h-3 w-3" />
                <span className="hidden sm:inline">Volver</span>
              </button>
              <a
                href={imageUrl}
                download={`${code}-print-${widthMm}x${heightMm}mm${mirror ? "-mirror" : ""}.jpg`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04]"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">JPG</span>
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--color-navy)] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {imgState === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Printer className="h-3.5 w-3.5" />
                )}
                Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* Settings + tips */}
        <div className="no-print mx-auto max-w-[1200px] px-4 pt-5 md:px-6">
          <div className="grid gap-3 md:grid-cols-[auto_1fr]">
            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--color-navy)]/10 bg-white p-3">
              <button
                type="button"
                onClick={() => setMirror((m) => !m)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors",
                  mirror
                    ? "bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]"
                    : "border border-[color:var(--color-navy)]/15 bg-white text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04]",
                )}
              >
                <FlipHorizontal2 className="h-3.5 w-3.5" />
                Espejar {mirror ? "ON" : "OFF"}
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/65">
                <input
                  type="checkbox"
                  checked={showCutMarks}
                  onChange={(e) => setShowCutMarks(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Marcas de corte
              </label>
            </div>

            {/* Tips contextual */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900 md:p-3.5 md:text-[13px]">
              <strong>Epson L1250 + papel de sublimación:</strong> en el diálogo
              de impresión usá <strong>&ldquo;Tamaño real&rdquo;</strong> /{" "}
              <strong>100%</strong>, márgenes en <strong>0</strong>, papel{" "}
              <strong>A4</strong>. <strong>Espejar ON</strong> es el default
              para sublimación — al transferir por calor la imagen queda al
              derecho en el cover.
            </div>
          </div>
        </div>

        {/* Página A4 con la imagen al tamaño exacto */}
        <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
          <div className="flex flex-col items-center gap-3">
            <div
              className="print-page relative bg-white shadow-2xl"
              style={{
                aspectRatio: `${A4_WIDTH_MM} / ${A4_HEIGHT_MM}`,
                width: "min(100%, 480px)",
              }}
            >
              {/* Imagen posicionada como va a quedar en A4 */}
              <div
                className="print-image-wrap absolute overflow-hidden"
                style={{
                  left: `${(offsetXmm / A4_WIDTH_MM) * 100}%`,
                  top: `${(offsetYmm / A4_HEIGHT_MM) * 100}%`,
                  width: `${(widthMm / A4_WIDTH_MM) * 100}%`,
                  height: `${(heightMm / A4_HEIGHT_MM) * 100}%`,
                }}
              >
                {imgState === "loading" && (
                  <div className="absolute inset-0 grid place-items-center bg-neutral-50">
                    <Loader2 className="h-5 w-5 animate-spin text-[color:var(--color-navy)]/40" />
                  </div>
                )}
                {imgState === "error" && (
                  <div className="absolute inset-0 grid place-items-center bg-red-50 px-2 text-center text-[10px] text-red-700">
                    Error
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt={`Print ready ${code}`}
                  onLoad={() => setImgState("loaded")}
                  onError={() => setImgState("error")}
                  className="print-image block h-full w-full object-cover"
                  style={{ transform: imgTransform }}
                  draggable={false}
                />
              </div>

              {/* Cut marks (esquinas) */}
              {showCutMarks && (
                <CutMarks
                  offsetXmm={offsetXmm}
                  offsetYmm={offsetYmm}
                  widthMm={widthMm}
                  heightMm={heightMm}
                />
              )}
            </div>
            <p className="no-print font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
              Hoja A4 · imagen al tamaño físico exacto
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/** Líneas de corte en las 4 esquinas de la zona de imagen, para que sepas
    dónde cortar después de imprimir. */
function CutMarks({
  offsetXmm,
  offsetYmm,
  widthMm,
  heightMm,
}: {
  offsetXmm: number;
  offsetYmm: number;
  widthMm: number;
  heightMm: number;
}) {
  const lengthPct = 2; // 2% de A4 = ~5mm de marca
  const thicknessPct = 0.15;
  const left = (offsetXmm / A4_WIDTH_MM) * 100;
  const top = (offsetYmm / A4_HEIGHT_MM) * 100;
  const right = left + (widthMm / A4_WIDTH_MM) * 100;
  const bottom = top + (heightMm / A4_HEIGHT_MM) * 100;

  const marks: { style: React.CSSProperties }[] = [
    // Top-left
    { style: { left: `${left - lengthPct}%`, top: `${top}%`, width: `${lengthPct}%`, height: `${thicknessPct}%` } },
    { style: { left: `${left}%`, top: `${top - lengthPct}%`, width: `${thicknessPct}%`, height: `${lengthPct}%` } },
    // Top-right
    { style: { left: `${right}%`, top: `${top}%`, width: `${lengthPct}%`, height: `${thicknessPct}%` } },
    { style: { left: `${right - thicknessPct}%`, top: `${top - lengthPct}%`, width: `${thicknessPct}%`, height: `${lengthPct}%` } },
    // Bottom-left
    { style: { left: `${left - lengthPct}%`, top: `${bottom - thicknessPct}%`, width: `${lengthPct}%`, height: `${thicknessPct}%` } },
    { style: { left: `${left}%`, top: `${bottom}%`, width: `${thicknessPct}%`, height: `${lengthPct}%` } },
    // Bottom-right
    { style: { left: `${right}%`, top: `${bottom - thicknessPct}%`, width: `${lengthPct}%`, height: `${thicknessPct}%` } },
    { style: { left: `${right - thicknessPct}%`, top: `${bottom}%`, width: `${thicknessPct}%`, height: `${lengthPct}%` } },
  ];

  return (
    <>
      {marks.map((m, i) => (
        <div
          key={i}
          className="cut-mark absolute bg-[color:var(--color-navy)]/55"
          style={m.style}
        />
      ))}
    </>
  );
}
