"use client";

/**
 * Cache en memoria de las Files originales que el cliente subio.
 * NO va a localStorage (Files no se serializan). Persiste solo durante la
 * sesion del navegador. Al submitear el pedido, mandamos la File original
 * al backend para guardar calidad maxima.
 *
 * Si el usuario recarga la pagina, perdemos el original — caemos a la
 * version cropeada (que sigue estando en state.photos[].src dataURL,
 * comprimida pero printable a tamaño normal).
 */

const originals = new Map<number, File>();

export function setOriginalFile(slotIndex: number, file: File) {
  originals.set(slotIndex, file);
}

export function getOriginalFile(slotIndex: number): File | undefined {
  return originals.get(slotIndex);
}

export function clearOriginal(slotIndex: number) {
  originals.delete(slotIndex);
}

export function clearAllOriginals() {
  originals.clear();
}

/**
 * Convierte un dataURL a Blob — fallback cuando no tenemos el original
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
