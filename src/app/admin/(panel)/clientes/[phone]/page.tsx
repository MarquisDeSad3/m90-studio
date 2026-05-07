import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { CustomerDetail } from "@/components/admin/customer-detail";
import { getCustomerByPhone } from "@/lib/data/customers-db";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone: phoneRaw } = await params;
  const phone = decodeURIComponent(phoneRaw);

  const data = await getCustomerByPhone(phone);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6 md:py-10">
      <Link
        href="/admin/clientes"
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)]"
      >
        <ArrowLeft className="h-3 w-3" />
        Volver a clientes
      </Link>

      <AdminPageHeader
        eyebrow="Cliente"
        title={data.customer.name ?? data.customer.phone}
        description={`${data.orderRows.length} pedido${data.orderRows.length === 1 ? "" : "s"} en total · WhatsApp ${data.customer.phone}`}
      />

      <CustomerDetail
        customer={{
          ...data.customer,
          createdAt: data.customer.createdAt.toISOString(),
          updatedAt: data.customer.updatedAt.toISOString(),
        }}
        orders={data.orderRows.map((o) => ({
          id: o.id,
          code: o.code,
          status: o.status,
          coverType: o.coverType,
          phoneModelName: o.phoneModelName,
          layoutName: o.layoutName,
          priceCup: o.priceCup,
          priceUsdCents: o.priceUsdCents,
          submittedAt: o.submittedAt?.toISOString() ?? null,
          createdAt: o.createdAt.toISOString(),
          deliveredAt: o.deliveredAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
