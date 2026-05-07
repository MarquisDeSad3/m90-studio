import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orders,
  orderPhotos,
  orderEvents,
  coverPricing,
} from "@/lib/db/schema";
import {
  diskPathFromFilename,
  filenameFromUrl,
  saveImageBuffer,
  saveImageFile,
} from "@/lib/storage";
import { composeOrderPrintReady } from "@/lib/editor/compose-server";
import { findLayout } from "@/lib/data/layouts";
import { notifyAdminNewOrder } from "@/lib/notifications/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   Validacion del payload
   ============================================================ */

const photoSchema = z.object({
  slotIndex: z.number().int().min(0).max(20),
  transform: z
    .object({
      crop: z.object({ x: z.number(), y: z.number() }),
      zoom: z.number(),
      rotation: z.number(),
      aspect: z.number().optional(),
      /** Recorte en fracciones 0..1 (independiente de la resolucion).
          El server lo aplica al ORIGINAL en max calidad con sharp. */
      cropFraction: z
        .object({
          x: z.number().min(0).max(1),
          y: z.number().min(0).max(1),
          width: z.number().min(0).max(1),
          height: z.number().min(0).max(1),
        })
        .optional(),
    })
    .nullable()
    .optional(),
});

const orderInputSchema = z.object({
  phoneModelSlug: z.string().min(1).max(100),
  phoneModelName: z.string().min(1).max(200),
  layoutId: z.string().min(1).max(100),
  layoutName: z.string().min(1).max(200),
  /** Tipo de funda: 'normal' (transferencia simple) o 'coated' (placa
      blanca de aluminio para sublimación). Determina el precio. */
  coverType: z.enum(["normal", "coated"]),
  /** Dimensiones fisicas del case en mm (snapshot del catalogo). El catalogo
      tiene decimales (75.7mm, 150.9mm), asi que aceptamos number — luego
      redondeamos al insertar a la columna integer. */
  widthMm: z.number().positive().max(500).optional(),
  heightMm: z.number().positive().max(500).optional(),
  cornerRadiusMm: z.number().min(0).max(50).optional(),
  cameraBox: z
    .object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
    })
    .nullable()
    .optional(),
  customerNotes: z.string().max(800).optional().default(""),
  /** Telefono del cliente — OBLIGATORIO. Validamos por digitos para
      tolerar espacios/guiones que el cliente pueda meter por accidente. */
  customerPhone: z
    .string()
    .min(7, "Teléfono demasiado corto")
    .max(40)
    .refine(
      (v) => v.replace(/[^\d]/g, "").length >= 7,
      "Teléfono inválido (min 7 dígitos)",
    ),
  customerName: z
    .string()
    .min(2, "Nombre demasiado corto")
    .max(120),
  photos: z.array(photoSchema).min(1).max(20),
});

/* ============================================================
   Helpers
   ============================================================ */

const FALLBACK_PRICE_CUP = 2100; // si la tabla cover_pricing esta vacia (no
const FALLBACK_PRICE_USD_CENTS = 700; // deberia pasar despues de migration)
const MAX_BODY_BYTES = 60 * 1024 * 1024; // 60MB total — aprox 9 fotos x 6MB

/** Lee el precio actual del tipo de funda desde la tabla cover_pricing.
    Si por alguna razon la fila no existe (DB sin seed), devuelve fallback. */
async function getCoverPrice(
  type: "normal" | "coated",
): Promise<{ priceCup: number; priceUsdCents: number }> {
  const [row] = await db
    .select({
      priceCup: coverPricing.priceCup,
      priceUsdCents: coverPricing.priceUsdCents,
    })
    .from(coverPricing)
    .where(eq(coverPricing.type, type))
    .limit(1);
  if (!row) {
    return {
      priceCup: FALLBACK_PRICE_CUP,
      priceUsdCents: FALLBACK_PRICE_USD_CENTS,
    };
  }
  return row;
}

