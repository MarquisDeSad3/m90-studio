import Link from "next/link";
import { ArrowLeft, PackageOpen } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Mis pedidos",
};

export default function MisPedidosPlaceholder() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--color-cream-soft)]">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center px-5 py-20 text-center md:px-10">
        <Logo variant="navy" className="text-[40px]" />

        <span className="mt-10 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-navy)]/15 bg-white/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]/70">
          <PackageOpen className="h-3 w-3" />
          Próximamente
        </span>

        <h1 className="mt-6 font-display text-[clamp(48px,10vw,96px)] italic leading-[0.95] text-[color:var(--color-navy)]">
          Tus pedidos, <br />
          <span className="text-[color:var(--color-navy-500)]">en directo.</span>
        </h1>

        <p className="mt-6 max-w-[480px] text-balance text-[15px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[17px]">
          Pronto podrás iniciar sesión con tu número de teléfono y ver el
          estado de cada pedido — confirmado, imprimiendo, listo, entregado.
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
