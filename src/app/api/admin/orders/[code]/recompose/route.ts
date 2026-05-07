import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderPhotos, orderEvents } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { findLayout } from "@/lib/data/layouts";
import { PHONE_MODELS } from "@/lib/data/phone-models";
import { composeOrderPrintReady } from "@/lib/editor/compose-server";
import {
  diskPathFromFilename,
  filenameFromUrl,
  saveImageBuffer,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  /** Wrap total a aplicar a cada lado (cuerpo + 2*wrapMm = print area).
      0 = sin wrap (solo cuerpo). Max 30mm es absurdo pero damos margen
      por si un cover es muy grueso. */
  wrapMm: z.number().int().min(0).max(30),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code } = await ctx.params;

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.code, code))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const layout = findLayout(order.layoutId);
  if (!layout) {
    return NextResponse.json(
      { error: `Layout ${order.layoutId} desconocido` },
      { status: 422 },
    );
  }

  const model = PHONE_MODELS.find((m) => m.slug === order.phoneModelSlug);
  if (!model) {
    return NextResponse.json(
      { error: `Modelo ${order.phoneModelSlug} desconocido` },
      { status: 422 },
    );
  }

  const photos = await db
    .select()
    .from(orderPhotos)
    .where(eq(orderPhotos.orderId, order.id));

  if (photos.length === 0) {
    return NextResponse.json(
      { error: "El pedido no tiene fotos guardadas" },
      { status: 422 },
    );
  }

  // Print area = cuerpo del telefono + 2*wrapMm a cada eje
  const outWidthMm = model.widthMm + 2 * parsed.wrapMm;
  const outHeightMm = model.heightMm + 2 * parsed.wrapMm;

  let composed: { buffer: Buffer; width: number; height: number };
  try {
    composed = await composeOrderPrintReady({
      outWidthMm,
      outHeightMm,
      slots: layout.slots,
      photos: photos.map((p) => {
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
  } catch (err) {
    console.error("[recompose] sharp compose failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Compose falló: ${err.message}`
            : "Compose falló",
      },
      { status: 500 },
    );
  }

  const saved = await saveImageBuffer(composed.buffer, "jpg");
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        printReadyUrl: saved.url,
        widthMm: outWidthMm,
        heightMm: outHeightMm,
        customWrapMm: parsed.wrapMm,
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));
    // Evento de auditoría sin transición de estado (fromStatus null,
    // toStatus = mismo). Se pinta en la timeline del pedido.
    await tx.insert(orderEvents).values({
      orderId: order.id,
      fromStatus: null,
      toStatus: order.status,
      actor: "admin",
      note: `Print-ready regenerado · wrap=${parsed.wrapMm}mm · ${outWidthMm}×${outHeightMm}mm`,
    });
  });

  return NextResponse.json({
    ok: true,
    printReadyUrl: saved.url,
    widthMm: outWidthMm,
    heightMm: outHeightMm,
    wrapMm: parsed.wrapMm,
  });
}
