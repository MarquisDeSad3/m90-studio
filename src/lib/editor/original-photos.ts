"use client";

/**
 * Cache en memoria de la imagen "fuente" de cada slot: el blob comprimido
 * listo-para-subir (≤2000px, ~1MB, orientado) Y su dataURL.
 *
 * NO va a localStorage (los blobs/dataURLs pesados llenarian la cuota de
 * ~5MB). Persiste solo durante la sesion del navegador. Al submitear el
 * pedido mandamos el blob al backend; el server le aplica el cropFraction
 * con sharp para componer el print-ready 300 DPI.
 *
 * Antes acá se guardaba la File ORIGINAL cruda (hasta 30MB) y se subia tal
 * cual → el pedido se quedaba "cargando" en la red movil cubana. Ahora se
 * guarda la version comprimida: mismo encuadre, fraccion de tamaño.
 *
 * Si el usuario recarga la pagina perdemos esta fuente — caemos a la
 * version cropeada (que sigue en state.photos[].src dataURL).
 */

type SlotSource = { blob: Blob; dataUrl: string };

const sources = new Map<number, SlotSource>();

export function setUploadSource(slotIndex: number, source: SlotSource) {
  sources.set(slotIndex, source);
}

/** Blob comprimido para mandar en el FormData (o undefined si se perdio). */
export function getUploadBlob(slotIndex: number): Blob | undefined {
  return sources.get(slotIndex)?.blob;
}

/** dataURL de la fuente COMPLETA (sin recortar) — para reabrir el cropper
    al re-editar una foto ya cargada, asi el recorte se hace siempre sobre
    la imagen entera y no sobre un recorte previo. */
export function getSourceDataUrl(slotIndex: number): string | undefined {
  return sources.get(slotIndex)?.dataUrl;
}

export function clearOriginal(slotIndex: number) {
  sources.delete(slotIndex);
}

export function clearAllOriginals() {
  sources.clear();
}

/**
 * Convierte un dataURL a Blob — fallback cuando no tenemos la fuente
 * (ej. el usuario recargo la pagina antes de submitear).
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
