"use client";

import {
  motion,
  useInView,
  animate,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";
import {
  Check,
  Sparkles,
  Crown,
  CreditCard,
  Shield,
  Heart,
  ShoppingCart,
  ChevronRight,
  ImageIcon,
  Layers3,
  Smartphone,
  Truck,
  MessageCircle,
} from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";

const BENEFITS = [
  { text: "Pago contra entrega o Transfermóvil", Icon: CreditCard },
  { text: "Garantía de reimpresión si falla", Icon: Shield },
  { text: "Hecho a mano en La Habana", Icon: Heart },
];

const FEATURES = [
  { text: "Funda TPU semi-rígida resistente al uso diario", Icon: Smartphone },
  { text: "Estampado a todo color hasta los bordes", Icon: ImageIcon },
  { text: "1 a 9 fotos por funda · mosaicos sin límite", Icon: Layers3 },
  { text: "Layouts: single, grid, asimétrico, polaroid, magazine", Icon: Sparkles },
  { text: "Editor desde móvil con zoom y recorte", Icon: Smartphone },
  { text: "Compresión automática para datos cubanos", Icon: Check },
  { text: "Confirmación por WhatsApp en cada paso", Icon: MessageCircle },
  { text: "Envío 24-48h La Habana · 3-5 días resto Cuba", Icon: Truck },
  { text: "Cuenta personal para ver progreso del pedido", Icon: Check },
  { text: "Soporte humano por WhatsApp 7 días", Icon: MessageCircle },
];

function CountUp({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const value = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(value, "change", (v) => setDisplay(Math.round(v)));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [inView, to, duration, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}

export function PricingBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section
      id="precio"
      ref={sectionRef}
      className="relative overflow-hidden bg-[color:var(--color-paper)] py-20 md:py-32"
    >
      {/* Background ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(1,27,83,0.4) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        aria-hidden
        className="absolute -left-40 top-1/2 -z-10 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-[color:var(--color-cream-warm)]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-32 top-1/4 -z-10 h-[320px] w-[320px] rounded-full bg-[color:var(--color-navy-500)]/10 blur-3xl"
      />

      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col items-center text-center md:mb-16"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-navy)]/15 bg-white/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)] backdrop-blur">
            <CreditCard className="h-3 w-3" />
            Precio único · sin sorpresas
          </span>
          <h2 className="font-display text-[clamp(40px,7vw,84px)] leading-[0.95] text-[color:var(--color-navy)]">
            Una funda. Un precio.
          </h2>
          <p className="mt-4 max-w-[520px] text-[14px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[16px]">
            Mismo material, mismo precio para cualquier modelo y layout.
            Sin tiers premium, sin descuentos manipulativos. Lo que pagas
            es lo que cuesta.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="group relative overflow-hidden rounded-[28px] border border-[color:var(--color-navy)]/12 bg-gradient-to-br from-[color:var(--color-navy)] via-[color:var(--color-navy-700)] to-[color:var(--color-navy-900)] shadow-[0_40px_120px_-40px_rgba(1,27,83,0.6)] md:rounded-[32px]"
        >
          {/* Glow inside card */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 h-[360px] w-[360px] rounded-full bg-[color:var(--color-cream-warm)]/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -left-20 h-[320px] w-[320px] rounded-full bg-[color:var(--color-navy-500)]/40 blur-3xl"
          />

          <div className="relative grid grid-cols-1 md:grid-cols-2">
            {/* LEFT — Pricing details */}
            <div className="flex flex-col gap-6 p-7 md:gap-7 md:p-12">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-cream-warm)]/30 bg-[color:var(--color-cream-warm)]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-warm)]">
                  <Crown className="h-3 w-3" />
                  Funda M90 Studio
                </span>
              </div>

              <div>
                <h3 className="font-display text-[44px] leading-[0.92] text-[color:var(--color-cream-soft)] md:text-[52px]">
                  Diseño tuyo.
                </h3>
                <h3 className="font-display text-[44px] leading-[0.92] text-[color:var(--color-cream-warm)] md:text-[52px]">
                  Hecho en Cuba.
                </h3>
                <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed text-[color:var(--color-cream-soft)]/65 md:text-[15px]">
                  Diseñas desde el móvil con tus fotos. Imprimimos en 24-48h
                  con calidad foto. Te la entregamos en casa.
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 md:gap-3">
                <span className="font-light text-[36px] leading-none text-[color:var(--color-cream-soft)] md:text-[44px]">
                  $
                </span>
                <span className="font-display text-[80px] leading-none text-[color:var(--color-cream-soft)] md:text-[104px]">
                  <CountUp to={15} />
                </span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)]/70 md:text-[14px]">
                  USD
                </span>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 border-t border-[color:var(--color-cream-soft)]/10 pt-6">
                {BENEFITS.map((b, i) => (
                  <BenefitRow
                    key={b.text}
                    text={b.text}
                    Icon={b.Icon}
                    inView={inView}
                    delay={0.25 + i * 0.07}
                  />
                ))}
              </ul>

              {/* Buttons */}
              <div className="mt-auto flex flex-col gap-3 pt-2">
                <a
                  href="/disenar"
                  className="group/btn inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-cream-soft)] px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)] shadow-[0_12px_30px_-12px_rgba(247,235,200,0.4)] transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_-14px_rgba(247,235,200,0.55)]"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Diseñar la mía</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </a>
                <a
                  href="#galeria"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--color-cream-soft)]/20 bg-transparent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)]/85 transition-all hover:border-[color:var(--color-cream-warm)]/45 hover:text-[color:var(--color-cream-warm)]"
                >
                  <span>Ver galería de fundas</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* RIGHT — Features */}
            <div className="relative border-t border-[color:var(--color-cream-soft)]/10 p-7 md:border-l md:border-t-0 md:p-12">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-cream-warm)]">
                  Lo que incluye · todo
                </h4>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-cream-soft)]/15 bg-[color:var(--color-cream-soft)]/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)]/75">
                  <Sparkles className="h-3 w-3" />
                  {FEATURES.length} features
                </span>
              </div>

              <ul className="mt-6 space-y-3 md:space-y-3.5">
                {FEATURES.map((f, i) => (
                  <FeatureRow
                    key={f.text}
                    text={f.text}
                    Icon={f.Icon}
                    inView={inView}
                    delay={0.35 + i * 0.04}
                  />
                ))}
              </ul>

              {/* Footer note */}
              <div className="mt-8 rounded-2xl border border-[color:var(--color-cream-soft)]/12 bg-[color:var(--color-cream-soft)]/[0.04] p-4 backdrop-blur">
                <p className="text-[12px] leading-relaxed text-[color:var(--color-cream-soft)]/70 md:text-[13px]">
                  <span className="font-display italic text-[color:var(--color-cream-warm)]">
                    ¿Tu modelo no aparece?
                  </span>{" "}
                  Mándanos un WhatsApp con el modelo exacto. Casi siempre
                  conseguimos plantilla.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BenefitRow({
  text,
  Icon,
  inView,
  delay,
}: {
  text: string;
  Icon: ComponentType<{ className?: string }>;
  inView: boolean;
  delay: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 text-[13px] text-[color:var(--color-cream-soft)]/85 md:text-[14px]"
    >
      <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-[color:var(--color-cream-warm)]/25 bg-[color:var(--color-cream-warm)]/10 text-[color:var(--color-cream-warm)]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      {text}
    </motion.li>
  );
}

function FeatureRow({
  text,
  Icon,
  inView,
  delay,
}: {
  text: string;
  Icon: ComponentType<{ className?: string }>;
  inView: boolean;
  delay: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: 16 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3 text-[13px] leading-snug text-[color:var(--color-cream-soft)]/82 md:text-[14px]"
    >
      <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-[color:var(--color-cream-warm)]/15 text-[color:var(--color-cream-warm)]">
        <Icon className="h-3 w-3" />
      </span>
      <span>{text}</span>
    </motion.li>
  );
}
