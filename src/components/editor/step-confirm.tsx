"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  Loader2,
  MessageCircle,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { findLayout } from "@/lib/data/layouts";
import { PHONE_MODELS } from "@/lib/data/phone-models";
import { composeFinalCover } from "@/lib/editor/image-utils";
import {
  dataUrlToBlob,
  getOriginalFile,
} from "@/lib/editor/original-photos";
import { whatsappUrl } from "@/lib/utils";

type Composed = {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
};

export function StepConfirm() {
  const { state, dispatch } = useEditor();

  const layout = useMemo(
    () => (state.layoutId ? findLayout(state.layoutId) : null),
    [state.layoutId],
  );
  const model = useMemo(
    () => PHONE_MODELS.find((m) => m.slug === state.modelSlug) ?? null,
    [state.modelSlug],
  );

  const [composed, setComposed] = useState<Composed | null>(null);
  const [composing, setComposing] = useState(true);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sharing, setSharing] = useState(false);

  // Componer al montar / cuando cambia algo
  useEffect(() => {
    if (!layout) return;
    setComposing(true);
    setComposeError(null);
    composeFinalCover(
      layout.slots,
      state.photos,
      {
        widthMm: model?.widthMm ?? 75,
        heightMm: model?.heightMm ?? 150,
      },
    )
      .then(setComposed)
      .catch(() => {
        setComposeError("No pude generar la imagen final. Probá recargar.");
      })
      .finally(() => setComposing(false));
  }, [layout, state.photos, model]);

  if (!layout) {
    return (
      <section className="mx-auto max-w-[920px] px-4 py-12 md:px-8">
        <p className="text-[14px] text-[color:var(--color-navy)]/65">
          Falta layout. Volvé a los pasos anteriores.
        </p>
      </section>
    );
  }

  function buildWhatsAppMessage(orderCode: string, adminUrl: string): string {
    const siteOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    const lines = [
      `Hola M90, quiero pedir mi cover. Pedido ${orderCode}.`,
      "",
      `· Modelo: ${model?.name ?? "(no especificado)"}`,
      `· Layout: ${layout!.count} foto${layout!.count > 1 ? "s" : ""} (${layout!.name.split(" · ")[1] ?? layout!.category})`,
      `· Precio: $15 USD`,
    ];
    if (note.trim()) {
      lines.push("", "Notas:", note.trim());
    }
    lines.push("", `Detalles: ${siteOrigin}${adminUrl}`);
    return lines.join("\n");
  }

  /**
   * Sube el pedido al backend (originales + preview), recibe el orderCode y
   * abre WhatsApp con un mensaje pre-llenado que incluye el codigo + URL del
   * admin para que M90 vea las fotos en alta resolucion.
   */
  async function handleShare() {
    if (!composed || !layout) return;
    setSharing(true);
    setComposeError(null);

    try {
      // Construimos el FormData con originales + preview + datos del pedido
      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          phoneModelSlug: model?.slug ?? "unknown",
          phoneModelName: model?.name ?? "Modelo no especificado",
          layoutId: layout.id,
          layoutName: layout.name,
          customerNotes: note.trim(),
          photos: state.photos.map((p) => ({
            slotIndex: p.slotIndex,
            transform: p.crop
              ? {
                  crop: { x: 0, y: 0 },
                  zoom: 1,
                  rotation: 0,
                  aspect: undefined,
                }
              : null,
          })),
        }),
      );

      for (const p of state.photos) {
        const original = getOriginalFile(p.slotIndex);
        if (original) {
          fd.append(`photo_${p.slotIndex}`, original, original.name);
        } else {
          // Fallback: si perdimos el original (recargo de pagina), mandamos
          // la version cropeada como blob — calidad menor pero printable.
          fd.append(
            `photo_${p.slotIndex}`,
            dataUrlToBlob(p.src),
            `slot-${p.slotIndex}.jpg`,
          );
        }
      }
      fd.append("preview", composed.blob, "preview.jpg");

      const res = await fetch("/api/orders", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }

      const result: { code: string; adminUrl: string } = await res.json();
      const message = buildWhatsAppMessage(result.code, result.adminUrl);
      const url = whatsappUrl(message);

      // Abrir WhatsApp con el mensaje pre-llenado. El cliente solo presiona
      // "Enviar" — no se puede automatizar mas que esto sin WhatsApp Business API.
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("[step-confirm] order submit failed:", err);
      setComposeError(
        err instanceof Error
          ? `No pude enviar el pedido: ${err.message}`
          : "No pude enviar el pedido. Probá de nuevo.",
      );
    } finally {
      setSharing(false);
    }
  }

  function triggerDownload() {
    if (!composed) return;
    const link = document.createElement("a");
    link.href = composed.dataUrl;
    link.download = `m90-cover-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleReset() {
    if (
      !window.confirm(
        "¿Empezar de cero? Vas a perder el modelo, el layout y todas las fotos cargadas.",
      )
    )
      return;
    dispatch({ type: "RESET" });
  }

  const aspectW = model ? model.widthMm : 75;
  const aspectH = model ? model.heightMm : 150;
  const isPortrait = aspectH >= aspectW;
  const previewMaxH = isPortrait ? 520 : 380;
  const previewW = (aspectW / aspectH) * previewMaxH;
  const cornerRadius = model
    ? (model.cornerRadiusMm / model.heightMm) * previewMaxH
    : 12;

  return (
    <section className="mx-auto max-w-[920px] px-4 pb-4 pt-6 md:px-8 md:pt-12">
      <div className="mb-6 md:mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
          · Paso 4 de 4
        </span>
        <h1 className="mt-2 font-display text-[clamp(34px,7.5vw,64px)] italic leading-[0.98] text-[color:var(--color-navy)]">
          Confirmá tu cover
        </h1>
        <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[15px]">
          Así va a quedar tu funda. Si está bien, mandá el pedido por WhatsApp
          y te respondemos en minutos.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-10">
        {/* Preview de la imagen final */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative flex-shrink-0 overflow-hidden bg-[color:var(--color-navy)]/8 shadow-[0_30px_80px_-30px_rgba(1,27,83,0.5)]"
            style={{
              width: previewW,
              height: previewMaxH,
              borderRadius: cornerRadius,
            }}
          >
            {composing && (
              <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--color-cream-soft)]">
                <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-navy)]/40" />
              </div>
            )}
            {composed && !composing && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={composed.dataUrl}
                alt="Preview del cover"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {composeError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 px-4 text-center text-[12px] text-red-700">
                {composeError}
              </div>
            )}
            {/* Camera bbox overlay (preview) */}
            {model?.camera && composed && (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-[3px] bg-[color:var(--color-navy)]/65 ring-1 ring-[color:var(--color-cream-soft)]/40"
                style={{
                  left: `${(model.camera[0] / model.widthMm) * 100}%`,
                  top: `${(model.camera[1] / model.heightMm) * 100}%`,
                  width: `${(model.camera[2] / model.widthMm) * 100}%`,
                  height: `${(model.camera[3] / model.heightMm) * 100}%`,
                }}
              />
            )}
          </div>

          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-navy)]/45 md:text-[10px]">
            Preview · final {composed && `· ${composed.width}×${composed.height}px`}
          </p>
        </div>

        {/* Resumen + acciones */}
        <div className="flex flex-col gap-6">
          {/* Order summary */}
          <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 md:p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Resumen del pedido
            </h2>
            <dl className="mt-4 space-y-3 text-[13px] md:text-[14px]">
              <SummaryRow label="Modelo" value={model?.name ?? "—"} />
              <SummaryRow
                label="Layout"
                value={`${layout.count} foto${layout.count > 1 ? "s" : ""} · ${layout.name.split(" · ")[1] ?? layout.category}`}
              />
              <SummaryRow
                label="Fotos"
                value={`${state.photos.length} / ${layout.count} cargadas`}
              />
              <div className="flex items-baseline justify-between border-t border-[color:var(--color-navy)]/10 pt-3">
                <dt className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55 md:text-[13px]">
                  Total
                </dt>
                <dd className="font-display text-[28px] leading-none text-[color:var(--color-navy)] md:text-[32px]">
                  $15 <span className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55">USD</span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Notas opcionales */}
          <div>
            <label
              htmlFor="note"
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]"
            >
              · Notas para M90 (opcional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: prefiero entrega en La Habana Vieja después de las 6 pm…"
              rows={3}
              maxLength={400}
              className="mt-2 w-full resize-none rounded-2xl border border-[color:var(--color-navy)]/15 bg-white px-4 py-3 text-[13px] text-[color:var(--color-navy)] placeholder:text-[color:var(--color-navy)]/35 focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15 md:text-[14px]"
            />
            <p className="mt-1 text-right text-[10px] text-[color:var(--color-navy)]/40 md:text-[11px]">
              {note.length} / 400
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleShare}
              disabled={sharing || composing || !composed}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.22em] text-white shadow-[0_18px_40px_-18px_rgba(37,211,102,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-16px_rgba(37,211,102,0.7)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[color:var(--color-navy)]/15 disabled:text-[color:var(--color-navy)]/40 disabled:shadow-none disabled:hover:transform-none"
            >
              {sharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              <span>Pedir por WhatsApp</span>
            </button>

            <button
              onClick={triggerDownload}
              disabled={composing || !composed}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)] transition-all hover:border-[color:var(--color-navy)]/35 hover:bg-[color:var(--color-navy)]/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Descargar imagen</span>
            </button>
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 self-start text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/45 transition-colors hover:text-[color:var(--color-navy)]/80 md:text-[12px]"
          >
            <RotateCcw className="h-3 w-3" />
            Empezar de cero
          </button>
        </div>
      </div>

      {/* Disclaimer pequeño */}
      <p className="mx-auto mt-10 max-w-[60ch] text-balance text-center font-mono text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-navy)]/35 md:mt-14 md:text-[10px]">
        · Pago a la entrega · TPU resistente · Hecho a mano en La Habana ·
      </p>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[12px] uppercase tracking-[0.16em] text-[color:var(--color-navy)]/55 md:text-[13px]">
        {label}
      </dt>
      <dd className="text-right font-display text-[15px] italic leading-tight text-[color:var(--color-navy)] md:text-[16px]">
        {value}
      </dd>
    </div>
  );
}
