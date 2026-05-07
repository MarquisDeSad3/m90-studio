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
import { useEditor, usePhoneModel } from "@/lib/editor/store";
import { useConfirm } from "@/components/ui/confirm-provider";
import { findLayout } from "@/lib/data/layouts";
import { getPrintDimensions } from "@/lib/data/phone-models";
import { composeFinalCover } from "@/lib/editor/image-utils";
import {
  dataUrlToBlob,
  getOriginalFile,
} from "@/lib/editor/original-photos";
import { cn, whatsappUrl } from "@/lib/utils";
import { CoverPreview } from "@/components/cover-preview";

type Composed = {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
};

export function StepConfirm() {
  const { state, dispatch } = useEditor();
  const confirm = useConfirm();

  const layout = useMemo(
    () => (state.layoutId ? findLayout(state.layoutId) : null),
    [state.layoutId],
  );
  const model = usePhoneModel(state.modelSlug);

  const [composed, setComposed] = useState<Composed | null>(null);
  const [composing, setComposing] = useState(true);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Precios runtime (admin los puede cambiar). Default a los seed iniciales
  // si la API esta caida — el editor no debe quedar bloqueado por eso.
  const [pricing, setPricing] = useState<{
    normal: { usdCents: number; cup: number };
    coated: { usdCents: number; cup: number };
  }>({
    normal: { usdCents: 700, cup: 2100 },
    coated: { usdCents: 1500, cup: 4500 },
  });

  useEffect(() => {
    let alive = true;
    fetch("/api/pricing", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        if (data.normal && data.coated) setPricing(data);
      })
      .catch(() => {
        // Sin red o DB caida: dejamos los defaults
      });
    return () => {
      alive = false;
    };
  }, []);

  const currentPrice = pricing[state.coverType];
  /** Cuando el pedido se creo en backend. UI cambia a pantalla de exito
      con boton directo a WhatsApp (link real, no window.open — los popup
      blockers mobile bloquean window.open despues de await fetch). */
  const [submitted, setSubmitted] = useState<{
    code: string;
    waUrl: string;
  } | null>(null);

  // Tamaño del area imprimible: cuerpo del telefono + (grosor + 3mm) por
  // cada lado (wrap para que la sublimación cubra los costados también).
  const printDims = useMemo(
    () =>
      model
        ? getPrintDimensions(model)
        : { widthMm: 75, heightMm: 150, wrapMm: 0 },
    [model],
  );

  // Componer UNA sola vez a 200 DPI (compromiso: printable + rapido en
  // mobile cubano). Reusamos este blob para preview Y print-ready.
  useEffect(() => {
    if (!layout) return;
    setComposing(true);
    setComposeError(null);
    composeFinalCover(
      layout.slots,
      state.photos,
      {
        widthMm: printDims.widthMm,
        heightMm: printDims.heightMm,
      },
      { dpi: 200, quality: 0.9 },
    )
      .then(setComposed)
      .catch(() => {
        setComposeError("No pude generar la imagen final. Probá recargar.");
      })
      .finally(() => setComposing(false));
  }, [layout, state.photos, printDims]);

  if (!layout) {
    return (
      <section className="mx-auto max-w-[920px] px-4 py-12 md:px-8">
        <p className="text-[14px] text-[color:var(--color-navy)]/65">
          Falta layout. Volvé a los pasos anteriores.
        </p>
      </section>
    );
  }

  /* ============================================================
     Validacion del cliente — nombre y telefono OBLIGATORIOS
     ============================================================ */
  const trimmedName = customerName.trim();
  const trimmedPhone = customerPhone.trim();
  const phoneDigits = trimmedPhone.replace(/[^\d]/g, "");

  const nameError =
    trimmedName.length === 0
      ? "Ponete un nombre"
      : trimmedName.length < 2
        ? "Nombre demasiado corto"
        : null;
  const phoneError =
    phoneDigits.length === 0
      ? "Ponete un número de WhatsApp"
      : phoneDigits.length < 7
        ? "Número demasiado corto"
        : phoneDigits.length > 16
          ? "Número demasiado largo"
          : null;
  const formValid = !nameError && !phoneError;

  /* ============================================================
     PANTALLA DE ÉXITO — pedido ya creado, falta que el usuario
     toque "Enviar por WhatsApp". El link <a target="_blank"> es
     un click directo del usuario, asi NO lo bloquean popup blockers.
     ============================================================ */
  if (submitted) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[640px] flex-col items-center justify-center px-5 py-12 text-center md:px-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/15 ring-1 ring-[#25D366]/30 md:h-24 md:w-24">
          <Check className="h-9 w-9 text-[#25D366] md:h-11 md:w-11" strokeWidth={2.5} />
        </div>

        <span className="mt-6 font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-navy-500)]">
          · Pedido creado
        </span>
        <h1 className="mt-3 font-display text-[clamp(40px,8vw,72px)] italic leading-[0.95] text-[color:var(--color-navy)]">
          {submitted.code}
        </h1>
        <p className="mt-5 max-w-[44ch] text-[14px] leading-relaxed text-[color:var(--color-navy)]/70 md:text-[15px]">
          Tocá el botón verde para confirmar tu pedido por WhatsApp. M90
          recibe el mensaje con tu código y todas las fotos en alta calidad.
        </p>

        <a
          href={submitted.waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#25D366] px-7 py-5 text-[14px] font-semibold uppercase tracking-[0.22em] text-white shadow-[0_22px_50px_-18px_rgba(37,211,102,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-18px_rgba(37,211,102,0.7)] active:scale-[0.98] sm:w-auto"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Enviar por WhatsApp</span>
        </a>

        <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45 md:text-[12px]">
          Si no te abre, copiá el código y mandanos &quot;Hola M90, pedido{" "}
          {submitted.code}&quot;.
        </p>

        <button
          onClick={() => {
            dispatch({ type: "RESET" });
            setSubmitted(null);
          }}
          className="mt-10 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)]"
        >
          <RotateCcw className="h-3 w-3" />
          Hacer otro pedido
        </button>
      </section>
    );
  }

  function buildWhatsAppMessage(orderCode: string, adminUrl: string): string {
    const siteOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    const coverLabel =
      state.coverType === "coated"
        ? "Recubrimiento (placa blanca 2-en-1)"
        : "Normal";
    const usd = (currentPrice.usdCents / 100).toFixed(0);
    const lines = [
      `Hola M90, quiero pedir mi cover. Pedido ${orderCode}.`,
      "",
      `· Modelo: ${state.modelDisplayName ?? model?.name ?? "(no especificado)"}`,
      `· Layout: ${layout!.count} foto${layout!.count > 1 ? "s" : ""} (${layout!.name.split(" · ")[1] ?? layout!.category})`,
      `· Tipo: ${coverLabel}`,
      `· Precio: $${usd} USD`,
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
    setTouched(true);
    if (!formValid) {
      setComposeError("Necesitamos tu nombre y número de WhatsApp.");
      return;
    }
    setSharing(true);
    setComposeError(null);

    try {
      // Reusamos el blob ya generado en useEffect (200 DPI). NO recomponer
      // aca — el doble compose colgaba mobiles viejos.
      // Construimos el FormData con originales + preview + datos del pedido
      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          phoneModelSlug: model?.slug ?? "unknown",
          // Si el cliente eligio un alias específico (ej. "iPhone 13" dentro
          // del grupo "iPhone 12 / 13 / 14"), mandamos ese — más informativo
          // en WhatsApp y en el admin que el nombre del grupo.
          phoneModelName:
            state.modelDisplayName ?? model?.name ?? "Modelo no especificado",
          coverType: state.coverType,
          layoutId: layout.id,
          layoutName: layout.name,
          // Dimensiones del area de impresion: cuerpo + 2*(grosor + 3mm
          // de curvatura) en cada eje. Esto incluye el wrap que envuelve
          // los costados del cover en la sublimación.
          widthMm: printDims.widthMm,
          heightMm: printDims.heightMm,
          cornerRadiusMm: model?.cornerRadiusMm,
          cameraBox: model?.camera
            ? {
                x: model.camera[0],
                y: model.camera[1],
                w: model.camera[2],
                h: model.camera[3],
              }
            : null,
          customerName: trimmedName,
          customerPhone: phoneDigits,
          customerNotes: note.trim(),
          photos: state.photos.map((p) => ({
            slotIndex: p.slotIndex,
            // cropFraction (0..1) describe el recorte de forma indep de la
            // resolucion. El server lo aplica al ORIGINAL en max calidad
            // con sharp cuando compone el print-ready.
            transform: p.cropFraction
              ? {
                  crop: { x: 0, y: 0 },
                  zoom: 1,
                  rotation: 0,
                  cropFraction: p.cropFraction,
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
        // Cropped — version aplicada por el cliente. El server la guarda
        // separada del original asi el admin tiene ambas: original sin
        // tocar + recorte tal cual lo vio el cliente. Util como backup si
        // el server compose falla, o para descargar exactamente lo que el
        // cliente eligio.
        fd.append(
          `cropped_${p.slotIndex}`,
          dataUrlToBlob(p.src),
          `cropped-${p.slotIndex}.jpg`,
        );
      }
      // El mismo blob (200 DPI) sirve como preview Y print-ready (por ahora;
      // en server-side compose el printReady lo va a regenerar el backend).
      fd.append("preview", composed.blob, "preview.jpg");
      fd.append("printReady", composed.blob, "print-ready.jpg");

      // Timeout 90s — si el upload se traba en 3G cubano, falla en lugar
      // de quedarse pegado infinitamente con el spinner
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch("/api/orders", {
          method: "POST",
          body: fd,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }

      const result: { code: string; adminUrl: string } = await res.json();
      const message = buildWhatsAppMessage(result.code, result.adminUrl);
      const url = whatsappUrl(message);

      // No abrimos WhatsApp con window.open: los popup blockers movil lo
      // bloquean despues de un await fetch porque pierden la "user gesture
      // chain". En su lugar mostramos pantalla de exito con un link <a>
      // directo a wa.me — el click del usuario ahi SI abre WhatsApp.
      setSubmitted({ code: result.code, waUrl: url });
    } catch (err) {
      console.error("[step-confirm] order submit failed:", err);
      const msg =
        err instanceof Error && err.name === "AbortError"
          ? "El envío tardó demasiado. Probá de nuevo con mejor conexión."
          : err instanceof Error
            ? `No pude enviar el pedido: ${err.message}`
            : "No pude enviar el pedido. Probá de nuevo.";
      setComposeError(msg);
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

  async function handleReset() {
    const ok = await confirm({
      title: "¿Empezar de cero?",
      message:
        "Vas a perder el modelo, el layout y todas las fotos cargadas.",
      confirmLabel: "Empezar de cero",
      variant: "danger",
    });
    if (!ok) return;
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
        {/* Preview de la funda con la foto integrada */}
        <div className="flex flex-col items-center gap-3">
          {composing ? (
            <div
              className="relative grid flex-shrink-0 place-items-center bg-[color:var(--color-cream-soft)]"
              style={{
                width: previewW,
                height: previewMaxH,
                borderRadius: cornerRadius,
              }}
            >
              <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-navy)]/40" />
            </div>
          ) : composeError ? (
            <div
              className="grid flex-shrink-0 place-items-center bg-red-50 px-4 text-center text-[12px] text-red-700"
              style={{
                width: previewW,
                height: previewMaxH,
                borderRadius: cornerRadius,
              }}
            >
              {composeError}
            </div>
          ) : (
            <CoverPreview
              photoUrl={composed?.dataUrl ?? null}
              coverType={state.coverType}
              model={
                model
                  ? {
                      widthMm: model.widthMm,
                      heightMm: model.heightMm,
                      cornerRadiusMm: model.cornerRadiusMm,
                      camera: model.camera,
                      name: model.name,
                    }
                  : {
                      widthMm: 75,
                      heightMm: 150,
                      cornerRadiusMm: 12,
                      camera: null,
                    }
              }
              printSize={{
                widthMm: printDims.widthMm,
                heightMm: printDims.heightMm,
              }}
              height={previewMaxH}
            />
          )}

          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-navy)]/45 md:text-[10px]">
            {state.coverType === "coated" ? "Funda recubrimiento" : "Funda normal"}{" "}
            {composed && `· ${composed.width}×${composed.height}px`}
          </p>
        </div>

        {/* Resumen + acciones */}
        <div className="flex flex-col gap-6">
          {/* Selector de tipo de funda */}
          <CoverTypeSelector
            value={state.coverType}
            normalUsd={pricing.normal.usdCents / 100}
            coatedUsd={pricing.coated.usdCents / 100}
            onChange={(t) =>
              dispatch({ type: "SET_COVER_TYPE", coverType: t })
            }
          />

          {/* Order summary */}
          <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 md:p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Resumen del pedido
            </h2>
            <dl className="mt-4 space-y-3 text-[13px] md:text-[14px]">
              <SummaryRow
                label="Modelo"
                value={state.modelDisplayName ?? model?.name ?? "—"}
              />
              <SummaryRow
                label="Layout"
                value={`${layout.count} foto${layout.count > 1 ? "s" : ""} · ${layout.name.split(" · ")[1] ?? layout.category}`}
              />
              <SummaryRow
                label="Fotos"
                value={`${state.photos.length} / ${layout.count} cargadas`}
              />
              <SummaryRow
                label="Tipo"
                value={
                  state.coverType === "coated"
                    ? "Recubrimiento (placa blanca)"
                    : "Normal"
                }
              />
              <div className="flex items-baseline justify-between border-t border-[color:var(--color-navy)]/10 pt-3">
                <dt className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55 md:text-[13px]">
                  Total
                </dt>
                <dd className="font-display text-[28px] leading-none text-[color:var(--color-navy)] md:text-[32px]">
                  ${(currentPrice.usdCents / 100).toFixed(0)}{" "}
                  <span className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55">
                    USD
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Datos del cliente — OBLIGATORIOS */}
          <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 md:p-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Tus datos
            </h3>
            <p className="mt-1 text-[12px] text-[color:var(--color-navy)]/55 md:text-[13px]">
              Necesarios para coordinar el pedido por WhatsApp.
            </p>

            <div className="mt-4 flex flex-col gap-4">
              {/* Nombre */}
              <div>
                <label
                  htmlFor="customer-name"
                  className="block text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/65"
                >
                  Nombre <span className="text-red-700">*</span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  inputMode="text"
                  autoComplete="name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Tu nombre completo"
                  maxLength={120}
                  className={cn(
                    "mt-1.5 h-11 w-full rounded-full border bg-[color:var(--color-paper)] px-4 text-[14px] text-[color:var(--color-navy)] placeholder:text-[color:var(--color-navy)]/35 focus:outline-none focus:ring-2 md:text-[15px]",
                    nameError && touched
                      ? "border-red-500 focus:border-red-600 focus:ring-red-500/15"
                      : "border-[color:var(--color-navy)]/15 focus:border-[color:var(--color-navy-500)] focus:ring-[color:var(--color-navy-500)]/15",
                  )}
                />
                {nameError && touched && (
                  <p className="mt-1 text-[12px] text-red-700">{nameError}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label
                  htmlFor="customer-phone"
                  className="block text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/65"
                >
                  Teléfono (WhatsApp){" "}
                  <span className="text-red-700">*</span>
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="5363285022"
                  maxLength={20}
                  className={cn(
                    "mt-1.5 h-11 w-full rounded-full border bg-[color:var(--color-paper)] px-4 text-[14px] text-[color:var(--color-navy)] placeholder:text-[color:var(--color-navy)]/35 focus:outline-none focus:ring-2 md:text-[15px]",
                    phoneError && touched
                      ? "border-red-500 focus:border-red-600 focus:ring-red-500/15"
                      : "border-[color:var(--color-navy)]/15 focus:border-[color:var(--color-navy-500)] focus:ring-[color:var(--color-navy-500)]/15",
                  )}
                />
                {phoneError && touched && (
                  <p className="mt-1 text-[12px] text-red-700">{phoneError}</p>
                )}
                <p className="mt-1 text-[10px] text-[color:var(--color-navy)]/45 md:text-[11px]">
                  Solo números. Sin espacios ni guiones.
                </p>
              </div>
            </div>
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
              disabled={sharing || composing || !composed || !formValid}
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

function CoverTypeSelector({
  value,
  normalUsd,
  coatedUsd,
  onChange,
}: {
  value: "normal" | "coated";
  normalUsd: number;
  coatedUsd: number;
  onChange: (t: "normal" | "coated") => void;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 md:p-6">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
        · Tipo de funda
      </h2>
      <p className="mt-1 text-[12px] text-[color:var(--color-navy)]/55 md:text-[13px]">
        Elegí cómo quieres que se imprima.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <CoverOption
          selected={value === "normal"}
          onSelect={() => onChange("normal")}
          title="Normal"
          subtitle="Transferencia sobre TPU"
          desc="Tinta directa sobre la funda flexible."
          priceUsd={normalUsd}
          mockup={<NormalMockup />}
        />
        <CoverOption
          selected={value === "coated"}
          onSelect={() => onChange("coated")}
          title="Recubrimiento"
          subtitle="Placa blanca 2-en-1"
          desc="Imagen sobre lámina blanca de aluminio."
          priceUsd={coatedUsd}
          recommended
          mockup={<CoatedMockup />}
        />
      </div>
    </div>
  );
}

function CoverOption({
  selected,
  onSelect,
  title,
  subtitle,
  desc,
  priceUsd,
  recommended,
  mockup,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  desc: string;
  priceUsd: number;
  recommended?: boolean;
  mockup: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-[color:var(--color-navy)] bg-[color:var(--color-navy)]/[0.04] shadow-[0_10px_30px_-12px_rgba(1,27,83,0.32)]"
          : "border-[color:var(--color-navy)]/12 hover:border-[color:var(--color-navy)]/30 active:scale-[0.99]",
      )}
    >
      {recommended && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
          recom.
        </span>
      )}
      <div className="flex w-full items-start gap-3">
        <div className="flex h-[88px] w-[60px] flex-shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-paper)]">
          {mockup}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[16px] leading-tight text-[color:var(--color-navy)] md:text-[17px]">
              {title}
            </span>
            {selected && (
              <Check
                className="h-3.5 w-3.5 text-[color:var(--color-navy)]"
                strokeWidth={3}
              />
            )}
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55 md:text-[10px]">
            {subtitle}
          </span>
          <span className="text-[12px] leading-snug text-[color:var(--color-navy)]/65 md:text-[13px]">
            {desc}
          </span>
          <span className="mt-1 font-display text-[18px] leading-none text-[color:var(--color-navy)] md:text-[20px]">
            ${priceUsd.toFixed(0)}{" "}
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55">
              USD
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}

/** Mockup ilustrativo de funda Normal: TPU translúcido con foto colorida
    visible a través (representando la impresión directa sobre el plástico). */
function NormalMockup() {
  return (
    <svg
      viewBox="0 0 60 88"
      aria-hidden
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="m90-photo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id="m90-tpu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Foto del cliente "imprimida" sobre el TPU (representativa) */}
      <rect x="3" y="3" width="54" height="82" rx="8" fill="url(#m90-photo)" />
      {/* Capa TPU translúcida encima */}
      <rect
        x="3"
        y="3"
        width="54"
        height="82"
        rx="8"
        fill="url(#m90-tpu)"
        stroke="#0b1e4d"
        strokeOpacity="0.18"
        strokeWidth="0.6"
      />
      {/* Recorte cámara */}
      <rect
        x="9"
        y="9"
        width="18"
        height="18"
        rx="3"
        fill="#0b1e4d"
        fillOpacity="0.6"
      />
      {/* Lentes */}
      <circle cx="14" cy="14" r="2" fill="#0b1e4d" fillOpacity="0.85" />
      <circle cx="22" cy="14" r="2" fill="#0b1e4d" fillOpacity="0.85" />
      <circle cx="14" cy="22" r="2" fill="#0b1e4d" fillOpacity="0.85" />
    </svg>
  );
}

/** Mockup ilustrativo de funda con Recubrimiento: TPU transparente con
    placa blanca de aluminio encima (la 2-en-1, lo que muestra la foto del
    proveedor: funda + placa de sublimación). */
function CoatedMockup() {
  return (
    <svg
      viewBox="0 0 60 88"
      aria-hidden
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="m90-coated-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f3f5" />
        </linearGradient>
        <linearGradient id="m90-coated-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* TPU transparente atrás (apenas visible) */}
      <rect
        x="3"
        y="3"
        width="54"
        height="82"
        rx="8"
        fill="#e2e8f0"
        fillOpacity="0.4"
        stroke="#0b1e4d"
        strokeOpacity="0.12"
        strokeWidth="0.6"
      />
      {/* Placa blanca de aluminio encima — característica del 2-en-1 */}
      <rect
        x="6"
        y="14"
        width="48"
        height="68"
        rx="5"
        fill="url(#m90-coated-plate)"
        stroke="#0b1e4d"
        strokeOpacity="0.15"
        strokeWidth="0.4"
      />
      {/* Brillo sutil para indicar superficie reflectiva */}
      <rect
        x="6"
        y="14"
        width="48"
        height="68"
        rx="5"
        fill="url(#m90-coated-shine)"
      />
      {/* Recorte cámara (queda fuera de la placa, en la zona de TPU expuesto) */}
      <rect
        x="9"
        y="6"
        width="18"
        height="18"
        rx="3"
        fill="#0b1e4d"
        fillOpacity="0.6"
      />
      <circle cx="14" cy="11" r="2" fill="#0b1e4d" fillOpacity="0.85" />
      <circle cx="22" cy="11" r="2" fill="#0b1e4d" fillOpacity="0.85" />
      <circle cx="14" cy="19" r="2" fill="#0b1e4d" fillOpacity="0.85" />
    </svg>
  );
}
