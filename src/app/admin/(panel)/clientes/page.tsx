import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { CustomersList } from "@/components/admin/customers-list";
import { getCustomersWithStats } from "@/lib/data/customers-db";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  const customers = await getCustomersWithStats();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-10">
      <AdminPageHeader
        eyebrow="Clientes"
        title="Tus clientes"
        description={`${customers.length} cliente${customers.length === 1 ? "" : "s"} con al menos un pedido. Click en "Ver" para editar tags y notas.`}
      />
      <CustomersList initial={customers} />
    </div>
  );
}
