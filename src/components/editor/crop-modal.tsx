"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import { cropImageToDataUrl } from "@/lib/editor/image-utils";

/**
 * Modal full-screen para recortar una foto antes de pegarla en el slot.
 * - Aspect ratio fijo segun el slot (slotW/slotH * modelAspect)
 * - Zoom slider abajo
 * - Save genera dataURL con el crop final
 */
export function CropModal({
  src,
  aspect,
  initialCrop,
  initialZoom,
  onCancel,
  onSave,
}: {
  src: string;
  aspect: number;
  initialCrop?: { x: number; y: number };
  initialZoom?: number;
  onCancel: () => void;
  /** Recibe el dataURL recortado, el pixelCrop sobre la imagen `src` (uso
      local) Y el cropFraction (x/y/w/h en 0..1). El cropFraction es lo que
      el server usa porque es invariante a la resolucion de la fuente —
      sharp lo escala al original a 300 DPI sin saber dimensiones. */
  onSave: (
    cropped: string,
    cropFraction: { x: number; y: number; width: number; height: number },
  ) => Promise<void> | void;
}) {
  const [crop, setCrop] = useState(initialCrop ?? { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom ?? 1);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  const [percentCrop, setPercentCrop] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback(
    (areaPercent: Area, areaPixels: Area) => {
      setPixelCrop(areaPixels);
      setPercentCrop(areaPercent);
    },
    [],
  );

  // ESC cancela
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Bloquear scroll del body mientras esta abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSave() {
    if (!pixelCrop || !percentCrop) return;
    setSaving(true);
    setError(null);
    try {
      const out = await cropImageToDataUrl(src, pixelCrop);
      // react-easy-crop devuelve percentages en 0..100; el server espera
      // fracciones 0..1.
      await onSave(out, {
        x: percentCrop.x / 100,
        y: percentCrop.y / 100,
        width: percentCrop.width / 100,
        height: percentCrop.height / 100,
      });
    } catch {
      setError("No pude recortar la imagen. Probá de nuevo.");
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="crop-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[60] flex flex-col bg-[color:var(--color-navy-900)] text-[color:var(--color-cream-soft)]"
        role="dialog"
        aria-modal="true"
        aria-label="Recortar foto"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[color:var(--color-cream-soft)]/10 px-4 py-3 md:px-6 md:py-4">
          <button
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--color-cream-soft)]/10"
            aria-label="Cancelar"
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-cream-soft)]/70 md:text-[11px]">
            Recortar foto
          </span>
          <button
            onClick={handleSave}
            disabled={saving || !pixelCrop}
            className="flex h-9 items-center gap-2 rounded-full bg-[color:var(--color-cream-soft)] px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 md:px-5 md:text-[12px]"
            aria-label="Guardar recorte"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Guardando
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                Listo
              </>
            )}
          </button>
        </header>

        {/* Canvas de crop */}
        <div className="relative flex-1 bg-[color:var(--color-navy-900)]">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            showGrid
            classes={{
              containerClassName: "bg-[color:var(--color-navy-900)]",
              cropAreaClassName:
                "border-[color:var(--color-cream-warm)] !shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]",
            }}
          />
        </div>

        {/* Footer con zoom slider */}
        <footer className="border-t border-[color:var(--color-cream-soft)]/10 px-4 py-4 md:px-6 md:py-5">
          {error && (
            <p className="mb-3 text-center text-[12px] text-red-300">{error}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-cream-soft)]/8 transition-colors hover:bg-[color:var(--color-cream-soft)]/15"
              aria-label="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1 accent-[color:var(--color-cream-warm)]"
            />
            <button
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-cream-soft)]/8 transition-colors hover:bg-[color:var(--color-cream-soft)]/15"
              aria-label="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-cream-soft)]/45">
            Arrastrá para mover · pellizcá / slider para zoom
          </p>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
