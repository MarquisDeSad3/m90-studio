import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import {
  AdminUsersManager,
  type AdminUserRow,
} from "@/components/admin/admin-users-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const me = await getCurrentAdmin();
  if (!me) {
    redirect("/admin/login?next=/admin/usuarios");
  }
  if (me.role !== "owner") {
    redirect("/admin/pedidos");
  }

  const rows = await db
    .select()
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));

  const initial: AdminUserRow[] = rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role as "owner" | "manager" | "staff",
    lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
      <AdminPageHeader
        eyebrow="Usuarios"
        title="Quién entra al panel"
        description="Creá, editá o quitá usuarios del panel. Cada uno se loguea con su email y contraseña propios."
      />

      <AdminUsersManager initial={initial} currentAdminId={me.id} />
    </div>
  );
}
