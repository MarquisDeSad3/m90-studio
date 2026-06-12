import imageCompression from "browser-image-compression";

/**
 * Comprime una File de imagen y la devuelve como dataURL JPEG.
 * Pensado para Cuba: cap a ~400KB y 1600px lado mayor.
 * - useWebWorker para no bloquear el main thread
 * - imagenes que vienen del file picker movil pueden ser de 5-10MB
 */
export async function compressImageFile(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.82,
  });
  return await fileToDataUrl(compressed);
}

/**
 * Comprime la foto a una version "lista para subir Y para imprimir":
 * - cap ~2000px lado mayor (suficiente para 300 DPI en cualquier modelo:
 *   el case mas grande, Pro Max 77.6x160.7mm, necesita ~1898px de alto)
 * - cap ~1MB para que el upload NO se cuelgue en la red movil cubana
 *   (antes se subia el File ORIGINAL crudo, hasta 30MB por foto → el
 *   pedido se quedaba "cargando" hasta el timeout de 90s)
 * - fileType jpeg → el canvas NORMALIZA la orientacion EXIF y borra el
 *   tag, asi el server (sharp) ya no tiene que rotar y el cropFraction
 *   calculado sobre esta imagen coincide pixel a pixel con el original
 *   que se imprime (antes: crop torcido en fotos de telefono).
 *
 * Devuelve el Blob (para el FormData) Y el dataURL (para mostrarlo en el
 * cropper) — asi el cliente recorta EXACTAMENTE la misma imagen que se sube.
 */
export async function compressForUpload(
  file: File,
): Promise<{ blob: Blob; dataUrl: string }> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 2000,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.82,
  });
  const dataUrl = await fileToDataUrl(compressed);
  return { blob: compressed, dataUrl };
}

export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Genera el dataURL del recorte usando un canvas off-DOM.
 * `pixelCrop` viene de react-easy-crop (`onCropComplete`, segundo argumento).
 *
 * Limita el output a `outputMaxSize` para no saturar localStorage.
 */
export async function cropImageToDataUrl(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outputMaxSize = 1200,
): Promise<string> {
  const img = await loadImage(imageSrc);

  const ratio = pixelCrop.width / pixelCrop.height;
  let outW = pixelCrop.width;
  let outH = pixelCrop.height;
  if (outW > outputMaxSize) {
    outW = outputMaxSize;
    outH = Math.round(outputMaxSize / ratio);
  }
  if (outH > outputMaxSize) {
    outH = outputMaxSize;
    outW = Math.round(outputMaxSize * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(outW));
  canvas.height = Math.max(1, Math.round(outH));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context disponible");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL("image/jpeg", 0.85);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No pude cargar la imagen"));
    img.src = src;
  });
}

/**
 * Componer la imagen final del cover: dibuja todas las fotos del layout en
 * un solo canvas con las dimensiones reales del case en mm a la DPI dada.
 * Output JPEG.
 *
 * Para print-ready usar dpi=300 (estandar de imprenta). El px exacto sale
 * de mm × dpi / 25.4. iPhone 11/XR (75.7×150.9mm) @ 300dpi = 894×1782px.
 *
 * Las fotos ya vienen cropeadas al aspect del slot — drawImage las
 * escala sin re-crop. La calidad final depende de la calidad del original.
 *
 * @param dpi resolucion de impresion (300 print, 150 preview).
 * @param quality JPEG quality (0..1).
 */
export async function composeFinalCover(
  slots: Array<{ x: number; y: number; w: number; h: number }>,
  photos: Array<{ slotIndex: number; src: string }>,
  modelAspect: { widthMm: number; heightMm: number },
  opts: { dpi?: number; quality?: number } = {},
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> {
  const dpi = opts.dpi ?? 300;
  const quality = opts.quality ?? 0.92;
  const PX_PER_MM = dpi / 25.4;

  const outW = Math.round(modelAspect.widthMm * PX_PER_MM);
  const outH = Math.round(modelAspect.heightMm * PX_PER_MM);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context disponible");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Fondo blanco del substrato de impresion
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);

  // Cargar todas las imagenes en paralelo
  const imgPairs = await Promise.all(
    photos.map(async (p) => ({
      slotIndex: p.slotIndex,
      img: await loadImage(p.src),
    })),
  );
  const imgBySlot = new Map<number, HTMLImageElement>();
  for (const p of imgPairs) imgBySlot.set(p.slotIndex, p.img);

  // Dibujar cada slot
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const img = imgBySlot.get(i);
    if (!img) continue;

    const sx = slot.x * outW;
    const sy = slot.y * outH;
    const sw = slot.w * outW;
    const sh = slot.h * outH;

    // Las fotos ya vienen cropeadas al aspect del slot, drawImage las
    // estira/encoje sin distorsion (mismo aspect).
    ctx.drawImage(img, sx, sy, sw, sh);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob fallo"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () =>
          resolve({
            dataUrl: reader.result as string,
            blob,
            width: outW,
            height: outH,
          });
        reader.onerror = () =>
          reject(reader.error ?? new Error("FileReader fallo"));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}
