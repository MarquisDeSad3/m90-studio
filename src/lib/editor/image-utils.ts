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
 * un solo canvas con el aspect del modelo. Output JPEG ~92% calidad.
 *
 * Las fotos vienen ya cropeadas al aspect del slot, asi que se dibujan
 * directamente sin re-crop.
 *
 * @param maxSide tamaño maximo del lado mayor (default 1800px) para mantener
 *                el archivo bajo ~600KB y compartible por WhatsApp.
 */
export async function composeFinalCover(
  slots: Array<{ x: number; y: number; w: number; h: number }>,
  photos: Array<{ slotIndex: number; src: string }>,
  modelAspect: { widthMm: number; heightMm: number },
  maxSide = 1800,
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> {
  const aspectRatio = modelAspect.widthMm / modelAspect.heightMm;
  const isPortrait = modelAspect.heightMm >= modelAspect.widthMm;

  const outH = isPortrait ? maxSide : Math.round(maxSide * (1 / aspectRatio));
  const outW = isPortrait ? Math.round(maxSide * aspectRatio) : maxSide;

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
      0.92,
    );
  });
}
