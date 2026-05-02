"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import { useRef, useState } from "react";

/**
 * HacemosSticky — sección sticky con palabras gigantes que se ciclan.
 * Inspired by make-b.studio. Cada palabra ocupa una "fase" del scroll,
 * con outline text gigante que aparece blur + slide y se va al siguiente.
 */

const VERBS = [
  {
    word: "DISEÑAS",
    sub: "tu funda en minutos · directo desde el móvil",
  },
  {
    word: "IMPRIMIMOS",
    sub: "en 24-48h · calidad foto · todo el borde cubierto",
  },
  {
    word: "ENTREGAMOS",
    sub: "a tu puerta en La Habana · resto de Cuba 3-5 días",
  },
  {
    word: "VIVE",
    sub: "tu funda — TPU resistente que dura años sin desgastarse",
  },
];

export function HacemosSticky() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const [activeIndex, setActiveIndex] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(VERBS.length - 1, Math.max(0, Math.floor(v * VERBS.length)));
    setActiveIndex(idx);
  });

  return (
    <section
      ref={ref}
      className="relative h-[280vh] bg-[color:var(--color-paper)] md:h-[400vh]"
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        {/* Background dots */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(1, 27, 83, 0.12) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Upper tag */}
        <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-navy-500)] md:top-16 md:tracking-[0.3em]">
          · Qué hacemos
        </div>

        {/* Counter */}
        <div className="absolute right-4 top-8 z-20 font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-navy)]/40 md:right-10 md:top-1/2 md:-translate-y-1/2 md:tracking-[0.3em]">
          <span className="text-[color:var(--color-navy-500)]">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span> / {String(VERBS.length).padStart(2, "0")}</span>
        </div>

        {/* Vertical progress bar — desktop only */}
        <div className="absolute left-10 top-1/2 z-20 hidden h-[200px] w-px -translate-y-1/2 bg-[color:var(--color-navy)]/15 md:block">
          <motion.div
            className="absolute left-0 top-0 w-full origin-top bg-[color:var(--color-navy-500)]"
            style={{ scaleY: scrollYProgress, height: "100%" }}
          />
        </div>

        {/* Horizontal progress bar — mobile only */}
        <div className="absolute left-4 right-4 top-16 z-20 h-px bg-[color:var(--color-navy)]/15 md:hidden">
          <motion.div
            className="absolute left-0 top-0 h-full w-full origin-left bg-[color:var(--color-navy-500)]"
            style={{ scaleX: scrollYProgress }}
          />
        </div>

        {/* Cycling words */}
        <div className="relative flex h-[60vh] w-full items-center justify-center px-4">
          {VERBS.map((item, i) => (
            <CycleWord
              key={i}
              word={item.word}
              sub={item.sub}
              index={i}
              total={VERBS.length}
              progress={scrollYProgress}
            />
          ))}
        </div>

        {/* Static bottom */}
        <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-between px-4 font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/50 md:bottom-16 md:px-10 md:text-[10px] md:tracking-[0.3em]">
          <span>M90 Studio · Cuba</span>
          <span className="hidden md:inline">Scroll para ciclar</span>
          <span>2026</span>
        </div>
      </div>
    </section>
  );
}

function CycleWord({
  word,
  sub,
  index,
  total,
  progress,
}: {
  word: string;
  sub: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // Cross-fade: each word's fade extends past its segment so transitions
  // overlap and there's never an empty frame.
  const segment = 1 / total;
  const start = index * segment;
  const end = start + segment;
  const fadeInStart = Math.max(0, start - segment * 0.15);
  const fullyIn = start + segment * 0.05;
  const fullyOut = end - segment * 0.05;
  const fadeOutEnd = Math.min(1, end + segment * 0.15);

  const opacity = useTransform(
    progress,
    [fadeInStart, fullyIn, fullyOut, fadeOutEnd],
    [0, 1, 1, 0],
  );
  const y = useTransform(
    progress,
    [fadeInStart, fullyIn, fullyOut, fadeOutEnd],
    ["28%", "0%", "0%", "-28%"],
  );
  const filter = useTransform(
    progress,
    [fadeInStart, fullyIn, fullyOut, fadeOutEnd],
    ["blur(14px)", "blur(0px)", "blur(0px)", "blur(14px)"],
  );

  return (
    <motion.div
      style={{ opacity, y, filter }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      <h2
        className="font-display text-center text-[color:var(--color-navy)]"
        style={{
          fontSize: "clamp(60px, 15vw, 240px)",
          lineHeight: 0.85,
          letterSpacing: "-0.03em",
          WebkitTextStroke: "2px var(--color-navy)",
          WebkitTextFillColor: "transparent",
        }}
      >
        {word}
      </h2>
      <p className="mt-6 max-w-[42ch] px-6 text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[color:var(--color-navy)]/70 md:text-[13px]">
        {sub}
      </p>
    </motion.div>
  );
}
