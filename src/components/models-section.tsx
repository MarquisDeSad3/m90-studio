"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  BRANDS_ORDERED,
  BRAND_LABEL,
  type PhoneBrand,
  type PhoneModelDef,
} from "@/lib/data/phone-models";
import { cn } from "@/lib/utils";

export function ModelsSection({ models }: { models: PhoneModelDef[] }) {
  const [active, setActive] = useState<PhoneBrand>("apple");
  const filtered = useMemo(
    () =>
      models
        .filter((m) => m.brand === active)
        .sort((a, b) => b.popularity - a.popularity),
    [models, active],
  );

  return (
    <section id="modelos" className="relative bg-[color:var(--color-cream-soft)] py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="mb-12 grid items-end gap-6 md:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy-500)]">
              <span className="h-px w-8 bg-[color:var(--color-navy-500)]" />
              Modelos compatibles
            </span>
            <h2 className="mt-4 font-display text-[clamp(40px,7vw,84px)] italic leading-[0.95] text-[color:var(--color-navy)]">
              Tu teléfono, <br />
              <span className="text-[color:var(--color-navy-500)]">cabe seguro.</span>
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[17px]">
            Empezamos con los modelos más comunes en Cuba —
            iPhone, Samsung, Xiaomi, Huawei y Motorola. ¿No ves el tuyo?
            Mándanos un WhatsApp y lo añadimos.
          </p>
        </div>

        {/* Brand tabs */}
        <div className="mb-10 flex flex-wrap gap-2">
          {BRANDS_ORDERED.map((b) => (
            <button
              key={b}
              onClick={() => setActive(b)}
              className={cn(
                "rounded-full border px-5 py-2 text-[12px] uppercase tracking-[0.18em] transition-all",
                active === b
                  ? "border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]"
                  : "border-[color:var(--color-navy)]/15 bg-white/50 text-[color:var(--color-navy)]/70 hover:border-[color:var(--color-navy)]/40 hover:bg-white",
              )}
            >
              {BRAND_LABEL[b]}
            </button>
          ))}
        </div>

        {/* Models grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((model, i) => (
            <motion.div
              key={model.slug}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border border-[color:var(--color-navy)]/10 bg-white/60 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-navy)]/30 hover:shadow-[0_20px_40px_-20px_rgba(1,27,83,0.3)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy-500)]/70">
                  {BRAND_LABEL[model.brand]}
                </span>
                {model.popularity >= 85 && (
                  <span className="rounded-full border border-[color:var(--color-navy-500)]/30 bg-[color:var(--color-navy-500)]/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-navy-500)]">
                    Top
                  </span>
                )}
              </div>

              <h3 className="mt-3 font-display text-[22px] italic leading-tight text-[color:var(--color-navy)]">
                {model.name}
              </h3>

              <p className="mt-2 text-[12px] text-[color:var(--color-navy)]/55">
                {model.aliases.slice(0, 3).join(" · ")}
                {model.aliases.length > 3 && " · +"}
              </p>

              <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/50">
                <span>
                  {model.widthMm} × {model.heightMm} mm
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:rotate-12 group-hover:text-[color:var(--color-navy-500)]" />
              </div>

              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--color-navy-500)] to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
