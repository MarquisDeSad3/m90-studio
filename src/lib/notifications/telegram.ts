import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramSubscribers } from "@/lib/db/schema";

/**
 * Notificación al admin de M90 via Telegram Bot.
 *
 * Destinatarios: leemos la tabla `telegram_subscribers` con status
 * `approved` y mandamos a cada uno. Si la tabla está vacía (ej. dev sin
 * suscriptores aprobados todavía), caemos al env var TELEGRAM_CHAT_ID
 * para no perder notificaciones durante el setup inicial.
 *
 * Setup (una vez):
 *   1. Abrir Telegram, hablar con @BotFather
 *   2. /newbot → seguir el flow → te da TOKEN tipo "12345:ABC..."
 *   3. Setear TELEGRAM_BOT_TOKEN en `.env`
 *   4. Setear webhook con setWebhook (ver telegram/webhook/route.ts)
 *   5. Cualquiera que haga /start al bot queda como `pending` en la tabla
 *      telegram_subscribers; el admin lo aprueba desde /admin/ajustes y
 *      empieza a recibir notificaciones.
 *
 * Si TELEGRAM_BOT_TOKEN no está, el helper silenciosamente loggea y
 * sigue. NUNCA debe romper el flujo del pedido.
 */

const API_BASE = "https://api.telegram.org";

/** Devuelve los chat_ids que deben recibir las notificaciones. Prioridad:
 *  1. Suscriptores con status='approved' en la tabla.
 *  2. Si la tabla está vacía o el query falla, fallback a TELEGRAM_CHAT_ID
 *     de env (puede ser uno o varios separados por coma).
 */
async function getRecipientChatIds(): Promise<string[]> {
  try {
    const rows = await db
      .select({ chatId: telegramSubscribers.chatId })
      .from(telegramSubscribers)
      .where(eq(telegramSubscribers.status, "approved"));
    if (rows.length > 0) return rows.map((r) => r.chatId);
  } catch (err) {
    console.warn("[telegram] subscribers table query failed:", err);
  }
  // Fallback: la env var (legacy + setup inicial)
  const envChat = process.env.TELEGRAM_CHAT_ID;
  if (!envChat) return [];
  return envChat
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Escapa caracteres reservados de MarkdownV2 — Telegram es puntilloso. */
function escMd(s: string): string {
  return s.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

export type AdminAlertInput = {
  code: string;
  customerName: string;
  customerPhone: string;
  phoneModelName: string;
  layoutLabel: string;
  coverType: "normal" | "coated";
  priceUsd: number;
  priceCup: number;
  photoCount: number;
  customerNotes?: string | null;
  adminUrl: string;
  /** URL absoluta o relativa del preview compuesto (`/api/files/<x>.jpg`).
      Si está disponible, se manda como `sendPhoto` para que el admin lo
      vea sin abrir el dashboard. Si falla, fallback a texto plano. */
  previewUrl?: string | null;
  /** Origin del sitio (https://m90.studio) para construir URLs absolutas
      cuando los assets son relativos. */
  siteOrigin?: string | null;
};

/** Manda alerta a TODOS los aprobados via Telegram. Nunca lanza — log + return.
 *  Devuelve cuántos enviaron OK y cuántos fallaron. */
export async function notifyAdminNewOrder(
  input: AdminAlertInput,
): Promise<{ ok: boolean; sent: number; failed: number; reason?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      reason: "TELEGRAM_BOT_TOKEN not configured",
    };
  }

  const recipients = await getRecipientChatIds();
  if (recipients.length === 0) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      reason: "no approved telegram subscribers",
    };
  }

  const coverLabel =
    input.coverType === "coated"
      ? "Recubrimiento (placa blanca)"
      : "Normal";

  const lines = [
    `*🆕 Pedido ${escMd(input.code)}*`,
    "",
    `*Cliente:* ${escMd(input.customerName)}`,
    `*Tel:* [${escMd(input.customerPhone)}](https://wa.me/${input.customerPhone.replace(/[^\d]/g, "")})`,
    "",
    `*Modelo:* ${escMd(input.phoneModelName)}`,
    `*Layout:* ${escMd(input.layoutLabel)} \\(${input.photoCount} foto${input.photoCount === 1 ? "" : "s"}\\)`,
    `*Tipo:* ${escMd(coverLabel)}`,
    `*Precio:* $${input.priceUsd} USD · ${input.priceCup} CUP`,
  ];
  if (input.customerNotes && input.customerNotes.trim()) {
    lines.push("", `*Notas:* ${escMd(input.customerNotes.trim())}`);
  }
  const fullAdminUrl = input.siteOrigin
    ? `${input.siteOrigin.replace(/\/$/, "")}${input.adminUrl}`
    : input.adminUrl;
  lines.push("", `[Abrir en admin →](${fullAdminUrl})`);

  const caption = lines.join("\n");

  // Construir URL absoluta del preview si tenemos siteOrigin
  let absolutePreview: string | null = null;
  if (input.previewUrl) {
    if (/^https?:\/\//i.test(input.previewUrl)) {
      absolutePreview = input.previewUrl;
    } else if (input.siteOrigin) {
      absolutePreview = `${input.siteOrigin.replace(/\/$/, "")}${input.previewUrl}`;
    }
  }

  let sent = 0;
  let failed = 0;
  for (const chatId of recipients) {
    try {
      if (absolutePreview) {
        // sendPhoto: si Telegram puede leer la URL, manda foto + caption.
        // Caption tiene un límite de ~1024 chars que cumple sobradamente.
        const res = await fetch(`${API_BASE}/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            photo: absolutePreview,
            caption,
            parse_mode: "MarkdownV2",
          }),
        });
        if (res.ok) {
          sent++;
          continue;
        }
        // Si Telegram rechazó la foto (URL no accesible públicamente
        // desde sus servers — caso común en localhost/dev), fallback a
        // texto plano. El destinatario igual recibe la alerta.
      }

      const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: false,
        }),
      });
      if (res.ok) sent++;
      else {
        failed++;
        const body = await res.text().catch(() => "");
        console.warn(
          `[telegram] sendMessage failed for ${chatId}: ${res.status} ${body.slice(0, 200)}`,
        );
      }
    } catch (err) {
      failed++;
      console.warn(
        `[telegram] fetch error for ${chatId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { ok: sent > 0, sent, failed };
}
