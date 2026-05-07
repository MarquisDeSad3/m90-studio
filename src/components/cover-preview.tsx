"use client";

import { cn } from "@/lib/utils";

/**
 * Preview visual de la funda con la foto del cliente APLICADA.
 *
 * Renderiza la silueta del case (TPU translúcido para "normal", placa
 * blanca opaca encima para "coated") con la foto compuesta integrada
 * dentro de la zona de impresión + recorte de cámara.
 *
 * Es CSS/SVG puro — sin assets externos. Si más adelante conseguís
 * fotos reales de fundas blancas vacías, las usás de background y este
 * componente solo cambia el `<img>` de fondo.
 */
export function CoverPreview({
  photoUrl,
  coverType,
  model,
  height = 520,
  className,
}: {
  /** URL de la imagen compuesta del cliente (preview o printReady). */
  photoUrl: string | null;
  coverType: "normal" | "coated";
  model: {
    widthMm: number;
    heightMm: number;
    cornerRadiusMm: number;
    camera?: [number, number, number, number] | null;
    name?: string;
  };
  /** Alto en pixels del preview. El ancho se calcula del aspect ratio. */
  height?: number;
  className?: string;
}) {
  const aspectW = model.widthMm;
  const aspectH = model.heightMm;
  const width = (aspectW / aspectH) * height;
  const cornerRadius = (model.cornerRadiusMm / aspectH) * height;

  const cameraStyle = model.camera
    ? {
        left: `${(model.camera[0] / aspectW) * 100}%`,
        top: `${(model.camera[1] / aspectH) * 100}%`,
        width: `${(model.camera[2] / aspectW) * 100}%`,
        height: `${(model.camera[3] / aspectH) * 100}%`,
      }
    : null;

  return (
    <div
      className={cn(
        "relative isolate flex-shrink-0",
        className,
      )}
      style={{ width, height }}
    >
      {/* Container del case con sombra exterior (lo que cuelga) */}
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: cornerRadius,
          boxShadow:
            "0 30px 60px -25px rgba(1, 27, 83, 0.45), 0 12px 25px -10px rgba(1, 27, 83, 0.20)",
        }}
      >
        {/* La foto del cliente — fondo full bleed */}
        {photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photoUrl}
            alt="Preview"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-[color:var(--color-navy)]/8" />
        )}

        {/* COATED: placa blanca encima cubriendo casi todo. Deja un margen
            visible alrededor donde se ve el TPU. */}
        {coverType === "coated" && photoUrl && (
          <>
            {/* Margen TPU visible (sutil tinte) */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ borderRadius: cornerRadius }}
            />
            {/* La placa blanca — dejamos margen interior */}
            <div
              aria-hidden
              className="absolute inset-[8px] overflow-hidden"
              style={{
                borderRadius: Math.max(cornerRadius - 6, 4),
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 1px rgba(11,30,77,0.08)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              {/* Brillo sutil arriba */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent"
              />
            </div>
          </>
        )}

        {/* TPU shine overlay — gradient sutil para dar look de plástico
            transparente. Solo en NORMAL. Para COATED el brillo va sobre la
            placa (ya hecho arriba). */}
        {coverType === "normal" && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-3"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 100%)",
              }}
            />
          </>
        )}

        {/* Recorte de cámara — encima de TODO (la cámara real recorta el
            material físico, no se imprime). */}
        {cameraStyle && (
          <div
            aria-hidden
            className="absolute"
            style={cameraStyle}
          >
            <div
              className="absolute inset-0 rounded-[6px]"
              style={{
                background:
                  "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #0d0d0d 100%)",
                boxShadow:
                  "inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -1px 2px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)",
              }}
            />
            {/* Lentes simulados — solo si la cámara es razonablemente cuadrada */}
            <CameraLenses />
          </div>
        )}
      </div>

      {/* Borde redondeado tipo "case" — pequeña línea exterior */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: cornerRadius,
          boxShadow: "inset 0 0 0 1px rgba(11,30,77,0.18)",
        }}
      />
    </div>
  );
}

function CameraLenses() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* 3 lentes en triángulo — clásica disposición Apple Pro */}
      <Lens cx={32} cy={32} r={14} />
      <Lens cx={68} cy={32} r={14} />
      <Lens cx={32} cy={68} r={14} />
      {/* Flash/LiDAR */}
      <circle cx={68} cy={68} r={9} fill="#3a3a3a" />
      <circle cx={68} cy={68} r={5} fill="#1a1a1a" />
    </svg>
  );
}

function Lens({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="#3a3a3a" />
      {/* Inner glass */}
      <circle cx={cx} cy={cy} r={r - 3} fill="#0a0a0a" />
      {/* Reflection */}
      <ellipse
        cx={cx - r * 0.3}
        cy={cy - r * 0.3}
        rx={r * 0.3}
        ry={r * 0.18}
        fill="rgba(255,255,255,0.18)"
      />
    </g>
  );
}
