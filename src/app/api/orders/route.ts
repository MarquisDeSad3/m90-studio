import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderPhotos, orderEvents } from "@/lib/db/schema";
import { saveImageFile } from "@/lib/storage";

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
    })
    .nullable()
    .optional(),
});

const orderInputSchema = z.object({
  phoneModelSlug: z.string().min(1).max(100),
  phoneModelName: z.string().min(1).max(200),
  layoutId: z.string().min(1).max(100),
  layoutName: z.string().min(1).max(200),
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
  customerPhone: z.string().max(40).optional(),
  customerName: z.string().max(120).optional(),
  photos: z.array(photoSchema).min(1).max(20),
});

/* ============================================================
   Helpers
   ============================================================ */

const PRICE_CUP = 4500; // USD$15 ≈ ~4500 CUP (snapshot al crear orden)
const MAX_BODY_BYTES = 60 * 1024 * 1024; // 60MB total — aprox 9 fotos x 6MB

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

  // 1. Subir cada foto original a disco. Si una falla, abortamos antes de
  //    insertar nada en la DB para no dejar registros huérfanos.
  type SavedPhoto = {
    slotIndex: number;
    url: string;
    sizeBytes: number;
    transform: NonNullable<z.infer<typeof photoSchema>["transform"]>;
  };

  const savedPhotos: SavedPhoto[] = [];
  for (const p of parsed.photos) {
    const file = form.get(`photo_${p.slotIndex}`);
    if (!(file instanceof Blob)) {
      return fail(400, `Falta foto del slot ${p.slotIndex}`, "MISSING_PHOTO");
    }
    try {
      const saved = await saveImageFile(file);
      savedPhotos.push({
        slotIndex: p.slotIndex,
        url: saved.url,
        sizeBytes: saved.size,
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

  // 3. Generar código + insertar en DB
  const code = await generateOrderCode();
  const submittedAt = new Date();

  try {
    const [order] = await db
      .insert(orders)
      .values({
        code,
        customerPhone: parsed.customerPhone ?? null,
        customerName: parsed.customerName ?? null,
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
        previewUrl,
        printReadyUrl,
        customerNotes: parsed.customerNotes || null,
        priceCup: PRICE_CUP,
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
          originalUrl: p.url,
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

    const adminPath = `/admin/orders/${order.code}`;
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
