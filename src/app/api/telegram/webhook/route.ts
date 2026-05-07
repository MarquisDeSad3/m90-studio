import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramSubscribers } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook que recibe los mensajes que la gente le manda al bot. Telegram
 * pega un POST aquí cada vez que alguien le habla.
 *
 * Flujo de suscripción:
 *   - Alguien manda /start → lo insertamos como `pending` y le decimos
 *     que el admin tiene que aprobarlo.
 *   - Si ya está `pending` → re-respondemos con el mismo mensaje.
 *   - Si ya está `approved` → mensaje de bienvenida normal.
 *   - Si está `rejected` → mensaje educado de que no tiene acceso.
 *
 * El admin aprueba/rechaza desde /admin/ajustes.
 *
 * Setup (una vez después del deploy):
 *
 *   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     --data-urlencode "url=https://m90.studio/api/telegram/webhook" \
 *     --data-urlencode "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
 *
 * Para borrarlo:
 *   curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
 */

const PENDING_MESSAGE = [
  "👋 *Hola, soy el bot de M90 Studio*",
  "",
  "Tu solicitud de acceso a las notificaciones de pedidos quedó *pendiente*.",
  "",
  "M90 te tiene que aprobar manualmente desde el panel. Cuando suceda, te llega un mensaje aquí mismo.",
].join("\n");

const APPROVED_WELCOME = [
  "✅ *Acceso aprobado · M90 Studio*",
  "",
  "Aquí te van a llegar las notificaciones cuando entre un pedido nuevo, con todos los datos:",
  "",
  "• Nombre y teléfono del cliente",
  "• Modelo y tipo de funda",
  "• Layout y cantidad de fotos",
  "• Precio y notas",
  "• Link directo al admin",
  "",
  "_No hace falta que respondas — es solo informativo._",
].join("\n");

const REJECTED_MESSAGE = [
  "❌ *Acceso denegado · M90 Studio*",
  "",
  "Tu solicitud fue rechazada. Si creés que es un error, escribile directamente a M90.",
].join("\n");

const ALREADY_PENDING_MESSAGE = [
  "⏳ Tu solicitud sigue *pendiente* de aprobación.",
  "",
  "Cuando M90 la apruebe te llega un aviso aquí.",
].join("\n");

type TelegramUpdate = {
  message?: {
    chat?: { id?: number; type?: string };
    from?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    text?: string;
  };
};

async function sendTelegram(
  token: string,
  chatId: string,
  text: string,
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch (err) {
    console.warn("[telegram webhook] sendMessage failed:", err);
  }
}

export async function POST(req: Request) {
  // Verificación de origen (header de Telegram)
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== expectedSecret) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: true });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const chatRaw = update.message?.chat?.id;
  const text = update.message?.text ?? "";
  if (chatRaw == null) {
    return NextResponse.json({ ok: true });
  }
  const chatId = String(chatRaw);

  // Solo procesamos /start. Cualquier otro mensaje lo ignoramos
  // silenciosamente (si en el futuro queremos comandos /pedidos, /total,
  // etc., los agregamos acá).
  if (text !== "/start" && !text.startsWith("/start ")) {
    return NextResponse.json({ ok: true });
  }

  const from = update.message?.from;

  try {
    // Buscar si ya existe
    const [existing] = await db
      .select()
      .from(telegramSubscribers)
      .where(eq(telegramSubscribers.chatId, chatId))
      .limit(1);

    if (existing) {
      // Ya está registrado — respondemos según su status
      if (existing.status === "approved") {
        await sendTelegram(token, chatId, APPROVED_WELCOME);
      } else if (existing.status === "rejected") {
        await sendTelegram(token, chatId, REJECTED_MESSAGE);
      } else {
        await sendTelegram(token, chatId, ALREADY_PENDING_MESSAGE);
      }
      return NextResponse.json({ ok: true });
    }

    // Insertar nuevo subscriber pending
    await db.insert(telegramSubscribers).values({
      chatId,
      username: from?.username ?? null,
      firstName: from?.first_name ?? null,
      lastName: from?.last_name ?? null,
      status: "pending",
    });
    await sendTelegram(token, chatId, PENDING_MESSAGE);
  } catch (err) {
    console.warn("[telegram webhook] db error:", err);
    // Si la DB falla, igual respondemos algo amigable y devolvemos 200
    // (Telegram reintenta los webhooks que devuelven non-2xx, no
    //  queremos spam en los retries).
    await sendTelegram(token, chatId, PENDING_MESSAGE);
  }

  return NextResponse.json({ ok: true });
}
