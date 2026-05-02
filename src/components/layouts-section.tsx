"use client";

import { motion } from "framer-motion";
import { LAYOUTS } from "@/lib/data/layouts";
import { cn } from "@/lib/utils";

export function LayoutsSection() {
  return (
    <section
      id="layouts"
      className="relative overflow-hidden bg-[color:var(--color-cream)]/40 py-24 md:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-dots opacity-50"
      />

      <div className="relative mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="mb-14 grid items-end gap-6 md:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-navy-500)]">
              <span className="h-px w-8 bg-[color:var(--color-navy-500)]" />
              Layouts
            </span>
            <h2 className="mt-4 font-display text-[clamp(40px,7vw,84px)] italic leading-[0.95] text-[color:var(--color-navy)]">
              De 1 a 9 fotos. <br />
              <span className="text-[color:var(--color-navy-500)]">Como te dé la gana.</span>
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[17px]">
            Mosaicos simétricos para los que quieren orden. Asimétricos
            para los que quieren personalidad. Cualquiera de los 11
            layouts funciona en cualquier modelo.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {LAYOUTS.map((layout, i) => (
            <motion.div
              key={layout.id}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group relative flex flex-col gap-3 rounded-2xl border border-[color:var(--color-navy)]/10 bg-white/70 p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-navy-500)]/30 hover:shadow-[0_20px_40px_-20px_rgba(152,14,33,0.25)]"
            >
              {/* Layout preview — case-shaped */}
              <div className="relative mx-auto aspect-[1/2] w-[110px] rounded-[16px] border-[2px] border-[color:var(--color-navy)] bg-[color:var(--color-navy)] p-1.5 transition-colors group-hover:border-[color:var(--color-navy-500)]">
                <div className="absolute left-1/2 top-2 h-3 w-8 -translate-x-1/2 rounded-full bg-black/30" />
                <div className="relative h-full w-full overflow-hidden rounded-[10px]">
                  {layout.slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "absolute bg-gradient-to-br",
                        idx % 5 === 0 &&
                          "from-[color:var(--color-cream)] to-[color:var(--color-cream-soft)]",
                        idx % 5 === 1 &&
                          "from-[color:var(--color-navy-500)]/40 to-[color:var(--color-cream)]",
                        idx % 5 === 2 &&
                          "from-[color:var(--color-navy)]/30 to-[color:var(--color-cream-soft)]",
                        idx % 5 === 3 &&
                          "from-[color:var(--color-cream-soft)] to-[color:var(--color-navy-500)]/30",
                        idx % 5 === 4 &&
                          "from-[color:var(--color-cream)] to-[color:var(--color-navy)]/30",
                      )}
                      style={{
                        left: `${slot.x * 100}%`,
                        top: `${slot.y * 100}%`,
                        width: `${slot.w * 100}%`,
                        height: `${slot.h * 100}%`,
                        outline: "1px solid rgba(1,27,83,0.4)",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <p className="font-display text-[16px] italic leading-tight text-[color:var(--color-navy)]">
                  {layout.name}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/45">
                  {layout.count} foto{layout.count > 1 ? "s" : ""} ·{" "}
                  {layout.category === "asymmetric" ? "asimétrico" : layout.category === "grid" ? "grid" : "single"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
