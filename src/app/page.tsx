import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/nav";
import { HeroFrames } from "@/components/hero-frames";
import { MarqueeBand } from "@/components/marquee-band";
import { ProcessSimple } from "@/components/process-simple";
import { LayoutsTicker } from "@/components/layouts-ticker";
import { DiagonalGallery } from "@/components/diagonal-gallery";
import { PricingGooey } from "@/components/pricing-gooey";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroFrames />

        {/* CTA mobile — aparece debajo del hero ya que el nav no tiene CTA en mobile */}
        <section className="bg-[color:var(--color-paper)] px-5 pb-10 pt-2 md:hidden">
          <a
            href="/disenar"
            className="group flex w-full items-center justify-center gap-3 rounded-full bg-[color:var(--color-navy)] px-7 py-5 text-[14px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream-soft)] shadow-[0_18px_40px_-18px_rgba(1,27,83,0.55)] transition-all active:scale-[0.98]"
          >
            Empecemos
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </section>

        <MarqueeBand
          variant="dark"
          items={[
            "Fundas custom",
            "Hechas en Cuba",
            "M90 Studio",
            "Tu foto, tu funda",
            "Envío 24-48h",
          ]}
        />

        <ProcessSimple />

        <LayoutsTicker />

        <DiagonalGallery />

        <MarqueeBand
          variant="accent"
          items={[
            "$15 USD",
            "Envío incluido",
            "Pago a la entrega",
            "TPU resistente",
            "Calidad foto",
          ]}
          duration={28}
        />

        <PricingGooey />
      </main>
      <Footer />
    </>
  );
}
