import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramSubscribers } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ActionBody = z.object({
  action: z.enum(["approve", "reject"]),
});

const APPROVED_NOTIFY = [
  "✅ *Acceso aprobado · M90 Studio*",
  "",
  "A partir de ahora vas a recibir las notificaciones de pedidos.",
  "",
  "_No hace falta que respondas — es solo informativo._",
].join("\n");

const REJECTED_NOTIFY = [
  "❌ *Solicitud rechazada · M90 Studio*",
  "",
  "M90 rechazó tu solicitud de acceso. Si creés que es un error, escribile directamente.",
].join("\n");

async function sendTelegram(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch (err) {
    console.warn("[admin/telegram] sendMessage failed:", err);
  }
}

/** POST { action: "approve" | "reject" } */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ chatId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { chatId } = await ctx.params;

  let parsed: z.infer<typeof ActionBody>;
  try {
    parsed = ActionBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const now = new Date();
  if (parsed.action === "approve") {
    const result = await db
      .update(telegramSubscribers)
      .set({ status: "approved", approvedAt: now })
      .where(eq(telegramSubscribers.chatId, chatId))
      .returning({ chatId: telegramSubscribers.chatId });
    if (result.length === 0) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    // Avisar al subscriber que fue aprobado
    await sendTelegram(chatId, APPROVED_NOTIFY);
    return NextResponse.json({ ok: true });
  }

  // reject
  const result = await db
    .update(telegramSubscribers)
    .set({ status: "rejected", rejectedAt: now })
    .where(eq(telegramSubscribers.chatId, chatId))
    .returning({ chatId: telegramSubscribers.chatId });
  if (result.length === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  await sendTelegram(chatId, REJECTED_NOTIFY);
  return NextResponse.json({ ok: true });
}

/** DELETE — quita al subscriber de la tabla. No le manda mensaje (puede
 *  hacer /start de nuevo si quiere reaplicar). */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ chatId: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { chatId } = await ctx.params;

  const result = await db
    .delete(telegramSubscribers)
    .where(eq(telegramSubscribers.chatId, chatId))
    .returning({ chatId: telegramSubscribers.chatId });
  if (result.length === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
