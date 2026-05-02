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
