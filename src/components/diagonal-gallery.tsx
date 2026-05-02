"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * DiagonalGallery — 4 filas con parallax invertido + grid rotado -12deg.
 * Inspired by Klaudiya. Adaptado al palette M90 (navy + cream-warm).
 * Las fotos son placeholder de móviles/manos hasta que tengamos fotos
 * reales de clientes con sus fundas.
 */

const PHOTOS = [
  "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=560&h=685&q=80",
  "https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&w=560&h=685&q=80",
  "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=560&h=685&q=80",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=560&h=685&q=80",
  "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=560&h=685&q=80",
  "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=560&h=685&q=80",
  "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=560&h=685&q=80",
  "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=560&h=685&q=80",
];

const IMAGES = Array.from({ length: 16 }, (_, i) => PHOTOS[i % PHOTOS.length]);

export function DiagonalGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const row1X = useTransform(scrollYProgress, [0, 1], ["-10%", "-45%"]);
  const row2X = useTransform(scrollYProgress, [0, 1], ["-45%", "-10%"]);
  const row3X = useTransform(scrollYProgress, [0, 1], ["-15%", "-50%"]);
  const row4X = useTransform(scrollYProgress, [0, 1], ["-50%", "-15%"]);

  const rows = [
    { images: IMAGES.slice(0, 4), x: row1X },
    { images: IMAGES.slice(4, 8), x: row2X },
    { images: IMAGES.slice(8, 12), x: row3X },
    { images: IMAGES.slice(12, 16), x: row4X },
  ];

  return (
    <section
      id="galeria"
      ref={ref}
      className="relative isolate overflow-hidden bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]"
      style={{ height: "min(120vh, 1100px)" }}
    >
      {/* Top strip — mobile compact, desktop spread */}
      <div className="relative z-20 flex items-center justify-between gap-3 border-y border-[color:var(--color-cream-soft)]/15 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.25em] sm:px-10 sm:text-[10px] sm:tracking-[0.3em]">
        <span className="text-[color:var(--color-cream-warm)]">· Galería</span>
        <span className="hidden md:inline">Fundas en uso · clientes M90</span>
        <a
          href="/disenar"
          className="text-[color:var(--color-cream-soft)] transition-colors hover:text-[color:var(--color-cream-warm)]"
        >
          Crea la tuya →
        </a>
      </div>

      {/* Rotated diagonal grid — tiles bigger en mobile */}
      <div
        className="absolute inset-0 flex flex-col justify-center gap-3 md:gap-6"
        style={{
          transform: "rotate(-10deg) scale(1.3)",
          transformOrigin: "center center",
        }}
      >
        {rows.map((row, i) => (
          <motion.div
            key={i}
            style={{ x: row.x, width: "260%" }}
            className="flex flex-shrink-0 items-center gap-3 md:gap-5"
          >
            {[...row.images, ...row.images, ...row.images].map((src, j) => (
              <a
                key={j}
                href="/disenar"
                className="group relative block h-[22vh] w-[42vw] flex-shrink-0 overflow-hidden border border-[color:var(--color-cream-soft)]/10 bg-[color:var(--color-navy-900)] md:h-[26vh] md:w-[20vw]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  className="size-full select-none object-cover grayscale contrast-[1.15] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-[color:var(--color-cream-warm)]/0 mix-blend-multiply transition-colors duration-500 group-hover:bg-[color:var(--color-cream-warm)]/30" />
              </a>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Centered headline with mix-blend-difference */}
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6">
        <div
          className="text-center mix-blend-difference"
          style={{ color: "var(--color-cream-soft)" }}
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-cream-warm)] sm:text-[10px] sm:tracking-[0.4em]">
            · Archivo fotográfico
          </div>
          <h2
            className="mt-2 font-display uppercase"
            style={{
              fontSize: "clamp(4.5rem, 16vw, 10rem)",
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
            }}
          >
            Galería
          </h2>
          <div
            className="mt-2 font-display"
            style={{
              fontSize: "clamp(1.1rem, 3.6vw, 2.2rem)",
              color: "var(--color-cream-warm)",
            }}
          >
            tus fotos, tu funda
          </div>
        </div>
      </div>

      {/* Floating pill */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center px-4 md:bottom-8">
        <a
          href="/disenar"
          className="pointer-events-auto rounded-full border border-[color:var(--color-cream-soft)]/20 bg-[color:var(--color-navy-900)]/70 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-cream-soft)]/85 backdrop-blur transition-colors hover:border-[color:var(--color-cream-warm)] hover:text-[color:var(--color-cream-warm)] sm:text-[10px] sm:tracking-[0.3em]"
        >
          Crea la tuya · Diseñar →
        </a>
      </div>
    </section>
  );
}
