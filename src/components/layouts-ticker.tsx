"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * LayoutsTicker simplificado: solo "Hacemos + palabra ciclica".
 *
 * Antes tenia 6 Unsplash fotos flotantes + sticky 400vh. Sacado por peso
 * (1.5MB+) y porque el cliente lo pidio. Ahora es una seccion compacta con
 * auto-rotacion de palabras cuando esta en viewport.
 */

const WORDS = [
  "Single",
  "Grid 4",
  "Grid 9",
  "Asimétrico",
  "Polaroid",
  "Magazine",
  "Mosaico",
  "Tira",
];

const ROTATION_MS = 500;
const N = WORDS.length;

export function LayoutsTicker() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.25, once: false });
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % N);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[color:var(--color-navy-900)] py-24 text-[color:var(--color-cream-soft)] md:py-36"
    >
      {/* Fondo sutil — dot pattern + glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(247,235,200,0.7) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        aria-hidden
        className="absolute -left-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[color:var(--color-cream-warm)]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-32 top-1/3 h-[360px] w-[360px] rounded-full bg-[color:var(--color-navy-500)]/25 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="flex flex-col items-center justify-center gap-8 text-center md:gap-12">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-cream-warm)] md:text-[11px]">
            · {String(activeIdx + 1).padStart(2, "0")} /{" "}
            {String(N).padStart(2, "0")} · Lo que hacemos
          </span>

          {/* Phrase row — Hacemos + word column centered */}
          <div
            className="flex items-center justify-center gap-2.5 sm:gap-4 md:gap-8"
            style={{
              fontSize: "clamp(30px, 9.5vw, 140px)",
              lineHeight: 1,
            }}
          >
            <motion.span
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-display tracking-tight text-[color:var(--color-cream-soft)]/55"
            >
              Hacemos
            </motion.span>

            {/* Una sola palabra activa que se reemplaza con AnimatePresence.
                Evita la stack absoluta de motion.spans (frágil en mobile cuando
                las inline-styles no se aplicaban bien). */}
            <div
              className="relative flex items-center justify-center overflow-hidden"
              style={{
                height: "1.2em",
                width: "5.8em",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={WORDS[activeIdx]}
                  initial={{ opacity: 0, y: "60%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "-60%" }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center justify-center whitespace-nowrap font-display tracking-tight text-[color:var(--color-cream-warm)]"
                >
                  {WORDS[activeIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Indicator dots */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {WORDS.map((word, i) => (
              <button
                key={word}
                onClick={() => setActiveIdx(i)}
                aria-label={`Layout ${word}`}
                className="group/dot flex items-center gap-1.5"
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === activeIdx
                      ? "w-8 bg-[color:var(--color-cream-warm)]"
                      : "w-1.5 bg-[color:var(--color-cream-soft)]/25 group-hover/dot:bg-[color:var(--color-cream-soft)]/50"
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="mt-2 max-w-[42ch] font-mono text-[11px] uppercase leading-relaxed tracking-[0.22em] text-[color:var(--color-cream-soft)]/55 md:text-[13px]">
            · Cualquier layout · cualquier modelo · mismo precio · $15 USD
          </p>
        </div>
      </div>
    </section>
  );
}
