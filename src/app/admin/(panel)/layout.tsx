import { redirect } from "next/navigation";
import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, telegramSubscribers } from "@/lib/db/schema";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import type { AdminNavBadges } from "@/lib/admin-nav";

export const dynamic = "force-dynamic";

/** Layout compartido para TODAS las páginas autenticadas del admin.
 *  Hace auth guard, lee counts para badges, y envuelve children con
 *  sidebar/topbar/bottom-nav. Las páginas adentro solo se preocupan por
 *  su contenido. */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentAdmin();
  if (!me) {
    redirect("/admin/login");
  }

  // Counts para badges en sidebar/bottom-nav. Si la DB falla, mostramos 0.
  let badges: AdminNavBadges = {};
  try {
    const [tgPending] = await db
      .select({ n: count() })
      .from(telegramSubscribers)
      .where(eq(telegramSubscribers.status, "pending"));
    const [oPending] = await db
      .select({ n: count() })
      .from(orders)
      .where(
        inArray(orders.status, [
          "submitted",
          "confirmed",
          "in_production",
          "ready",
        ]),
      );
    badges = {
      telegramPending: tgPending?.n ?? 0,
      ordersPending: oPending?.n ?? 0,
    };
  } catch {
    badges = {};
  }

  return (
    <AdminShell role={me.role} adminName={me.name} badges={badges}>
      {children}
    </AdminShell>
  );
}
