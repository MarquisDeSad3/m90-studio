"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState } from "react";

/**
 * ProcessSimple — adaptado del "Our Process" de make-b.studio.
 * Bg oscuro (navy profundo), título gigante "Cómo funciona", 4 pasos en
 * 2-col (número izq pequeño + label cream-warm + descripción grande blanco).
 * Cada paso fade-in al entrar viewport.
 *
 * Hover effect: al pasar el cursor por cada paso, una imagen relevante
 * sigue al cursor (estilo make-b.studio con videos). Solo se activa en
 * desktop (hover: hover); en touch devices no se muestra.
 */

type Step = {
  n: string;
  label: string;
  body: string;
  image: string;
  imageAlt: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    label: "Modelo",
    body: "Eliges tu teléfono — iPhone, Samsung, Pixel, Xiaomi. Cargamos la plantilla exacta del modelo y vas directo al editor.",
    image:
      "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=720&h=540&q=80",
    imageAlt: "Modelo de teléfono limpio",
  },
  {
    n: "02",
    label: "Layout",
    body: "Single a pantalla completa, mosaicos de 4 o 9, asimétrico, polaroid, magazine. El layout es cómo cuentas tu historia.",
    image:
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=720&h=540&q=80",
    imageAlt: "Composición de fundas custom",
  },
  {
    n: "03",
    label: "Fotos",
    body: "Subes desde el móvil, recortas, mueves, haces zoom. Comprimimos en el navegador para que cargue rápido aunque tengas mala señal.",
    image:
      "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=720&h=540&q=80",
    imageAlt: "Foto en la pantalla del móvil",
  },
  {
    n: "04",
    label: "WhatsApp",
    body: "Confirmas el pedido por chat. Pago a la entrega o por Transfermóvil. Imprimimos en 24-48h y la llevamos a tu puerta.",
    image:
      "https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&w=720&h=540&q=80",
    imageAlt: "Mano sosteniendo teléfono — chat WhatsApp",
  },
];

export function ProcessSimple() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Motion values con spring para que la imagen siga al cursor con suavidad
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { damping: 22, stiffness: 280, mass: 0.5 });
  const springY = useSpring(cursorY, { damping: 22, stiffness: 280, mass: 0.5 });

  const handleMouseMove = (e: React.MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
  };

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative bg-[color:var(--color-navy-900)] text-[color:var(--color-cream-soft)]"
    >
      {/* Floating cursor image — desktop only */}
      <AnimatePresence>
        {hoveredIdx !== null && (
          <motion.div
            key={hoveredIdx}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              x: springX,
              y: springY,
              top: 0,
              left: 0,
              translateX: "-50%",
              translateY: "-50%",
            }}
            className="pointer-events-none fixed z-50 hidden h-[300px] w-[400px] overflow-hidden rounded-2xl border border-[color:var(--color-cream-soft)]/15 bg-[color:var(--color-navy)] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)] [@media(hover:hover)]:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STEPS[hoveredIdx].image}
              alt={STEPS[hoveredIdx].imageAlt}
              draggable={false}
              loading="lazy"
              className="h-full w-full object-cover grayscale-[0.15]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-tr from-[color:var(--color-navy-900)]/40 via-transparent to-transparent"
            />
            <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-cream-warm)]">
              {STEPS[hoveredIdx].n} · {STEPS[hoveredIdx].label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        {/* Section header */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(48px,9vw,160px)] leading-[0.92] tracking-tight text-[color:var(--color-cream-soft)]/90"
        >
          Cómo funciona
        </motion.h2>

        <div className="mt-16 md:mt-24">
          {STEPS.map((step, i) => (
            <StepRow
              key={step.n}
              step={step}
              index={i}
              isLast={i === STEPS.length - 1}
              onHover={setHoveredIdx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepRow({
  step,
  index,
  isLast,
  onHover,
}: {
  step: Step;
  index: number;
  isLast: boolean;
  onHover: (i: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.35,
    margin: "0px 0px -100px 0px",
  });

  return (
    <div
      ref={ref}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={`group/step grid cursor-default grid-cols-[auto_1fr] gap-8 py-14 transition-colors duration-300 hover:bg-[color:var(--color-cream-soft)]/[0.015] md:grid-cols-[180px_1fr] md:gap-16 md:py-20 ${
        !isLast ? "border-b border-[color:var(--color-cream-soft)]/10" : ""
      }`}
    >
      {/* Number */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="font-mono text-[12px] uppercase tracking-[0.3em] text-[color:var(--color-cream-soft)]/40 transition-colors group-hover/step:text-[color:var(--color-cream-warm)] md:pt-3 md:text-[13px]"
      >
        {step.n}
      </motion.span>

      {/* Content */}
      <div>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="block font-mono text-[12px] uppercase tracking-[0.3em] text-[color:var(--color-cream-warm)] md:text-[13px]"
        >
          {step.label}
        </motion.span>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-[24ch] font-display text-[clamp(28px,4.2vw,56px)] leading-[1.1] tracking-tight text-[color:var(--color-cream-soft)] transition-opacity group-hover/step:text-[color:var(--color-cream-soft)] md:mt-6 md:max-w-[32ch]"
          style={{ fontStyle: "normal" }}
        >
          {step.body}
        </motion.p>
      </div>
    </div>
  );
}
