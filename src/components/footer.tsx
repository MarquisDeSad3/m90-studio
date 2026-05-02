"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { ShaderBackground } from "./ui/shader-background";
import { whatsappUrl } from "@/lib/utils";

/**
 * Footer estilo make-b.studio:
 *  - Top: redes sociales izq · email der
 *  - Mid: logo izq · nav vertical centrado
 *  - "M90 STUDIO" GIGANTE como texto a fit-width abajo
 *  - Bottom: copyright izq · ubicación + hora der
 */

const SOCIAL = [
  { label: "WhatsApp", href: whatsappUrl("Hola, quiero información sobre las fundas") },
  { label: "Instagram", href: "https://instagram.com/m90studio" },
  { label: "TikTok", href: "https://tiktok.com/@m90studio" },
  { label: "Telegram", href: "https://t.me/m90studio" },
];

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#galeria", label: "Galería" },
  { href: "#precio", label: "Precio" },
  { href: "/disenar", label: "Crea tu cover" },
];

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  // El "M90 STUDIO" gigante hace un slight reveal cuando se entra al footer
  const giantOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 1]);
  const giantY = useTransform(scrollYProgress, [0, 1], [40, 0]);

  // Hora local Cuba — actualizar cada minuto
  const [time, setTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const havanaTime = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Havana",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(now);
      setTime(havanaTime);
    };
    updateTime();
    const id = setInterval(updateTime, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer
      ref={ref}
      className="relative overflow-hidden bg-[color:var(--color-navy-900)] text-[color:var(--color-cream-soft)]"
    >
      {/* WebGL shader background — plasma navy + cream */}
      <ShaderBackground className="opacity-70" />
      {/* Tinte oscuro encima del shader para mantener legibilidad del texto */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[color:var(--color-navy-900)]/55"
      />

      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-16 px-5 pt-16 md:gap-20 md:px-10 md:pt-24">
        {/* TOP ROW — social izq · email der */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-[color:var(--color-cream-soft)]/10 pb-10 md:flex-row md:items-center md:gap-4">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 md:gap-x-8">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-cream-soft)]/85 transition-colors hover:text-[color:var(--color-cream-warm)] md:text-[13px]"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={whatsappUrl("Hola, quiero información sobre las fundas")}
            className="font-mono text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-cream-soft)]/85 transition-colors hover:text-[color:var(--color-cream-warm)] md:text-[13px]"
          >
            +53 6328 5022 · WhatsApp
          </a>
        </div>

        {/* MID — Logo izq · Nav vertical centro */}
        <div className="grid gap-12 md:grid-cols-[1fr_1fr_1fr] md:gap-8">
          {/* Logo + tagline */}
          <div className="flex flex-col gap-4">
            <Logo variant="cream" className="text-[44px] md:text-[52px]" />
            <p className="max-w-[320px] text-[13px] leading-relaxed text-[color:var(--color-cream-soft)]/55 md:text-[14px]">
              Estudio de fundas custom para móvil, hecho en Cuba. Diseña la
              tuya con tus fotos en minutos.
            </p>
          </div>

          {/* Nav vertical centro */}
          <nav className="flex flex-col items-start gap-3 md:items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-cream-warm)] md:text-[11px]">
              · Navegación
            </span>
            <ul className="flex flex-col gap-2.5 md:items-center">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-sans text-[18px] font-medium leading-tight tracking-tight text-[color:var(--color-cream-soft)]/85 transition-colors hover:text-[color:var(--color-cream-warm)] md:text-[20px]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Direct CTA */}
          <div className="flex flex-col items-start gap-3 md:items-end">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-cream-warm)] md:text-[11px]">
              · Contacto directo
            </span>
            <a
              href={whatsappUrl("Hola, quiero hacer un pedido")}
              className="font-sans text-[18px] font-medium leading-tight tracking-tight text-[color:var(--color-cream-soft)]/85 transition-colors hover:text-[color:var(--color-cream-warm)] md:text-right md:text-[20px]"
            >
              Pedir por WhatsApp
            </a>
            <a
              href="/disenar"
              className="font-sans text-[18px] font-medium leading-tight tracking-tight text-[color:var(--color-cream-soft)]/85 transition-colors hover:text-[color:var(--color-cream-warm)] md:text-right md:text-[20px]"
            >
              Diseñar mi cover
            </a>
            <a
              href="/mis-pedidos"
              className="font-sans text-[18px] font-medium leading-tight tracking-tight text-[color:var(--color-cream-soft)]/85 transition-colors hover:text-[color:var(--color-cream-warm)] md:text-right md:text-[20px]"
            >
              Mis pedidos
            </a>
          </div>
        </div>
      </div>

      {/* GIGANTIC brand lockup — Logo escalado a fit-width */}
      <motion.div
        style={{ opacity: giantOpacity, y: giantY }}
        className="relative z-10 mt-12 flex w-full items-center justify-center overflow-hidden px-4 pb-4 md:mt-16 md:px-8"
      >
        <Logo
          variant="cream"
          className="text-[clamp(56px,15vw,220px)]"
        />
      </motion.div>

      {/* BOTTOM — copyright izq · ubicación + hora der */}
      <div className="relative z-10 border-t border-[color:var(--color-cream-soft)]/10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-3 px-5 py-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)]/45 md:flex-row md:items-center md:gap-4 md:px-10 md:py-8 md:text-[11px] md:tracking-[0.3em]">
          <span>M90 Studio © {new Date().getFullYear()} · Hecho en Cuba</span>
          <span className="inline-flex items-center gap-3">
            <span>La Habana</span>
            <span aria-hidden className="h-3 w-px bg-[color:var(--color-cream-soft)]/30" />
            <span className="tabular-nums text-[color:var(--color-cream-warm)]">
              {time || "— —"}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            By
            <a
              href="https://sadestudio.design"
              target="_blank"
              rel="noreferrer"
              className="text-[color:var(--color-cream-soft)]/65 transition-colors hover:text-[color:var(--color-cream-warm)]"
            >
              Sade Studio
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
