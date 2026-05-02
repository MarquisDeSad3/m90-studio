"use client";

import { motion, useInView } from "framer-motion";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { useRef } from "react";
import { GooeyText } from "@/components/ui/gooey-text-morphing";

const MORPH_TEXTS = [
  "$15 USD",
  "Por tu cover",
  "Personalizado",
];

export function PricingGooey() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });

  return (
    <section
      id="precio"
      ref={sectionRef}
      className="relative overflow-hidden bg-[color:var(--color-navy-900)] py-28 md:py-40"
    >
      {/* Background — dot pattern + glow orbs */}
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
        className="absolute -left-32 top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-[color:var(--color-cream-warm)]/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-[color:var(--color-navy-500)]/30 blur-3xl"
      />

      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center px-5 md:px-10">
        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-cream-warm)]/25 bg-[color:var(--color-cream-warm)]/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-cream-warm)] backdrop-blur md:text-[11px]"
        >
          · Precio único
        </motion.span>

        {/* Gooey morphing text — center stage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="flex h-[140px] w-full items-center justify-center sm:h-[180px] md:h-[260px]"
        >
          <GooeyText
            texts={MORPH_TEXTS}
            morphTime={1.1}
            cooldownTime={1.6}
            textClassName="text-[color:var(--color-cream-soft)] font-sans font-black tracking-[-0.04em] whitespace-nowrap !text-[44px] sm:!text-[72px] md:!text-[120px] lg:!text-[140px] leading-none"
          />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-col gap-3 sm:flex-row sm:gap-4"
        >
          <a
            href="/disenar"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-cream-soft)] px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)] shadow-[0_18px_40px_-14px_rgba(247,235,200,0.45)] transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_22px_50px_-16px_rgba(247,235,200,0.6)]"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Diseñar la mía</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#galeria"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--color-cream-soft)]/25 px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)]/85 transition-all hover:border-[color:var(--color-cream-warm)]/55 hover:text-[color:var(--color-cream-warm)]"
          >
            <span>Ver galería</span>
            <ChevronRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
