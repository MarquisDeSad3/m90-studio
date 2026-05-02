"use client";

import { Construction } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { NextCta } from "./next-cta";

const STEP_INFO: Record<2 | 3 | 4, { title: string; body: string }> = {
  2: {
    title: "Elegí el layout",
    body: "Single, mosaico de 4, mosaico de 9, asimétrico, polaroid o magazine.",
  },
  3: {
    title: "Subí tus fotos",
    body: "Una por slot. Recortás, hacés zoom y movés desde el móvil.",
  },
  4: {
    title: "Confirmá el pedido",
    body: "Revisás cómo queda, te mandamos por WhatsApp y la imprimimos en 24-48h.",
  },
};

export function StepPlaceholder({ step }: { step: 2 | 3 | 4 }) {
  const { goNext } = useEditor();
  const info = STEP_INFO[step];

  return (
    <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[920px] flex-col px-4 py-10 md:px-8 md:py-16">
      <div className="mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
          · Paso {step} de 4
        </span>
        <h1 className="mt-2 font-display text-[clamp(34px,7.5vw,64px)] italic leading-[0.98] text-[color:var(--color-navy)]">
          {info.title}
        </h1>
        <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[15px]">
          {info.body}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="flex max-w-[420px] flex-col items-center rounded-3xl border border-dashed border-[color:var(--color-navy)]/20 bg-white/60 px-6 py-12 text-center md:px-10 md:py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-navy)]/8 text-[color:var(--color-navy)]/55">
            <Construction className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-[24px] italic leading-tight text-[color:var(--color-navy)] md:text-[28px]">
            En construcción
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--color-navy)]/55 md:text-[14px]">
            Este paso lo estamos terminando. El flujo navega pero todavía no
            hace nada acá.
          </p>
        </div>
      </div>

      {step < 4 && <NextCta onClick={goNext} label="Saltar este paso" />}
    </section>
  );
}
