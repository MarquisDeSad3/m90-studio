"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Logo } from "./logo";

/**
 * Nav minimal: Logo izq · links texto der · CTA pill.
 * Sin estado scrolled (sin barra beige). Solo hide-on-scroll-down.
 */

const LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#galeria", label: "Galería" },
  { href: "#precio", label: "Precio" },
];

export function Nav() {
  const [hidden, setHidden] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    let prev = typeof window !== "undefined" ? window.scrollY : 0;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 400 && y > prev + 2);
      prev = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: hidden ? -120 : 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 right-0 top-0 z-50"
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="flex items-center justify-between py-4 md:py-5">
          {/* Logo izq */}
          <a href="/" className="group flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: -6, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <Logo variant="cream" className="text-[26px] md:text-[30px]" />
            </motion.div>
          </a>

          {/* Links der (desktop) */}
          <nav className="hidden items-center gap-8 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-[13px] uppercase tracking-[0.18em] text-[color:var(--color-cream-soft)]/85 transition-colors hover:text-[color:var(--color-cream-soft)]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[color:var(--color-cream-warm)] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* CTA der — siempre visible, navega al editor. */}
          <a
            href="/disenar"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[color:var(--color-cream-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-navy)] shadow-[0_12px_30px_-12px_rgba(247,235,200,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(247,235,200,0.55)] md:px-5 md:py-2.5 md:text-[12px]"
          >
            <Sparkles className="hidden h-3.5 w-3.5 sm:block" />
            <span>Comenzar</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
          </a>
        </div>
      </div>

      {/* Reading progress bar */}
      <motion.div
        style={{ scaleX: progressScale }}
        className="origin-left h-[2px] bg-[color:var(--color-cream-warm)]/40"
      />
    </motion.header>
  );
}
