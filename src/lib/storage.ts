import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

/**
 * Donde guardamos los archivos. En producción es un volumen Coolify
 * persistente (`/data/uploads`). En local cae a `.uploads/` del repo.
 */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30MB hard cap

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Guarda un Blob/File en disco. Devuelve el filename random para servirlo
 * via /api/files/[name]. El filename es 32 hex chars + extension.
 */
export async function saveImageFile(
  file: Blob | File,
  contentType?: string,
): Promise<{
  filename: string;
  url: string;
  size: number;
  mime: string;
}> {
  const mime = (contentType ?? (file as File).type ?? "").toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) {
    throw new Error(`Tipo de archivo no permitido: ${mime || "desconocido"}`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `Archivo demasiado pesado (${file.size} bytes, max ${MAX_FILE_BYTES})`,
    );
  }

  await ensureUploadDir();
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;
  const fullPath = path.join(UPLOAD_DIR, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buf);

  return {
    filename,
    url: `/api/files/${filename}`,
    size: buf.byteLength,
    mime,
  };
}
