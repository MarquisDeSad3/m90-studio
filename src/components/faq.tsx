"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlurInWords } from "./ui/blur-in";

const ITEMS = [
  {
    q: "¿Qué tipo de funda imprimen?",
    a: "Funda TPU semi-rígida con estampado a todo color que cubre los bordes. Resistente al uso diario, no se despega ni se borra el diseño.",
  },
  {
    q: "¿Cuánto tarda en llegar?",
    a: "En La Habana: 24-48h después de confirmar el pedido. Resto de Cuba: 3-5 días según provincia. Te avisamos por WhatsApp en cada paso.",
  },
  {
    q: "¿Cómo pago?",
    a: "Pago a la entrega en La Habana. Transfermóvil o Zelle para envíos a otras provincias. No cobramos hasta confirmar el pedido contigo.",
  },
  {
    q: "¿Y si mi modelo no aparece?",
    a: "Mándanos un WhatsApp con el modelo exacto. Si tenemos plantilla la añadimos al catálogo, si no, intentamos conseguirla. Casi siempre se puede.",
  },
  {
    q: "¿Puedo ver cómo va mi pedido?",
    a: "Sí. Al hacer el pedido creas una cuenta con tu número de teléfono. Desde ahí ves el estado: confirmado, imprimiendo, listo, entregado.",
  },
  {
    q: "¿Qué calidad necesitan las fotos?",
    a: "Mientras más resolución, mejor. Fotos de móvil modernas funcionan perfectas. Si una imagen pixela demasiado al ampliarla en el editor, te avisamos.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative bg-[color:var(--color-cream-soft)] py-24 md:py-32">
      <div className="mx-auto max-w-[920px] px-5 md:px-10">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy-500)]">
            <span className="h-px w-8 bg-[color:var(--color-navy-500)]" />
            FAQ
            <span className="h-px w-8 bg-[color:var(--color-navy-500)]" />
          </span>
          <h2 className="mt-4 font-display text-[clamp(40px,7vw,84px)] leading-[0.95] text-[color:var(--color-navy)]">
            <BlurInWords
              segments={["Lo", "que", { text: "preguntan.", accent: true }]}
              accentClass="text-[color:var(--color-navy-500)]"
            />
          </h2>
        </div>

        <div className="divide-y divide-[color:var(--color-navy)]/10 rounded-2xl border border-[color:var(--color-navy)]/10 bg-white/60 backdrop-blur-sm">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-[color:var(--color-cream)]/30 md:px-8 md:py-6"
                >
                  <span className="font-display text-[20px] italic leading-snug text-[color:var(--color-navy)] md:text-[24px]">
                    {item.q}
                  </span>
                  <span
                    className={cn(
                      "grid h-9 w-9 flex-none place-items-center rounded-full border border-[color:var(--color-navy)]/15 bg-[color:var(--color-cream-soft)] text-[color:var(--color-navy)] transition-transform duration-300",
                      isOpen && "rotate-45 bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]",
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-[15px] leading-relaxed text-[color:var(--color-navy)]/70 md:px-8 md:pb-8">
                    {item.a}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
