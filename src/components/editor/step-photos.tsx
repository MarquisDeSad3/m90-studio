"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useEditor, usePhoneModel } from "@/lib/editor/store";
import { useConfirm } from "@/components/ui/confirm-provider";
import { findLayout } from "@/lib/data/layouts";
import { getPrintDimensions } from "@/lib/data/phone-models";
import { compressImageFile } from "@/lib/editor/image-utils";
import {
  clearOriginal,
  setOriginalFile,
} from "@/lib/editor/original-photos";
import { cn } from "@/lib/utils";
import { EditorCanvas } from "./editor-canvas";
import { CropModal } from "./crop-modal";
import { NextCta } from "./next-cta";

export function StepPhotos() {
  const { state, dispatch, goNext } = useEditor();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layout = useMemo(
    () => (state.layoutId ? findLayout(state.layoutId) : null),
    [state.layoutId],
  );
  const model = usePhoneModel(state.modelSlug);

  if (!layout) {
    return (
      <section className="mx-auto max-w-[920px] px-4 py-12 md:px-8">
        <p className="text-[14px] text-[color:var(--color-navy)]/65">
          No hay layout seleccionado. Volvé al paso anterior.
        </p>
      </section>
    );
  }

  const slot = activeSlot != null ? layout.slots[activeSlot] : null;
  // Aspect total del print area (cuerpo + wrap), no solo el cuerpo —
  // los slots cubren el area completa.
  const printDims = model
    ? getPrintDimensions(model)
    : { widthMm: 75, heightMm: 150, wrapMm: 0 };
  const aspectW = printDims.widthMm;
  const aspectH = printDims.heightMm;
  const slotAspect = slot
    ? (slot.w * aspectW) / (slot.h * aspectH)
    : 1;

  function openSlotPicker(slotIndex: number) {
    setActiveSlot(slotIndex);
    setError(null);
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset para que el mismo archivo se pueda re-elegir
    if (!file || activeSlot == null) {
      setActiveSlot(null);
      return;
    }

    // HEIC del iPhone no se puede procesar en Chrome/Android. Avisar al
    // usuario para que cambie el formato en su iPhone (Settings > Camera >
    // Formats > Most Compatible) o use otra foto.
    const isHeic =
      /\.(heic|heif)$/i.test(file.name) ||
      file.type === "image/heic" ||
      file.type === "image/heif";
    if (isHeic) {
      setError(
        "Foto en formato HEIC (iPhone). Cambiala a JPG en Ajustes > Cámara > Formatos > Más Compatible, o probá con otra foto.",
      );
      setActiveSlot(null);
      return;
    }

    // Limite de tamaño: si la foto pesa más de 30MB, probablemente es video
    // o un movil viejo va a colgarse comprimiéndola. Avisar antes.
    if (file.size > 30 * 1024 * 1024) {
      setError(
        "Foto demasiado pesada (más de 30MB). Probá con otra o reducí el tamaño desde tu teléfono.",
      );
      setActiveSlot(null);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      // Guardamos la File original en memoria para mandarla al backend con
      // calidad maxima al submitear. La version comprimida es solo para el
      // editor visual (crop preview).
      setOriginalFile(activeSlot, file);
      const dataUrl = await compressImageFile(file);
      setCropSrc(dataUrl);
    } catch (err) {
      console.error("compressImageFile failed:", err);
      clearOriginal(activeSlot);
      setError(
        "No pude procesar la imagen. Probá con otra (formato JPG o PNG).",
      );
      setActiveSlot(null);
    } finally {
      setUploading(false);
    }
  }

  function onSlotClick(slotIndex: number) {
    const existing = state.photos.find((p) => p.slotIndex === slotIndex);
    if (existing) {
      // Reabrir crop modal con la imagen ya guardada para re-recortar
      setActiveSlot(slotIndex);
      setCropSrc(existing.src);
    } else {
      openSlotPicker(slotIndex);
    }
  }

  async function onCropSave(
    croppedDataUrl: string,
    cropFraction: { x: number; y: number; width: number; height: number },
  ) {
    if (activeSlot == null) return;
    dispatch({
      type: "UPSERT_PHOTO",
      photo: { slotIndex: activeSlot, src: croppedDataUrl, cropFraction },
    });
    setCropSrc(null);
    setActiveSlot(null);
  }

  function onCropCancel() {
    setCropSrc(null);
    setActiveSlot(null);
  }

  async function clearAll() {
    const ok = await confirm({
      title: "¿Borrar todas las fotos cargadas?",
      message: "Vas a tener que volver a subirlas.",
      confirmLabel: "Borrar todo",
      variant: "danger",
    });
    if (!ok) return;
    state.photos.forEach((p) =>
      dispatch({ type: "REMOVE_PHOTO", slotIndex: p.slotIndex }),
    );
  }

  const photoCount = state.photos.length;
  const allFilled = photoCount === layout.count;

  return (
    <section className="mx-auto max-w-[920px] px-4 pb-4 pt-6 md:px-8 md:pt-12">
      <div className="mb-6 md:mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
          · Paso 3 de 4
        </span>
        <h1 className="mt-2 font-display text-[clamp(34px,7.5vw,64px)] italic leading-[0.98] text-[color:var(--color-navy)]">
          Subí tus fotos
        </h1>
        <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[15px]">
          Tocá cada slot numerado para subir una foto. Las recortás y movés en
          el siguiente paso.
        </p>
      </div>

      {/* Canvas + counter */}
      <div className="flex flex-col items-center gap-5 md:gap-6">
        <EditorCanvas
          layout={layout}
          model={model}
          photos={state.photos}
          onSlotClick={onSlotClick}
          height={460}
        />

        <div className="flex items-center gap-4">
          <span
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.25em] md:text-[12px]",
              allFilled
                ? "text-[color:var(--color-navy-500)]"
                : "text-[color:var(--color-navy)]/55",
            )}
          >
            {photoCount} / {layout.count} fotos
            {allFilled && " · listo"}
          </span>
          {photoCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/55 transition-colors hover:text-red-700 md:text-[12px]"
            >
              <Trash2 className="h-3 w-3" />
              Borrar todo
            </button>
          )}
        </div>

        {error && (
          <p className="text-[13px] text-red-700">{error}</p>
        )}

        {uploading && (
          <div className="flex items-center gap-2 text-[12px] text-[color:var(--color-navy)]/65 md:text-[13px]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Comprimiendo imagen…
          </div>
        )}
      </div>

      {/* Hidden file input compartido */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Crop modal */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          aspect={slotAspect}
          onCancel={onCropCancel}
          onSave={onCropSave}
        />
      )}

      <NextCta
        onClick={goNext}
        disabled={!allFilled}
        helper={
          allFilled
            ? "Todo listo para confirmar"
            : `Faltan ${layout.count - photoCount} foto${layout.count - photoCount === 1 ? "" : "s"}`
        }
      />
    </section>
  );
}
