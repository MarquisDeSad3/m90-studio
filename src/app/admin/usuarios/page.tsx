import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { Logo } from "@/components/logo";
import { getCurrentAdmin } from "@/lib/admin-auth";
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
    // Manager / staff no entran a esta página
    redirect("/admin/orders");
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
              · Admin · Usuarios
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
            · Usuarios
          </span>
          <h1 className="mt-2 font-display text-[clamp(36px,6vw,56px)] italic leading-tight text-[color:var(--color-navy)]">
            Quién entra al panel
          </h1>
          <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[15px]">
            Creá, editá o quitá usuarios del panel de M90. Cada uno se loguea con su email y contraseña propios.
          </p>
        </div>

        <AdminUsersManager initial={initial} currentAdminId={me.id} />
      </section>
    </main>
  );
}
