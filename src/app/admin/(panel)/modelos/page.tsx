import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { ModelsEditor } from "@/components/admin/models-editor";
import { getAllPhoneModelsForAdmin } from "@/lib/data/phone-models-db";

export const dynamic = "force-dynamic";

export default async function AdminModelosPage() {
  const models = await getAllPhoneModelsForAdmin();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-10">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Modelos de teléfono"
        description="Editá las dimensiones de cada modelo. El grosor (depth) define cuánto envuelve la sublimación los costados del cover. Si una funda real te queda corta o larga, ajustá el grosor acá y los pedidos NUEVOS de ese modelo salen con el wrap corregido."
      />
      <ModelsEditor initial={models} />
    </div>
  );
}
