"use client";

import {
  motion,
  useScroll,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight } from "lucide-react";
import { scrollHeroThenRun } from "@/lib/scroll-hero";

/**
 * HeroFrames — scroll-driven canvas frame swap.
 *
 * 96 fotogramas WebP precargados en memoria. La sección dura 200vh: dentro
 * hay un sticky h-screen que mantiene el canvas pegado, y al scrollear
 * mapeamos scrollYProgress (0→1) al índice del frame (0→95).
 *
 * Overlay encima del canvas: outline "M90 / STUDIO" navy + CTA inferior.
 * Mientras los frames cargan se muestra el primer frame como fallback
 * para que no haya flash blanco.
 */

const FRAME_COUNT = 96;
const FRAME_PATH = (i: number) =>
  `/hero-frames/${String(i).padStart(3, "0")}.webp`;

export function HeroFrames() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnRef = useRef(-1);
  const dprRef = useRef(1);
  const [loadedCount, setLoadedCount] = useState(0);
  const [firstFrameReady, setFirstFrameReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // CTA siempre visible. El outline text fade-out cuando el usuario llega al final.
  const outlineOpacity = useTransform(scrollYProgress, [0, 0.15, 0.7, 0.95], [1, 1, 1, 0.25]);

  const router = useRouter();

  /**
   * Click handler: scrollea por todo el hero (animacion completa de los frames)
   * y al terminar navega a /disenar. Logica compartida en scrollHeroThenRun.
   */
  function handleCtaClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    scrollHeroThenRun(() => router.push("/disenar"));
  }

  // Precarga TODOS los frames. Los primeros se cargan con prioridad alta
  // (fetchpriority high) para que el frame inicial se vea YA al montar.
  useEffect(() => {
    const frames: HTMLImageElement[] = new Array(FRAME_COUNT);
    let mounted = true;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      // Prioridad alta a los primeros 8 frames; el resto en background.
      if (i < 8) img.fetchPriority = "high";
      img.decoding = "async";
      img.src = FRAME_PATH(i + 1);
      const idx = i;
      img.onload = () => {
        if (!mounted) return;
        setLoadedCount((c) => c + 1);
        if (idx === 0) {
          setFirstFrameReady(true);
          // Pinta el primer frame nada más cargar
          drawFrame(0);
        }
      };
      frames[i] = img;
    }

    framesRef.current = frames;

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Canvas resize on viewport change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      dprRef.current = dpr;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Repinta el último frame conocido
      if (lastDrawnRef.current >= 0) drawFrame(lastDrawnRef.current);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function drawFrame(idx: number) {
    const canvas = canvasRef.current;
    const img = framesRef.current[idx];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = dprRef.current || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // object-cover behaviour: fill the canvas, crop overflow
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
    lastDrawnRef.current = idx;
  }

  // Subscribe to scroll progress
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const target = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.round(v * (FRAME_COUNT - 1))),
    );
    if (target === lastDrawnRef.current) return;

    // Si el frame target está cargado, lo dibuja. Si no, busca el más
    // cercano cargado (fallback) para evitar frames vacíos.
    const frames = framesRef.current;
    if (frames[target]?.complete && frames[target].naturalWidth > 0) {
      drawFrame(target);
      return;
    }
    // Fallback: el más cercano cargado
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < FRAME_COUNT; i++) {
      if (frames[i]?.complete && frames[i].naturalWidth > 0) {
        const d = Math.abs(i - target);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
    }
    if (best >= 0) drawFrame(best);
  });

  const loadProgress = Math.round((loadedCount / FRAME_COUNT) * 100);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative h-[400vh] bg-[color:var(--color-paper)]"
    >
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[color:var(--color-paper)]">
        {/* Canvas frames */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-0 h-full w-full"
          aria-hidden
        />

        {/* Loading shimmer fallback (solo hasta que cargue el primer frame) */}
        {!firstFrameReady && (
          <div className="absolute inset-0 z-0 grid place-items-center bg-[color:var(--color-paper)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy)]/40">
              Cargando experiencia · {loadProgress}%
            </span>
          </div>
        )}

        {/* OUTLINE TEXT — M90 / STUDIO encima del canvas, fade-out al final */}
        <motion.div style={{ opacity: outlineOpacity }} className="absolute inset-0 z-20">
          <TypographyStack />
        </motion.div>

        {/* CTA siempre visible. Click scrollea todo el hero y luego navega. */}
        <motion.a
          href="/disenar"
          onClick={handleCtaClick}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="group absolute inset-x-0 bottom-10 z-30 mx-auto inline-flex w-fit items-center gap-3 font-display text-[clamp(32px,5vw,68px)] italic leading-none text-[color:var(--color-navy)] transition-all hover:tracking-[0.01em] md:bottom-20"
        >
          Crea tu cover
          <ArrowDownRight className="h-8 w-8 transition-transform group-hover:translate-x-1 group-hover:translate-y-1 md:h-12 md:w-12" />
        </motion.a>
      </div>
    </section>
  );
}

/* ============================================================
   TypographyStack — outline "M90 / STUDIO" idéntico al hero original
   ============================================================ */
function TypographyStack() {
  const outlineStyle: React.CSSProperties = {
    fontSize: "clamp(96px, 22vw, 320px)",
    WebkitTextStroke: "2.5px var(--color-cream-soft)",
    WebkitTextFillColor: "transparent",
    filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.25))",
  };
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center pt-16 pb-20 md:pt-20 md:pb-32"
    >
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="font-display text-center italic leading-[0.82] tracking-[-0.02em]"
        style={outlineStyle}
      >
        M90
      </motion.h1>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="font-display text-center italic leading-[0.82] tracking-[-0.02em]"
        style={outlineStyle}
      >
        STUDIO
      </motion.h1>
    </div>
  );
}
