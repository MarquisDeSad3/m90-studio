"use client";

import { motion } from "framer-motion";
import { Smartphone, Layers3, ImagePlus, MessageCircle } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Smartphone,
    title: "Elige tu modelo",
    body:
      "Busca tu teléfono — iPhone, Samsung, Xiaomi, Huawei… cubrimos los modelos más populares en Cuba.",
  },
  {
    n: "02",
    icon: Layers3,
    title: "Escoge un layout",
    body:
      "Desde 1 foto a pantalla completa hasta mosaicos de 9. Asimétricos, magazine, polaroid — tú decides.",
  },
  {
    n: "03",
    icon: ImagePlus,
    title: "Sube tus fotos",
    body:
      "Recorta, mueve y haz zoom desde el móvil. Comprimimos automáticamente para que cargue rápido aunque tengas mala señal.",
  },
  {
    n: "04",
    icon: MessageCircle,
    title: "Pedido por WhatsApp",
    body:
      "Confirmamos por chat, imprimimos en 24-48h y te la llevamos a la puerta. Pago a la entrega.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden bg-[color:var(--color-navy)] py-24 text-[color:var(--color-cream-soft)] md:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(247,235,200,0.5) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="mb-16 grid items-end gap-6 md:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-cream-warm)]">
              <span className="h-px w-8 bg-[color:var(--color-cream-warm)]" />
              Cómo funciona
            </span>
            <h2 className="mt-4 font-display text-[clamp(40px,7vw,84px)] italic leading-[0.95]">
              4 pasos. <br />
              <span className="text-[color:var(--color-cream-warm)]">Sin enredos.</span>
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[color:var(--color-cream-soft)]/70 md:text-[17px]">
            Diseñas desde el móvil con tus fotos. La carga del editor está
            optimizada para conexiones cubanas — no necesitas wifi premium.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-[color:var(--color-cream-soft)]/15 bg-[color:var(--color-cream-soft)]/5 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-[color:var(--color-cream-warm)]/40 hover:bg-[color:var(--color-cream-soft)]/10"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[40px] italic text-[color:var(--color-cream-soft)]/30">
                  {step.n}
                </span>
                <div className="grid h-12 w-12 place-items-center rounded-full border border-[color:var(--color-cream-soft)]/20 bg-[color:var(--color-cream-soft)]/5 text-[color:var(--color-cream-soft)] transition-all group-hover:border-[color:var(--color-cream-warm)]/60 group-hover:text-[color:var(--color-cream-warm)]">
                  <step.icon className="h-5 w-5" />
                </div>
              </div>

              <h3 className="mt-6 font-display text-[24px] italic">
                {step.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[color:var(--color-cream-soft)]/65">
                {step.body}
              </p>

              <div
                aria-hidden
                className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--color-cream-warm)]/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
