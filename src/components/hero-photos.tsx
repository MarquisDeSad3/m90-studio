"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight } from "lucide-react";

/**
 * HeroPhotos — hero estático con 4 fotos rotando (autorrotación tipo
 * carousel). Reemplaza al hero scroll-driven de Arcane (HeroFrames).
 *
 * Layout: el texto outline "M90 / STUDIO" está SIEMPRE encima. Las 4
 * fotos están en posiciones fijas (1 centro grande + 3 satélites) y
 * cada N segundos rotan slot — la foto del centro pasa a un satélite,
 * un satélite pasa al centro, etc.
 *
 * Animación de entrada: cada foto vuela desde fuera del viewport con
 * rotación inicial fuerte (-30° a +30°) y aterriza en su slot con un
 * spring suave, escalonadas.
 */

const PHOTOS = [
  { src: "/hero-photos/p1.svg", alt: "" },
  { src: "/hero-photos/p2.svg", alt: "" },
  { src: "/hero-photos/p3.svg", alt: "" },
  { src: "/hero-photos/p4.svg", alt: "" },
];

/** Posiciones FIJAS en pantalla donde aterrizan las fotos. Las fotos
    rotan ENTRE estas posiciones cada `ROTATE_INTERVAL_MS`. */
const SLOTS: Array<{
  /** Posición relativa al centro del viewport, en porcentaje. */
  x: string;
  y: string;
  rotate: number;
  scale: number;
  /** z-index relativo: 2 = front (centro grande), 1 = mid, 0 = back. */
  z: number;
}> = [
  { x: "0%", y: "0%", rotate: -4, scale: 1.0, z: 2 },        // center big (front)
  { x: "-42%", y: "-12%", rotate: -14, scale: 0.55, z: 1 },  // far left
  { x: "42%", y: "-8%", rotate: 12, scale: 0.6, z: 1 },      // far right
  { x: "32%", y: "32%", rotate: 18, scale: 0.45, z: 0 },     // bottom right (small)
];

const ROTATE_INTERVAL_MS = 3500;

export function HeroPhotos() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Entrada: marca mounted=true después de un tick para que el motion
  // pase de su estado inicial al final.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Auto-rotación: incrementa offset cada N segundos. Solo arranca
  // después de que las fotos hayan aterrizado (mounted = true).
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setOffset((o) => (o + 1) % PHOTOS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [mounted]);

  function handleCtaClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    router.push("/disenar");
  }

  return (
    <section className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[color:var(--color-paper)]">
      {/* Capa de fotos — debajo del texto */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="relative h-full w-full">
          {PHOTOS.map((photo, photoIdx) => {
            // Cuál slot ocupa ESTA foto en este momento. Las fotos rotan
            // entre slots: foto[0] ocupa SLOTS[(0 + offset) % N], etc.
            const slotIdx = (photoIdx + offset) % SLOTS.length;
            const slot = SLOTS[slotIdx];

            return (
              <motion.div
                key={photoIdx}
                initial={{
                  // Estado de entrada: viene desde abajo con rotación fuerte
                  x: "0%",
                  y: "120%",
                  rotate: photoIdx % 2 === 0 ? -45 : 45,
                  scale: 0.4,
                  opacity: 0,
                }}
                animate={
                  mounted
                    ? {
                        x: slot.x,
                        y: slot.y,
                        rotate: slot.rotate,
                        scale: slot.scale,
                        opacity: 1,
                      }
                    : undefined
                }
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 16,
                  delay: mounted ? photoIdx * 0.18 : 0,
                  // Para las rotaciones subsiguientes (post-mount) la
                  // transición es más suave y rápida.
                  ...(mounted && offset > 0
                    ? { type: "spring", stiffness: 90, damping: 18, delay: 0 }
                    : {}),
                }}
                style={{
                  zIndex: slot.z,
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: "-22vmin",
                  marginTop: "-30vmin",
                  width: "44vmin",
                  height: "60vmin",
                  willChange: "transform",
                }}
              >
                <div
                  className="relative h-full w-full overflow-hidden rounded-[6%] shadow-[0_30px_80px_-20px_rgba(1,27,83,0.35),0_15px_30px_-10px_rgba(1,27,83,0.18)] ring-1 ring-[color:var(--color-navy)]/8"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Texto outline "M90 / STUDIO" encima de las fotos */}
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-4 md:px-8">
          <div className="text-center leading-[0.85]">
            <h1
              className="font-display italic text-transparent"
              style={{
                fontSize: "clamp(80px, 22vw, 320px)",
                WebkitTextStroke: "2px var(--color-navy)",
                lineHeight: 0.85,
              }}
              aria-label="M90 Studio"
            >
              <span className="block">M90</span>
              <span className="block">STUDIO</span>
            </h1>
          </div>
        </div>

        {/* CTA inferior */}
        <div className="relative z-20 mb-10 flex flex-col items-center gap-4 px-4 md:mb-16">
          <Link
            href="/disenar"
            onClick={handleCtaClick}
            className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--color-navy)] px-7 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-cream-soft)] shadow-[0_18px_40px_-15px_rgba(1,27,83,0.45)] transition-transform hover:-translate-y-1 active:scale-[0.98] md:text-[12px]"
          >
            Diseñá tu funda
            <ArrowDownRight className="h-4 w-4 transition-transform group-hover:rotate-12" />
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-navy)]/55 md:text-[11px]">
            · Tu foto · Tu funda · La Habana
          </p>
        </div>
      </div>
    </section>
  );
}
