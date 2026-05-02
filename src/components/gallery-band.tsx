"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GalleryBand — placeholder de galería de fundas reales en uso.
 * Se va a reemplazar con fotos reales cuando lleguen.
 * Mientras tanto, genera 6 mockups de fundas con tints variados.
 */

const GALLERY = [
  { tint: "navy", pattern: "single", caption: "Maritza · La Habana", model: "iPhone 15" },
  { tint: "cream", pattern: "grid-4", caption: "Yoel · Santiago", model: "Samsung S24" },
  { tint: "ink", pattern: "grid-9", caption: "Camila · Holguín", model: "iPhone 14 Pro" },
  { tint: "cream-warm", pattern: "stripes", caption: "Daniel · Cienfuegos", model: "Pixel 8" },
  { tint: "navy", pattern: "grid-4", caption: "Lina · La Habana", model: "iPhone 16" },
  { tint: "cream", pattern: "single", caption: "Reinaldo · Camagüey", model: "Samsung S23" },
] as const;

export function GalleryBand() {
  return (
    <section
      id="galeria"
      className="relative overflow-hidden bg-[color:var(--color-paper)] py-24 md:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(1, 27, 83, 0.1) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy-500)]">
            <span className="h-px w-8 bg-[color:var(--color-navy-500)]" />
            Galería
            <span className="h-px w-8 bg-[color:var(--color-navy-500)]" />
          </span>
          <h2 className="mt-4 font-display text-[clamp(40px,7vw,96px)] italic leading-[0.95] text-[color:var(--color-navy)]">
            Llevando su <span className="italic">M90</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((item, i) => (
            <motion.div
              key={i}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-3xl border border-[color:var(--color-navy)]/10 bg-white/80 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-[color:var(--color-navy)]/25 hover:shadow-[0_30px_60px_-30px_rgba(1,27,83,0.4)]"
            >
              <div className="flex aspect-[4/5] items-center justify-center">
                <CaseMini tint={item.tint} pattern={item.pattern} />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="font-display text-[18px] italic leading-tight text-[color:var(--color-navy)]">
                    {item.caption}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/50">
                    {item.model}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[color:var(--color-navy)]/40 transition-all group-hover:rotate-12 group-hover:text-[color:var(--color-navy)]" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

type Tint = (typeof GALLERY)[number]["tint"];
type Pattern = (typeof GALLERY)[number]["pattern"];

function CaseMini({ tint, pattern }: { tint: Tint; pattern: Pattern }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border-[3px] shadow-[0_24px_50px_-22px_rgba(1,27,83,0.4)]",
        tint === "navy" &&
          "border-[color:var(--color-navy)] bg-[color:var(--color-navy)]",
        tint === "cream" &&
          "border-[color:var(--color-navy)] bg-[color:var(--color-cream-soft)]",
        tint === "ink" &&
          "border-[color:var(--color-ink)] bg-[color:var(--color-ink)]",
        tint === "cream-warm" &&
          "border-[color:var(--color-navy)] bg-[color:var(--color-cream-warm)]",
      )}
      style={{ width: 140, height: 280 }}
    >
      <div className="absolute left-3 top-3 z-10 h-6 w-12 rounded-xl bg-black/35" />
      <div className="absolute inset-2.5 overflow-hidden rounded-[20px]">
        {pattern === "single" && (
          <div className="h-full w-full bg-gradient-to-br from-[color:var(--color-cream-soft)] via-[color:var(--color-cream)] to-[color:var(--color-cream-warm)]" />
        )}
        {pattern === "grid-4" && (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[2px] bg-[color:var(--color-navy)]">
            {[
              "from-[color:var(--color-cream)] to-[color:var(--color-cream-warm)]",
              "from-[color:var(--color-cream-soft)] to-[color:var(--color-navy-500)]/30",
              "from-[color:var(--color-cream-warm)] to-[color:var(--color-cream)]",
              "from-[color:var(--color-navy-500)]/30 to-[color:var(--color-cream-soft)]",
            ].map((cls, idx) => (
              <div key={idx} className={cn("bg-gradient-to-br", cls)} />
            ))}
          </div>
        )}
        {pattern === "grid-9" && (
          <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-[1.5px] bg-[color:var(--color-cream)]">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "bg-gradient-to-br",
                  idx % 3 === 0 && "from-[color:var(--color-navy)] to-[color:var(--color-navy-500)]",
                  idx % 3 === 1 && "from-[color:var(--color-cream-soft)] to-[color:var(--color-cream-warm)]",
                  idx % 3 === 2 && "from-[color:var(--color-navy-700)] to-[color:var(--color-navy)]",
                )}
              />
            ))}
          </div>
        )}
        {pattern === "stripes" && (
          <div className="flex h-full flex-col gap-1 p-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-full w-full rounded-full",
                  idx % 2 === 0
                    ? "bg-[color:var(--color-navy)]"
                    : "bg-[color:var(--color-cream-soft)]",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
