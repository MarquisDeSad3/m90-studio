"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

/**
 * Preloader real: precarga las 4 fotos del hero (HeroPhotos) en paralelo
 * y solo desaparece cuando todas están cargadas. Muestra % real para que
 * el usuario en Cuba sepa que está progresando aunque la conexión sea lenta.
 *
 * - SSR-friendly: renderiza al 0% antes de hidratar (sin flash).
 * - Cache hits: si las fotos ya están en cache, termina al instante.
 * - Bloquea scroll mientras está activo para que el usuario no scrollee
 *   sobre el hero a medio cargar.
 */

const HERO_PHOTOS = ["p1.svg", "p2.svg", "p3.svg", "p4.svg"];
const FRAME_COUNT = HERO_PHOTOS.length;
const CRITICAL_FRAMES = HERO_PHOTOS.length;
const FRAME_PATH = (i: number) => `/hero-photos/${HERO_PHOTOS[i - 1]}`;

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const lockedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let criticalLoaded = 0;

    // Bloquea scroll del body mientras el preloader está visible
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
      lockedRef.current = true;
    }

    const onCriticalLoaded = () => {
      if (!mounted) return;
      criticalLoaded += 1;
      setProgress(Math.round((criticalLoaded / CRITICAL_FRAMES) * 100));
      if (criticalLoaded >= CRITICAL_FRAMES) {
        setTimeout(() => {
          if (!mounted) return;
          setDone(true);
        }, 200);
      }
    };

    // 1. Critical frames: bloquean el preloader
    for (let i = 1; i <= CRITICAL_FRAMES; i++) {
      const img = new Image();
      img.fetchPriority = "high";
      img.decoding = "async";
      img.onload = onCriticalLoaded;
      img.onerror = onCriticalLoaded;
      img.src = FRAME_PATH(i);
    }

    // 2. Resto de frames: cargan en background, no bloquean
    // Pequeño retraso para que los criticos arranquen primero
    const bgTimer = setTimeout(() => {
      for (let i = CRITICAL_FRAMES + 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.fetchPriority = "low";
        img.decoding = "async";
        img.src = FRAME_PATH(i);
      }
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(bgTimer);
      if (lockedRef.current) {
        document.body.style.overflow = "";
        lockedRef.current = false;
      }
    };
  }, []);

  // Restaurar scroll cuando termina
  useEffect(() => {
    if (done && lockedRef.current) {
      document.body.style.overflow = "";
      lockedRef.current = false;
    }
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[color:var(--color-navy-900)]"
          aria-busy="true"
          aria-live="polite"
        >
          {/* Dot pattern de fondo (mismo lenguaje visual que el footer) */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(247,235,200,0.7) 1px, transparent 0)",
              backgroundSize: "26px 26px",
            }}
          />
          {/* Glow orb */}
          <div
            aria-hidden
            className="absolute -left-32 top-1/3 h-[460px] w-[460px] rounded-full bg-[color:var(--color-cream-warm)]/12 blur-3xl"
          />

          {/* Contenido centrado */}
          <div className="relative z-10 flex w-full max-w-[640px] flex-col items-center px-6">
            {/* Logo brand — escala con text-[XXpx] */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Logo
                variant="cream"
                className="text-[clamp(56px,12vw,140px)]"
              />
            </motion.div>

            {/* Percentage — mono, tabular-nums */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-10 font-mono text-[clamp(48px,9vw,96px)] tabular-nums leading-none tracking-tight text-[color:var(--color-cream-warm)]"
            >
              {String(progress).padStart(3, "0")}
              <span className="ml-1 text-[0.45em] text-[color:var(--color-cream-soft)]/55">
                %
              </span>
            </motion.div>

            {/* Progress bar — fina y minimal */}
            <div className="relative mt-8 h-[2px] w-full max-w-[360px] overflow-hidden bg-[color:var(--color-cream-soft)]/12">
              <motion.div
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: 0.25, ease: "linear" }}
                style={{ transformOrigin: "0% 50%" }}
                className="h-full bg-[color:var(--color-cream-warm)]"
              />
            </div>

            {/* Sub-info — mono uppercase, mismo idioma que el resto del site */}
            <div className="mt-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-cream-soft)]/55 md:text-[11px]">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-cream-warm)]" />
              <span>Cargando experiencia</span>
              <span aria-hidden className="opacity-40">
                ·
              </span>
              <span>La Habana</span>
            </div>

            {/* Counter de frames cargados */}
            <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-cream-soft)]/35 md:text-[10px]">
              {Math.round((progress / 100) * CRITICAL_FRAMES)} /{" "}
              {CRITICAL_FRAMES} frames
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
