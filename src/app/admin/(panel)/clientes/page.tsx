import Link from "next/link";
import { desc, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { AdminPageHeader } from "@/components/admin/ui/page-header";

export const dynamic = "force-dynamic";

type Customer = {
  phone: string;
  name: string | null;
  ordersCount: number;
  totalUsdCents: number;
  totalCup: number;
  firstOrderAt: Date;
  lastOrderAt: Date;
  recentCodes: string[];
};

/**
 * Vista de clientes derivada de la tabla `orders`. Agrupamos por
 * customerPhone (que es el identity natural — el cliente cubano se
 * recontacta por WhatsApp con ese número). El nombre puede variar
 * entre pedidos; tomamos el más reciente que no sea null.
 *
 * Por ahora es solo lectura — no hay tabla `customers` separada. Si
 * se necesita CRUD (tags, notas, segmentos) ahí sí migramos a una
 * tabla dedicada.
 */
export default async function AdminClientesPage() {
  const all = await db
    .select({
      phone: orders.customerPhone,
      name: orders.customerName,
      code: orders.code,
      priceCup: orders.priceCup,
      priceUsdCents: orders.priceUsdCents,
      submittedAt: orders.submittedAt,
      createdAt: orders.createdAt,
      status: orders.status,
    })
    .from(orders)
    .where(isNotNull(orders.customerPhone))
    .orderBy(desc(orders.createdAt));

  const byPhone = new Map<string, Customer>();
  for (const o of all) {
    if (!o.phone) continue;
    // Excluir pedidos cancelados del total $ gastado (no se cobraron)
    const isCancelled = o.status === "cancelled";
    const at = o.submittedAt ?? o.createdAt;
    const existing = byPhone.get(o.phone);
    if (!existing) {
      byPhone.set(o.phone, {
        phone: o.phone,
        name: o.name ?? null,
        ordersCount: 1,
        totalUsdCents: isCancelled ? 0 : o.priceUsdCents,
        totalCup: isCancelled ? 0 : o.priceCup,
        firstOrderAt: at,
        lastOrderAt: at,
        recentCodes: [o.code],
      });
    } else {
      existing.ordersCount += 1;
      if (!isCancelled) {
        existing.totalUsdCents += o.priceUsdCents;
        existing.totalCup += o.priceCup;
      }
      // Las queries vienen ordenadas por createdAt DESC, así que el primer
      // nombre encontrado es el más reciente. Solo lo seteamos si está null.
      if (!existing.name && o.name) existing.name = o.name;
      if (at < existing.firstOrderAt) existing.firstOrderAt = at;
      if (at > existing.lastOrderAt) existing.lastOrderAt = at;
      if (existing.recentCodes.length < 4) existing.recentCodes.push(o.code);
    }
  }

  const customers = Array.from(byPhone.values()).sort(
    (a, b) => b.lastOrderAt.getTime() - a.lastOrderAt.getTime(),
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-10">
      <AdminPageHeader
        eyebrow="Clientes"
        title="Tus clientes"
        description={`${customers.length} cliente${customers.length === 1 ? "" : "s"} con al menos un pedido. Agrupados por número de WhatsApp.`}
      />

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-[color:var(--color-navy)]/10 bg-white p-10 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
            Sin clientes todavía
          </p>
          <p className="mt-3 text-[13px] text-[color:var(--color-navy)]/65">
            Cuando alguien haga un pedido, aparecerá acá agrupado por su
            teléfono.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[color:var(--color-navy)]/10 bg-white">
          <table className="w-full text-left text-[13px] text-[color:var(--color-navy)]">
            <thead className="bg-[color:var(--color-navy)]/[0.04] font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
              <tr>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Teléfono</th>
                <th className="px-3 py-2.5 text-right">Pedidos</th>
                <th className="px-3 py-2.5 text-right">Total USD</th>
                <th className="px-3 py-2.5 text-right">Total CUP</th>
                <th className="px-3 py-2.5">Último pedido</th>
                <th className="px-3 py-2.5">Recientes</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.phone}
                  className="border-t border-[color:var(--color-navy)]/8 transition-colors hover:bg-[color:var(--color-navy)]/[0.03]"
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium">
                      {c.name ?? <em className="text-[color:var(--color-navy)]/45">sin nombre</em>}
                    </div>
                    <div className="font-mono text-[10px] text-[color:var(--color-navy)]/45">
                      Desde {c.firstOrderAt.toLocaleDateString("es-CU")}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px]">
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[color:var(--color-navy)]/85 hover:underline"
                    >
                      {c.phone}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[13px]">
                    <strong>{c.ordersCount}</strong>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[color:var(--color-navy)]/85">
                    ${(c.totalUsdCents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[color:var(--color-navy)]/55">
                    {c.totalCup.toLocaleString("es-CU")}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[color:var(--color-navy)]/65">
                    {c.lastOrderAt.toLocaleDateString("es-CU", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {c.recentCodes.map((code) => (
                        <Link
                          key={code}
                          href={`/admin/pedidos/${code}`}
                          className="inline-flex items-center rounded-full border border-[color:var(--color-navy)]/15 bg-white px-2 py-0.5 font-mono text-[10px] text-[color:var(--color-navy)]/75 hover:bg-[color:var(--color-navy)]/[0.04]"
                        >
                          {code}
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
