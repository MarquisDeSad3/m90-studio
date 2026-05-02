"use client";

import { motion, useScroll, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { BlurInWords } from "./ui/blur-in";

/**
 * ProcessOrbit — sticky orbit storytelling.
 * Panels de texto scrollean en la columna izquierda; la órbita derecha queda
 * pinned via position: sticky. Cada panel usa intersection observer para
 * iluminar su anillo correspondiente.
 *
 * Adaptado de Klaudiya — paleta navy/cream + 4 pasos en vez de 3.
 */

type Step = {
  id: string;
  num: string;
  label: string;
  blurb: string;
  rx: number;
  ry: number;
  dur: number;
};

const STEPS: Step[] = [
  {
    id: "modelo",
    num: "01",
    label: "Modelo",
    blurb:
      "iPhone, Samsung, Pixel — buscas tu modelo y nuestro sistema carga la plantilla exacta. Cada funda es TPU semi-rígida, impresión a todo color hasta los bordes.",
    rx: 110,
    ry: 70,
    dur: 18,
  },
  {
    id: "layout",
    num: "02",
    label: "Layout",
    blurb:
      "Single, mosaicos de 4 o 9, asimétrico, polaroid, magazine. El layout no es decoración — es cómo cuentas tu historia en el espacio reducido de un teléfono.",
    rx: 165,
    ry: 105,
    dur: 24,
  },
  {
    id: "fotos",
    num: "03",
    label: "Fotos",
    blurb:
      "Subes desde el móvil, recortas, mueves, haces zoom. Comprimimos en el navegador para que cargue rápido aunque tengas mala señal en La Habana o Holguín.",
    rx: 220,
    ry: 140,
    dur: 30,
  },
  {
    id: "whatsapp",
    num: "04",
    label: "WhatsApp",
    blurb:
      "Confirmas el pedido por chat. Pagas a la entrega o por Transfermóvil. Imprimimos en 24-48h y la llevamos a tu puerta. Sin cuentas, sin esperas absurdas.",
    rx: 275,
    ry: 175,
    dur: 36,
  },
];

export function ProcessOrbit() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <section
      id="como-funciona"
      ref={ref}
      className="relative isolate bg-[color:var(--color-paper)] text-[color:var(--color-navy)]"
    >
      {/* Top strip */}
      <div className="flex items-center justify-between border-y border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] sm:px-10">
        <span>· Sección · Cómo funciona</span>
        <span className="hidden sm:inline">4 pasos · sin enredos</span>
        <span className="text-[color:var(--color-navy-500)]">PROCESO</span>
      </div>

      {/* Mobile sticky step indicator */}
      <div className="sticky top-[76px] z-40 -mx-px border-b border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)]/95 backdrop-blur lg:hidden">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STEPS.map((s, i) => {
            const isActive = active === i;
            return (
              <span
                key={s.id}
                className={`shrink-0 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] transition-all ${
                  isActive
                    ? "border-[color:var(--color-navy-500)] bg-[color:var(--color-navy-500)] text-[color:var(--color-cream-soft)]"
                    : "border-[color:var(--color-navy)]/20 text-[color:var(--color-navy)]/60"
                }`}
              >
                {s.num} · {s.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-24">
        {/* LEFT — scrolling text panels */}
        <div className="flex flex-col gap-16 lg:gap-40">
          <div className="max-w-[46ch]">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              · Sigue scrolleando
            </span>
            <h2 className="mt-5 font-display text-[44px] leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
              <BlurInWords segments={["Cuatro", "pasos."]} />
              <br />
              <BlurInWords delay={0.2} segments={["Cero", "fricción."]} />
              <br />
              <span className="inline-block">
                <BlurInWords
                  delay={0.4}
                  segments={[
                    "Tu",
                    "funda",
                    { text: "lista.", accent: true },
                  ]}
                  accentClass="text-[color:var(--color-navy-500)]"
                />
              </span>
            </h2>
            <p className="mt-6 max-w-[42ch] font-mono text-[13px] leading-relaxed text-[color:var(--color-navy)]/70 sm:text-sm">
              Diseñas desde el móvil, confirmas por WhatsApp, recibes en
              24-48h. El editor está optimizado para conexiones cubanas — no
              necesitas wifi premium.
            </p>
          </div>

          {STEPS.map((step, i) => (
            <StepPanel
              key={step.id}
              step={step}
              index={i}
              total={STEPS.length}
              onActive={() => setActive(i)}
            />
          ))}
        </div>

        {/* RIGHT — sticky orbit (desktop only) */}
        <div className="relative hidden lg:block">
          <div className="sticky top-1/2 -translate-y-1/2">
            <OrbitVisual active={active} />
          </div>
        </div>
      </div>

      {/* Progress bar bottom */}
      <div className="flex items-center gap-5 border-t border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] sm:px-10">
        <span>Progreso del flujo</span>
        <div className="relative h-px flex-1 bg-[color:var(--color-navy)]/15">
          <motion.div
            className="absolute left-0 top-0 h-full origin-left bg-[color:var(--color-navy-500)]"
            style={{ scaleX: scrollYProgress }}
          />
        </div>
        <span className="text-[color:var(--color-navy-500)]">PROCESO</span>
      </div>
    </section>
  );
}

/* ─────────────── step panel ─────────────── */

function StepPanel({
  step,
  index,
  total,
  onActive,
}: {
  step: Step;
  index: number;
  total: number;
  onActive: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef, { amount: 0.55, once: false });

  useEffect(() => {
    if (inView) onActive();
  }, [inView, onActive]);

  return (
    <div
      ref={panelRef}
      className="flex min-h-[55vh] max-w-[54ch] flex-col justify-center gap-5 sm:min-h-[70vh] sm:gap-6"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
        · {step.num} / {total.toString().padStart(2, "0")}
      </span>

      <h3 className="font-display text-[64px] leading-[0.9] tracking-tight sm:text-7xl md:text-8xl">
        <span className="block">{step.label}</span>
        <span className="text-[28px] font-normal not-italic text-[color:var(--color-navy-500)] sm:text-4xl md:text-5xl">
          / paso {step.num}
        </span>
      </h3>

      <p className="font-mono text-[13px] leading-relaxed text-[color:var(--color-navy)]/80 sm:text-sm">
        {step.blurb}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-[color:var(--color-navy)]/15 pt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-navy)]/50 sm:gap-4 sm:tracking-[0.3em]">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: inView ? [1, 1.4, 1] : 1 }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="size-1.5 rounded-full bg-[color:var(--color-navy-500)]"
          />
          Paso {index + 1} de {total}
        </div>
        <div className="h-3 w-px bg-[color:var(--color-navy)]/20" />
        <div>
          {index < total - 1 ? "Scroll ↓ siguiente" : "Flujo completo"}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── orbit visual ─────────────── */

function OrbitVisual({ active }: { active: number }) {
  return (
    <div className="relative mx-auto aspect-[1.2/1] w-full max-w-[620px]">
      <svg
        viewBox="-340 -220 680 440"
        className="size-full"
        style={{ transform: "rotate(-20deg)" }}
      >
        {STEPS.map((s, i) => (
          <motion.ellipse
            key={s.id}
            cx="0"
            cy="0"
            rx={s.rx}
            ry={s.ry}
            fill="none"
            stroke={active === i ? "#1d3d8f" : "#011b53"}
            strokeWidth={active === i ? 1.8 : 0.9}
            strokeOpacity={active === i ? 1 : 0.3}
            strokeDasharray={active === i ? "0" : "3 6"}
            animate={{
              strokeWidth: active === i ? 1.8 : 0.9,
              strokeOpacity: active === i ? 1 : 0.3,
            }}
            transition={{ duration: 0.6 }}
          />
        ))}

        {STEPS.map((s, i) => (
          <g key={`dot-${s.id}`}>
            <circle r={active === i ? 7 : 4} fill="var(--color-navy-500)">
              <animateMotion
                dur={`${s.dur}s`}
                repeatCount="indefinite"
                rotate="auto"
                begin={`-${i * 4}s`}
              >
                <mpath href={`#orbit-path-${i}`} />
              </animateMotion>
            </circle>
          </g>
        ))}

        <defs>
          {STEPS.map((s, i) => (
            <path
              key={`path-${s.id}`}
              id={`orbit-path-${i}`}
              d={`M ${s.rx} 0 a ${s.rx} ${s.ry} 0 1 1 ${-s.rx * 2} 0 a ${s.rx} ${s.ry} 0 1 1 ${s.rx * 2} 0`}
              fill="none"
            />
          ))}
        </defs>

        {/* Centre star */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "0 0" }}
        >
          <path
            d="M0 -22 L5 -5 L22 0 L5 5 L0 22 L-5 5 L-22 0 L-5 -5 Z"
            fill="var(--color-navy-500)"
          />
        </motion.g>

        <text
          x="0"
          y="50"
          textAnchor="middle"
          className="font-mono"
          fontSize="11"
          letterSpacing="4"
          fill="var(--color-navy)"
        >
          M90 STUDIO
        </text>
      </svg>

      {/* Labels — active highlighted */}
      {STEPS.map((s, i) => {
        const positions = [
          { left: "62%", top: "30%" },
          { left: "78%", top: "44%" },
          { left: "86%", top: "60%" },
          { left: "92%", top: "76%" },
        ][i];
        const isActive = active === i;
        return (
          <motion.div
            key={s.id}
            style={positions}
            animate={{
              backgroundColor: isActive
                ? "var(--color-navy-500)"
                : "var(--color-paper)",
              color: isActive
                ? "var(--color-cream-soft)"
                : "var(--color-navy)",
              borderColor: isActive
                ? "var(--color-navy-500)"
                : "rgba(1, 27, 83, 0.3)",
            }}
            transition={{ duration: 0.45 }}
            className="absolute -translate-y-1/2 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em]"
          >
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-current" />
              <span className="font-bold">{s.label}</span>
              <span className="opacity-60">/ {s.num}</span>
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
