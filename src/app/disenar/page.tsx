import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Diseñar tu funda",
};

export default function DisenarPlaceholder() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--color-cream-soft)]">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-30" />
      <div
        aria-hidden
        className="absolute -left-40 top-40 h-[400px] w-[400px] rounded-full bg-[color:var(--color-navy)]/8 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-32 bottom-20 h-[400px] w-[400px] rounded-full bg-[color:var(--color-navy-500)]/10 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center px-5 py-20 text-center md:px-10">
        <Logo variant="navy" className="text-[40px]" />

        <span className="mt-10 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-navy-500)]/30 bg-[color:var(--color-navy-500)]/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy-500)]">
          <Sparkles className="h-3 w-3" />
          En construcción
        </span>

        <h1 className="mt-6 font-display text-[clamp(48px,10vw,96px)] italic leading-[0.95] text-[color:var(--color-navy)]">
          El editor <br />
          <span className="text-[color:var(--color-navy-500)]">está al caer.</span>
        </h1>

        <p className="mt-6 max-w-[480px] text-balance text-[15px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[17px]">
          Estamos terminando el editor de fundas. Selección de modelo,
          layouts, subida y crop de fotos, todo desde el móvil. Te avisamos
          en cuanto esté listo.
        </p>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-navy)]/15 bg-white/60 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)] transition-all hover:border-[color:var(--color-navy)]/40 hover:bg-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
