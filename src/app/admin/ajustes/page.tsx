import Link from "next/link";
import { desc } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { coverPricing, telegramSubscribers } from "@/lib/db/schema";
import { Logo } from "@/components/logo";
import { PricingEditor } from "@/components/admin/pricing-editor";
import {
  TelegramSubscribersManager,
  type Subscriber,
} from "@/components/admin/telegram-subscribers-manager";

export const dynamic = "force-dynamic";

export default async function AdminAjustesPage() {
  const [pricingRows, subscriberRows] = await Promise.all([
    db
      .select({
        type: coverPricing.type,
        priceUsdCents: coverPricing.priceUsdCents,
        priceCup: coverPricing.priceCup,
        updatedAt: coverPricing.updatedAt,
      })
      .from(coverPricing),
    db
      .select()
      .from(telegramSubscribers)
      .orderBy(desc(telegramSubscribers.requestedAt)),
  ]);

  const initial = pricingRows.map((r) => ({
    type: r.type as "normal" | "coated",
    priceUsdCents: r.priceUsdCents,
    priceCup: r.priceCup,
    updatedAt: r.updatedAt.toISOString(),
  }));

  const subscribers: Subscriber[] = subscriberRows.map((r) => ({
    chatId: r.chatId,
    username: r.username,
    firstName: r.firstName,
    lastName: r.lastName,
    status: r.status as "pending" | "approved" | "rejected",
    requestedAt: r.requestedAt.toISOString(),
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
  }));

  return (
    <main className="min-h-screen bg-[color:var(--color-paper)]">
      <header className="sticky top-0 z-30 border-b border-[color:var(--color-navy)]/10 bg-[color:var(--color-paper)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[color:var(--color-navy)]/8"
              aria-label="Volver a pedidos"
            >
              <ArrowLeft className="h-4 w-4 text-[color:var(--color-navy)]" />
            </Link>
            <Logo variant="navy" className="text-[22px]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Admin · Ajustes
            </span>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)]"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-14">
        <div className="mb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
            · Ajustes
          </span>
          <h1 className="mt-2 font-display text-[clamp(36px,6vw,56px)] italic leading-tight text-[color:var(--color-navy)]">
            Precios de fundas
          </h1>
          <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[15px]">
            Cambiá el precio de cada tipo de funda en tiempo real. Los pedidos
            existentes mantienen el precio que tenían cuando los hicieron
            (snapshot). Solo afecta a los pedidos nuevos.
          </p>
        </div>

        <PricingEditor initial={initial} />

        <div className="mt-12">
          <TelegramSubscribersManager initial={subscribers} />
        </div>

        <div className="mt-12 rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 md:p-6">
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
      </section>
    </main>
  );
}
