import "server-only";
import sharp from "sharp";

/**
 * Compose un print-ready a alta resolucion (300 DPI por defecto) usando
 * los archivos ORIGINALES en disco, no las versiones comprimidas que
 * envio el cliente.
 *
 * Esta es la version del compose que SI imprime — la del cliente
 * (`composeFinalCover` en `image-utils.ts`) era pre-cliente y limitada
 * por canvas browser.
 *
 * Pipeline por slot:
 *   1. Abrir original con sharp.
 *   2. Si hay cropFraction (0..1), extraer la region correspondiente.
 *   3. Resize a las dimensiones del slot en pixels @ 300 DPI.
 *   4. Composite sobre canvas blanco del tamaño exacto del case.
 */

export type ComposeSlot = {
  /** 0..1 fracciones del canvas final. */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ComposePhoto = {
  slotIndex: number;
  /** Path absoluto en disco al archivo original. */
  originalPath: string;
  cropFraction?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export async function composeOrderPrintReady(opts: {
  outWidthMm: number;
  outHeightMm: number;
  slots: ComposeSlot[];
  photos: ComposePhoto[];
  /** Resolucion de impresion. 300 = print-ready estandar. */
  dpi?: number;
  /** JPEG quality 1..100. */
  quality?: number;
}): Promise<{ buffer: Buffer; width: number; height: number }> {
  const dpi = opts.dpi ?? 300;
  const quality = opts.quality ?? 92;
  const PX_PER_MM = dpi / 25.4;

  const outW = Math.max(1, Math.round(opts.outWidthMm * PX_PER_MM));
  const outH = Math.max(1, Math.round(opts.outHeightMm * PX_PER_MM));

  // Composites (resized photo buffers) que sharp va a stackear sobre el
  // canvas blanco. Se procesan en paralelo porque cada uno es independiente.
  const composites = await Promise.all(
    opts.slots.map(async (slot, i) => {
      const photo = opts.photos.find((p) => p.slotIndex === i);
      if (!photo) return null;

      const slotW = Math.max(1, Math.round(slot.w * outW));
      const slotH = Math.max(1, Math.round(slot.h * outH));
      const slotX = Math.max(0, Math.round(slot.x * outW));
      const slotY = Math.max(0, Math.round(slot.y * outH));

      let pipeline = sharp(photo.originalPath, { failOn: "none" }).rotate();

      if (photo.cropFraction) {
        const meta = await pipeline.metadata();
        if (!meta.width || !meta.height) {
          throw new Error(
            `No metadata para foto slot ${photo.slotIndex} (${photo.originalPath})`,
          );
        }
        // Recortar al cropFraction. Re-instanciar sharp para que extract
        // funcione con el mismo input despues de pedir metadata (sharp
        // pipelines no se pueden reutilizar tras un await intermedio).
        const cropX = Math.max(
          0,
          Math.min(
            meta.width - 1,
            Math.round(photo.cropFraction.x * meta.width),
          ),
        );
        const cropY = Math.max(
          0,
          Math.min(
            meta.height - 1,
            Math.round(photo.cropFraction.y * meta.height),
          ),
        );
        const cropW = Math.max(
          1,
          Math.min(
            meta.width - cropX,
            Math.round(photo.cropFraction.width * meta.width),
          ),
        );
        const cropH = Math.max(
          1,
          Math.min(
            meta.height - cropY,
            Math.round(photo.cropFraction.height * meta.height),
          ),
        );
        pipeline = sharp(photo.originalPath, { failOn: "none" })
          .rotate()
          .extract({
            left: cropX,
            top: cropY,
            width: cropW,
            height: cropH,
          });
      }

      const buf = await pipeline
        .resize(slotW, slotH, { fit: "cover", kernel: "lanczos3" })
        .toBuffer();

      return { input: buf, left: slotX, top: slotY };
    }),
  );

  const validComposites = composites.filter(
    (c): c is { input: Buffer; left: number; top: number } => c !== null,
  );

  const buffer = await sharp({
    create: {
      width: outW,
      height: outH,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(validComposites)
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  return { buffer, width: outW, height: outH };
}
