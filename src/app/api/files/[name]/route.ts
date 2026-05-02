import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/storage";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Sirve archivos subidos por los clientes (originales + thumbs).
 * El filename siempre es 32 hex chars + extension valida — cualquier
 * otra cosa es un intento de path traversal y devolvemos 404.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> },
) {
  const { name } = await ctx.params;

  if (!/^[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, name);
  let content: Buffer;
  let size: number;
  try {
    const s = await stat(filePath);
    if (!s.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }
    size = s.size;
    content = await readFile(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = name.split(".").pop()!.toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  return new NextResponse(content as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      // Filenames son random => contenido inmutable, cache infinito.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
