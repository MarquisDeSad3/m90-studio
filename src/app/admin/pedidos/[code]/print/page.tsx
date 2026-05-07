import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { PrintCover } from "@/components/admin/print-cover";
import {
  PHONE_MODELS,
  WRAP_CURVATURE_MM,
} from "@/lib/data/phone-models";

export const dynamic = "force-dynamic";

/**
 * Página de impresión optimizada para enviar el print-ready a la
 * impresora real al tamaño físico exacto del modelo.
 *
 * Vive FUERA del route group (panel) para no heredar el shell del admin
 * (sidebar/topbar/bottom-nav) — la página tiene que ser limpia para
 * imprimir bien.
 */
export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const me = await getCurrentAdmin();
  if (!me) {
    redirect(
      `/admin/login?next=${encodeURIComponent(`/admin/pedidos/${code}/print`)}`,
    );
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.code, code))
    .limit(1);

  if (!order) notFound();

  // Preferimos printReadyUrl (300 DPI server compose). Fallback a
  // previewUrl si por alguna razón el server compose falló.
  const imageUrl = order.printReadyUrl ?? order.previewUrl;
  if (!imageUrl) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-100 px-6">
        <div className="max-w-[400px] rounded-2xl border border-red-200 bg-white p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-red-700">
            · Pedido {code}
          </p>
          <p className="mt-3 text-[14px] text-[color:var(--color-navy)]/75">
            Este pedido no tiene imagen print-ready ni preview.
          </p>
        </div>
      </main>
    );
  }

  // Wrap actual del pedido: si el admin lo regeneró antes con un override,
  // arrancamos desde ese valor; si no, usamos el default del modelo
  // (depthMm + 3mm de curvatura). Si el modelo desapareció del catálogo
  // (rename de slug), caemos a 0 (sin wrap).
  const model = PHONE_MODELS.find((m) => m.slug === order.phoneModelSlug);
  const defaultWrapMm = model ? model.depthMm + WRAP_CURVATURE_MM : 0;
  const currentWrapMm = order.customWrapMm ?? defaultWrapMm;
  const canRecompose = !!model;

  return (
    <PrintCover
      code={order.code}
      imageUrl={imageUrl}
      widthMm={order.widthMm ?? 75}
      heightMm={order.heightMm ?? 150}
      coverType={(order.coverType ?? "normal") as "normal" | "coated"}
      currentWrapMm={currentWrapMm}
      canRecompose={canRecompose}
    />
  );
}
