import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { ArrowLeft, Download, Phone, User } from "lucide-react";
import { db } from "@/lib/db";
import { orders, orderPhotos } from "@/lib/db/schema";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { code } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.code, code))
    .limit(1);

  if (!order) notFound();

  const photos = await db
    .select()
    .from(orderPhotos)
    .where(eq(orderPhotos.orderId, order.id))
    .orderBy(asc(orderPhotos.slotIndex));

  return (
    <main className="min-h-screen bg-[color:var(--color-paper)]">
      <header className="sticky top-0 z-30 border-b border-[color:var(--color-navy)]/10 bg-[color:var(--color-paper)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[color:var(--color-navy)]/8"
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4 text-[color:var(--color-navy)]" />
            </Link>
            <Logo variant="navy" className="text-[22px]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Admin · Pedido
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-14">
        <div className="mb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
            · Pedido
          </span>
          <h1 className="mt-2 font-mono text-[clamp(28px,5vw,44px)] font-semibold tracking-tight text-[color:var(--color-navy)]">
            {order.code}
          </h1>
        </div>

        <div className="grid gap-8 md:grid-cols-[320px_1fr] md:gap-10">
          {/* Resumen */}
          <aside className="flex flex-col gap-4">
            <Card title="Modelo" value={order.phoneModelName} />
            <Card title="Layout" value={order.layoutName} />
            <Card
              title="Precio (snapshot)"
              value={`$15 USD · ${order.priceCup} CUP`}
            />
            <Card
              title="Estado"
              value={
                {
                  submitted: "Recibido",
                  confirmed: "Confirmado",
                  in_production: "En producción",
                  ready: "Listo",
                  delivered: "Entregado",
                  cancelled: "Cancelado",
                  draft: "Borrador",
                }[order.status] ?? order.status
              }
            />

            {(order.customerName || order.customerPhone) && (
              <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-4">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-navy-500)]">
                  · Cliente
                </h3>
                {order.customerName && (
                  <div className="mt-2 flex items-center gap-2 text-[14px] text-[color:var(--color-navy)]">
                    <User className="h-3.5 w-3.5 text-[color:var(--color-navy)]/45" />
                    {order.customerName}
                  </div>
                )}
                {order.customerPhone && (
                  <a
                    href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center gap-2 text-[14px] text-[color:var(--color-navy)] hover:text-[color:var(--color-navy-500)]"
                  >
                    <Phone className="h-3.5 w-3.5 text-[color:var(--color-navy)]/45" />
                    {order.customerPhone}
                  </a>
                )}
              </div>
            )}

            {order.customerNotes && (
              <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-4">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-navy-500)]">
                  · Notas del cliente
                </h3>
                <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-[color:var(--color-navy)]/80">
                  {order.customerNotes}
                </p>
              </div>
            )}

            <Card
              title="Fechas"
              value={(
                <div className="space-y-1.5 text-[12px] text-[color:var(--color-navy)]/65">
                  <div>Creado: {fmt(order.createdAt)}</div>
                  {order.submittedAt && (
                    <div>Enviado: {fmt(order.submittedAt)}</div>
                  )}
                  {order.confirmedAt && (
                    <div>Confirmado: {fmt(order.confirmedAt)}</div>
                  )}
                  {order.deliveredAt && (
                    <div>Entregado: {fmt(order.deliveredAt)}</div>
                  )}
                </div>
              )}
            />
          </aside>

          {/* Fotos + preview */}
          <div className="flex flex-col gap-8">
            {order.previewUrl && (
              <section>
                <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
                  · Preview compuesto
                </h2>
                <a
                  href={order.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-3xl border border-[color:var(--color-navy)]/12 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.previewUrl}
                    alt={`Preview ${order.code}`}
                    className="block w-full max-w-[480px] object-contain"
                  />
                </a>
              </section>
            )}

            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
                  · Fotos originales · {photos.length}
                </h2>
              </div>
              {photos.length === 0 ? (
                <p className="text-[13px] text-[color:var(--color-navy)]/55">
                  Sin fotos asociadas.
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
                  {photos.map((p) => (
                    <li key={p.id}>
                      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-navy)]/12 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.originalUrl}
                          alt={`Foto slot ${p.slotIndex + 1}`}
                          loading="lazy"
                          className="block aspect-square w-full object-cover"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[color:var(--color-navy)]/55">
                        <span className="font-mono uppercase tracking-[0.22em]">
                          slot {p.slotIndex + 1}
                          {p.sizeBytes
                            ? ` · ${Math.round(p.sizeBytes / 1024)}KB`
                            : ""}
                        </span>
                        <a
                          href={p.originalUrl}
                          download
                          className="inline-flex items-center gap-1 hover:text-[color:var(--color-navy)]"
                        >
                          <Download className="h-3 w-3" />
                          Descargar
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-navy-500)]">
        · {title}
      </h3>
      <div className="mt-2 text-[14px] text-[color:var(--color-navy)]">
        {value}
      </div>
    </div>
  );
}

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Havana",
  });
}
