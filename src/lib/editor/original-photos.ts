"use client";

/**
 * Cache en memoria de la fuente de cada slot:
 *  - `file`: el archivo ORIGINAL del cliente (máxima calidad). Es lo que se
 *    sube por defecto — queremos imprimir con la mejor calidad posible.
 *  - `displayUrl`: una versión comprimida (dataURL) SOLO para mostrar en el
 *    cropper y para re-editar. No se sube.
 *
 * NO va a localStorage (un File no se serializa y los dataURL pesados
 * llenarían la cuota de ~5MB). Persiste solo durante la sesión del navegador.
 *
 * Al submitear: se sube el `file` original. Si la conexión está lenta, el
 * step-confirm comprime ese mismo file al vuelo y reintenta (ver handleShare).
 *
 * Si el usuario recarga la página perdemos la fuente — caemos a la versión
 * cropeada que quedó en state.photos[].src (dataURL).
 */

type SlotSource = { file: File; displayUrl: string };

const sources = new Map<number, SlotSource>();

export function setUploadSource(slotIndex: number, source: SlotSource) {
  sources.set(slotIndex, source);
}

/** Archivo original (máxima calidad) para subir. undefined si se perdió. */
export function getOriginalFile(slotIndex: number): File | undefined {
  return sources.get(slotIndex)?.file;
}

/** dataURL de la fuente COMPLETA (sin recortar) — para reabrir el cropper
    al re-editar una foto ya cargada, así el recorte se hace siempre sobre
    la imagen entera y no sobre un recorte previo. */
export function getDisplayUrl(slotIndex: number): string | undefined {
  return sources.get(slotIndex)?.displayUrl;
}

export function clearOriginal(slotIndex: number) {
  sources.delete(slotIndex);
}

export function clearAllOriginals() {
  sources.clear();
}

/**
 * Convierte un dataURL a Blob — fallback cuando no tenemos la fuente
 * (ej. el usuario recargó la página antes de submitear).
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
