import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramSubscribers } from "@/lib/db/schema";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import {
  TelegramSubscribersManager,
  type Subscriber,
} from "@/components/admin/telegram-subscribers-manager";

export const dynamic = "force-dynamic";

export default async function AdminTelegramPage() {
  const rows = await db
    .select()
    .from(telegramSubscribers)
    .orderBy(desc(telegramSubscribers.requestedAt));

  const subscribers: Subscriber[] = rows.map((r) => ({
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
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
      <AdminPageHeader
        eyebrow="Telegram"
        title="Notificaciones"
        description="Quién recibe alertas cuando entra un pedido nuevo. La gente le manda /start al bot @m90studio_pedidos_bot y vos aprobás desde acá."
      />

      <TelegramSubscribersManager initial={subscribers} />
    </div>
  );
}
