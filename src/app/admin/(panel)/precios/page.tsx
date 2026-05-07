import { db } from "@/lib/db";
import { coverPricing } from "@/lib/db/schema";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { PricingEditor } from "@/components/admin/pricing-editor";

export const dynamic = "force-dynamic";

export default async function AdminPreciosPage() {
  const rows = await db
    .select({
      type: coverPricing.type,
      priceUsdCents: coverPricing.priceUsdCents,
      priceCup: coverPricing.priceCup,
      updatedAt: coverPricing.updatedAt,
    })
    .from(coverPricing);

  const initial = rows.map((r) => ({
    type: r.type as "normal" | "coated",
    priceUsdCents: r.priceUsdCents,
    priceCup: r.priceCup,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
      <AdminPageHeader
        eyebrow="Precios"
        title="Tarifas de fundas"
        description="Cambiá el precio de cada tipo de funda en tiempo real. Los pedidos existentes mantienen el precio que tenían cuando los hicieron (snapshot). Solo afecta a los pedidos nuevos."
      />

      <PricingEditor initial={initial} />

      <div className="mt-10 rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 md:p-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
          · Cómo funciona
        </h3>
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[color:var(--color-navy)]/75 md:text-[14px]">
          <li>
            <strong>Normal</strong>: funda con transferencia térmica simple
            sobre TPU. Lo más barato y rápido.
          </li>
          <li>
            <strong>Recubrimiento</strong>: funda 2-en-1 con placa blanca de
            aluminio para sublimación. Color más nítido y resistente.
          </li>
          <li>
            El cliente elige el tipo en el último paso del editor antes de
            mandar el pedido por WhatsApp.
          </li>
          <li>
            Los precios se aplican <strong>solo a pedidos nuevos</strong>. Los
            pedidos viejos ya tienen su precio guardado.
          </li>
        </ul>
      </div>
    </div>
  );
}
