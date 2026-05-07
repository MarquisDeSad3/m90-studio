import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc, desc } from "drizzle-orm";
import { ArrowLeft, Download, History, Phone, User } from "lucide-react";
import { db } from "@/lib/db";
import { orders, orderPhotos, orderEvents } from "@/lib/db/schema";
import { Logo } from "@/components/logo";
import { StatusActions } from "@/components/admin/status-actions";
import { AdminNotesEditor } from "@/components/admin/admin-notes-editor";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ code: string }>;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  submitted: "Recibido",
  confirmed: "Confirmado",
  in_production: "En producción",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_PALETTE: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  confirmed: "bg-amber-100 text-amber-800",
  in_production: "bg-violet-100 text-violet-800",
  ready: "bg-emerald-100 text-emerald-800",
  delivered: "bg-emerald-200 text-emerald-900",
  cancelled: "bg-red-100 text-red-800",
  draft: "bg-neutral-200 text-neutral-700",
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { code } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.code, code))
    .limit(1);

  if (!order) notFound();

  const [photos, events] = await Promise.all([
    db
      .select()
      .from(orderPhotos)
      .where(eq(orderPhotos.orderId, order.id))
      .orderBy(asc(orderPhotos.slotIndex)),
    db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, order.id))
      .orderBy(desc(orderEvents.createdAt)),
  ]);

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
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Pedido
            </span>
            <h1 className="mt-2 font-mono text-[clamp(28px,5vw,44px)] font-semibold tracking-tight text-[color:var(--color-navy)]">
              {order.code}
            </h1>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${
              STATUS_PALETTE[order.status] ?? "bg-neutral-200 text-neutral-700"
            }`}
          >
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-[320px_1fr] md:gap-10">
          <aside className="flex flex-col gap-4">
            <StatusActions
              code={order.code}
              status={
                order.status as
                  | "draft"
                  | "submitted"
                  | "confirmed"
                  | "in_production"
                  | "ready"
                  | "delivered"
                  | "cancelled"
              }
            />

            <AdminNotesEditor code={order.code} initial={order.adminNotes} />

            <Card title="Modelo" value={order.phoneModelName} />
            <Card
              title="Tipo de funda"
              value={
                <CoverTypeBadge
                  coverType={
                    (order.coverType ?? "normal") as "normal" | "coated"
                  }
                />
              }
            />
            <Card title="Layout" value={order.layoutName} />
            {order.widthMm && order.heightMm && (
              <Card
                title="Dimensiones (impresion)"
                value={
                  <div className="space-y-1 text-[13px]">
                    <div>
                      {order.widthMm} × {order.heightMm} mm
                      {order.cornerRadiusMm
                        ? ` · radius ${order.cornerRadiusMm}mm`
                        : ""}
                    </div>
                    <div className="font-mono text-[11px] text-[color:var(--color-navy)]/55">
                      @ 300 DPI ={" "}
                      {Math.round((order.widthMm * 300) / 25.4)} ×{" "}
                      {Math.round((order.heightMm * 300) / 25.4)} px
                    </div>
                  </div>
                }
              />
            )}
            <Card
              title="Precio (snapshot)"
              value={`$${((order.priceUsdCents ?? 700) / 100).toFixed(0)} USD · ${order.priceCup} CUP`}
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

          <div className="flex flex-col gap-8">
            {order.previewUrl && (
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
                    · Preview compuesto
                  </h2>
                  {order.printReadyUrl && (
                    <a
                      href={order.printReadyUrl}
                      download={`${order.code}-print-300dpi.jpg`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-navy)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] transition-all hover:-translate-y-0.5 md:text-[11px]"
                    >
                      <Download className="h-3 w-3" />
                      Print-ready 300 DPI
                    </a>
                  )}
                </div>
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
                  · Fotos · {photos.length}
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
                  original + recortada
                </span>
              </div>
              {photos.length === 0 ? (
                <p className="text-[13px] text-[color:var(--color-navy)]/55">
                  Sin fotos asociadas.
                </p>
              ) : (
                <ul className="flex flex-col gap-5">
                  {photos.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]">
                          Slot {p.slotIndex + 1}
                        </h3>
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
                          {p.sizeBytes
                            ? `${Math.round(p.sizeBytes / 1024)} KB original`
                            : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <PhotoCell
                          label="Original"
                          url={p.originalUrl}
                          downloadName={`${order.code}-slot${p.slotIndex + 1}-original`}
                        />
                        {p.croppedUrl ? (
                          <PhotoCell
                            label="Recortada"
                            url={p.croppedUrl}
                            downloadName={`${order.code}-slot${p.slotIndex + 1}-recortada`}
                          />
                        ) : (
                          <div className="grid place-items-center rounded-xl border border-dashed border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)] px-3 text-center">
                            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
                              · sin cropeada<br />
                              (pedido pre-feature)
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-[color:var(--color-navy)]/55" />
                <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
                  · Historial · {events.length}
                </h2>
              </div>
              {events.length === 0 ? (
                <p className="text-[13px] text-[color:var(--color-navy)]/55">
                  Sin cambios registrados todavía.
                </p>
              ) : (
                <ol className="overflow-hidden rounded-2xl border border-[color:var(--color-navy)]/12 bg-white">
                  {events.map((ev, i) => (
                    <li
                      key={ev.id}
                      className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-[13px] ${
                        i > 0 ? "border-t border-[color:var(--color-navy)]/8" : ""
                      }`}
                    >
                      <span className="font-mono text-[11px] text-[color:var(--color-navy)]/55">
                        {fmt(ev.createdAt)}
                      </span>
                      <span className="text-[color:var(--color-navy)]">
                        {ev.fromStatus
                          ? `${STATUS_LABEL[ev.fromStatus] ?? ev.fromStatus} → `
                          : ""}
                        <span className="font-medium">
                          {STATUS_LABEL[ev.toStatus] ?? ev.toStatus}
                        </span>
                      </span>
                      {ev.actor && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/45">
                          · {ev.actor}
                        </span>
                      )}
                      {ev.note && (
                        <span className="basis-full text-[12px] text-[color:var(--color-navy)]/65">
                          {ev.note}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
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

function CoverTypeBadge({ coverType }: { coverType: "normal" | "coated" }) {
  if (coverType === "coated") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
        · Recubrimiento (placa blanca)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-navy)]/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-navy)]/75">
      · Normal
    </span>
  );
}

function PhotoCell({
  label,
  url,
  downloadName,
}: {
  label: string;
  url: string;
  downloadName: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
          · {label}
        </span>
        <a
          href={url}
          download={downloadName}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)]"
        >
          <Download className="h-3 w-3" />
          <span>bajar</span>
        </a>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-xl border border-[color:var(--color-navy)]/12 bg-[color:var(--color-paper)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          loading="lazy"
          className="block aspect-square w-full object-cover"
        />
      </a>
    </div>
  );
}