function fail(status: number, message: string, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * Genera un código humano: M90-NNNN basado en count + offset.
 * Evita colisión usando subquery dentro del INSERT (Postgres único de
 * generar IDs en escenarios de baja concurrencia es fine).
 */
async function generateOrderCode(): Promise<string> {
  const [{ count }] = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int as count FROM orders`,
  );
  const next = (count ?? 0) + 1001; // empezamos en M90-1001
  return `M90-${String(next).padStart(4, "0")}`;
}

/* ============================================================
   POST /api/orders
   - multipart/form-data:
     · "data": JSON con orderInputSchema (string)
     · "photo_<slotIndex>": archivo original de cada slot
     · "preview" (opcional): JPG compuesto para preview
   ============================================================ */

export async function POST(req: Request) {
  // Hard cap de tamaño (defensa contra payloads enormes)
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return fail(413, "Pedido demasiado pesado", "PAYLOAD_TOO_LARGE");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "Form-data inválido", "BAD_FORM");
  }

  const dataStr = form.get("data");
  if (typeof dataStr !== "string") {
    return fail(400, "Falta el campo 'data'", "MISSING_DATA");
  }

  let parsed: z.infer<typeof orderInputSchema>;
  try {
    parsed = orderInputSchema.parse(JSON.parse(dataStr));
  } catch (err) {
    const msg =
      err instanceof z.ZodError ? err.issues[0]?.message ?? "invalid" : "invalid";
    return fail(400, `Datos inválidos: ${msg}`, "VALIDATION");
  }

  // 1. Subir cada foto original + cropeada a disco. Si una falla, abortamos
  //    antes de insertar nada en la DB para no dejar registros huérfanos.
  //    - photo_<slot>: archivo original (max calidad). Lo manda el cliente
  //      siempre que tenga la File en memoria (puede no tenerla si el user
  //      recargo la pagina antes de submitear — fallback al cropeado).
  //    - cropped_<slot>: version cropeada por el cliente. Se guarda aparte
  //      asi el admin tiene ambas versiones para descargar / inspeccionar.
  type SavedPhoto = {
    slotIndex: number;
    originalUrl: string;
    croppedUrl: string | null;
    sizeBytes: number;
    transform: NonNullable<z.infer<typeof photoSchema>["transform"]>;
  };

  const savedPhotos: SavedPhoto[] = [];
  for (const p of parsed.photos) {
    const originalFile = form.get(`photo_${p.slotIndex}`);
    if (!(originalFile instanceof Blob)) {
      return fail(400, `Falta foto del slot ${p.slotIndex}`, "MISSING_PHOTO");
    }
    try {
      const savedOriginal = await saveImageFile(originalFile);

      // Cropeada — opcional. Si no viene, no es fatal: se puede regenerar
      // a partir del original + transform.pixelCrop con sharp.
      let savedCroppedUrl: string | null = null;
      const croppedFile = form.get(`cropped_${p.slotIndex}`);
      if (croppedFile instanceof Blob && croppedFile.size > 0) {
        try {
          const savedCropped = await saveImageFile(croppedFile);
          savedCroppedUrl = savedCropped.url;
        } catch (err) {
          console.warn(
            `[orders] cropped slot ${p.slotIndex} save failed:`,
            err,
          );
        }
      }

      savedPhotos.push({
        slotIndex: p.slotIndex,
        originalUrl: savedOriginal.url,
        croppedUrl: savedCroppedUrl,
        sizeBytes: savedOriginal.size,
        transform:
          p.transform ?? { crop: { x: 0, y: 0 }, zoom: 1, rotation: 0 },
      });
    } catch (err) {
      console.error("[orders] saveImageFile error:", err);
      return fail(
        400,
        err instanceof Error ? err.message : "No pude guardar la foto",
        "STORAGE_ERROR",
      );
    }
  }

  // 2. Preview compuesto (low-DPI, para mostrar en admin) y print-ready
  //    (300 DPI con dimensiones reales — esto es lo que M90 imprime).
  let previewUrl: string | null = null;
  const preview = form.get("preview");
  if (preview instanceof Blob && preview.size > 0) {
    try {
      const saved = await saveImageFile(preview);
      previewUrl = saved.url;
    } catch (err) {
      console.warn("[orders] preview save failed:", err);
    }
  }

  let printReadyUrl: string | null = null;
  const printReady = form.get("printReady");
  if (printReady instanceof Blob && printReady.size > 0) {
    try {
      const saved = await saveImageFile(printReady);
      printReadyUrl = saved.url;
    } catch (err) {
      console.warn("[orders] print-ready save failed:", err);
    }
  }

  // 3. Generar código + insertar en DB. El precio sale de cover_pricing
  //    (editable desde admin) y se snapshotea en el pedido.
  const code = await generateOrderCode();
  const submittedAt = new Date();
  const price = await getCoverPrice(parsed.coverType);

  try {
    const [order] = await db
      .insert(orders)
      .values({
        code,
        customerPhone: parsed.customerPhone,
        customerName: parsed.customerName,
        phoneModelSlug: parsed.phoneModelSlug,
        phoneModelName: parsed.phoneModelName,
        layoutId: parsed.layoutId,
        layoutName: parsed.layoutName,
        widthMm:
          parsed.widthMm != null ? Math.round(parsed.widthMm) : null,
        heightMm:
          parsed.heightMm != null ? Math.round(parsed.heightMm) : null,
        cornerRadiusMm:
          parsed.cornerRadiusMm != null
            ? Math.round(parsed.cornerRadiusMm)
            : null,
        cameraBox: parsed.cameraBox ?? null,
        status: "submitted",
        coverType: parsed.coverType,
        previewUrl,
        printReadyUrl,
        customerNotes: parsed.customerNotes || null,
        priceCup: price.priceCup,
        priceUsdCents: price.priceUsdCents,
        submittedAt,
      })
      .returning();

    if (!order) {
      return fail(500, "No pude crear el pedido", "DB_INSERT");
    }

    if (savedPhotos.length > 0) {
      await db.insert(orderPhotos).values(
        savedPhotos.map((p) => ({
          orderId: order.id,
          slotIndex: p.slotIndex,
          originalUrl: p.originalUrl,
          croppedUrl: p.croppedUrl,
          transform: p.transform,
          sizeBytes: p.sizeBytes,
        })),
      );
    }

    await db.insert(orderEvents).values({
      orderId: order.id,
      fromStatus: null,
      toStatus: "submitted",
      actor: "system",
      note: "Pedido creado por el cliente",
    });

    // 4. Server-side compose del print-ready a 300 DPI usando los
    //    ORIGINALES (max calidad). Reemplaza el printReady que mando el
    //    cliente. Si falla por cualquier razon, dejamos el printReady
    //    del cliente como fallback — el pedido ya esta confirmado.
    try {
      const layout = findLayout(parsed.layoutId);
      if (
        layout &&
        parsed.widthMm != null &&
        parsed.heightMm != null &&
        savedPhotos.length > 0
      ) {
        const composed = await composeOrderPrintReady({
          outWidthMm: parsed.widthMm,
          outHeightMm: parsed.heightMm,
          slots: layout.slots,
          photos: savedPhotos.map((p) => {
            const filename = filenameFromUrl(p.originalUrl) ?? "";
            return {
              slotIndex: p.slotIndex,
              originalPath: diskPathFromFilename(filename),
              cropFraction: p.transform?.cropFraction,
            };
          }),
          dpi: 300,
          quality: 92,
        });
        const saved = await saveImageBuffer(composed.buffer, "jpg");
        await db
          .update(orders)
          .set({ printReadyUrl: saved.url, updatedAt: new Date() })
          .where(eq(orders.id, order.id));
      }
    } catch (err) {
      console.error("[orders] server-side compose failed:", err);
      // Fallback: dejamos el printReadyUrl del cliente. El admin puede
      // re-componer manualmente con el endpoint de regenerate (TODO).
    }

    const adminPath = `/admin/pedidos/${order.code}`;

    // 5. Notificación a Telegram al admin de M90. Nunca bloquea: si el bot
    //    no está configurado o la API falla, solo se loggea. El cliente ya
    //    tiene el pedido creado y va a mandar WhatsApp igual.
    notifyAdminNewOrder({
      code: order.code,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      phoneModelName: parsed.phoneModelName,
      layoutLabel: parsed.layoutName,
      coverType: parsed.coverType,
      priceUsd: price.priceUsdCents / 100,
      priceCup: price.priceCup,
      photoCount: savedPhotos.length,
      customerNotes: parsed.customerNotes,
      adminUrl: adminPath,
      previewUrl,
      siteOrigin: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    })
      .then((r) => {
        if (!r.ok) console.warn("[orders] telegram notify failed:", r.reason);
      })
      .catch((err) => console.warn("[orders] telegram notify error:", err));

    return NextResponse.json(
      {
        code: order.code,
        id: order.id,
        adminUrl: adminPath,
        previewUrl,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[orders] DB insert failed:", err);
    return fail(500, "Error guardando el pedido", "DB_INSERT");
  }
}
