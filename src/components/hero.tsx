"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hero — gradwear.ca technique.
 *
 * Stack (z-index):
 *   z-0  → Carousel (center image + 2 side peeks)
 *   z-10 → OUTLINE text "M90 / STUDIO" (transparent fill, navy stroke)
 *
 * The text has stroke + transparent fill. The carousel image sits
 * BEHIND the text. Where the image overlaps the letters, you see
 * the image through the transparent fill. Where there is no image,
 * you see the paper background through the fill. Stroke is always
 * visible. Same effect as gradwear's headline.
 */

type CaseSlide = { src: string; alt: string };

// Placeholder photos from Unsplash — phone-in-hand / phone-case shots.
// These will be replaced with real product photos later.
const CASES: CaseSlide[] = [
  {
    src: "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=660&h=860&q=80",
    alt: "Funda iPhone cream",
  },
  {
    src: "https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&w=660&h=860&q=80",
    alt: "Funda navy en mano",
  },
  {
    src: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=660&h=860&q=80",
    alt: "Fundas custom",
  },
  {
    src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=660&h=860&q=80",
    alt: "Mano sosteniendo teléfono",
  },
];

export function Hero() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setActive((i) => (i + 1) % CASES.length);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(advance, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advance]);

  const jumpTo = (i: number) => {
    setActive(((i % CASES.length) + CASES.length) % CASES.length);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(advance, 4000);
    }
  };

  return (
    <section
      id="top"
      className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[color:var(--color-paper)] pt-24 pb-12 md:pt-32 md:pb-20"
    >
      {/* Subtle dotted background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(1, 27, 83, 0.12) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Z-0 — Carousel (sits BEHIND the text) */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <CaseCarousel active={active} onJump={jumpTo} />
      </div>

      {/* Z-10 — OUTLINE text on top (transparent fill — image shows through letters) */}
      <TypographyStack />

      {/* Z-30 — Bottom row (CTA + dots) */}
      <div className="relative z-30 mt-auto flex flex-col items-center gap-3 pt-8 md:pt-12">
        <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          href="/disenar"
          className="group inline-flex items-center gap-3 font-display text-[clamp(28px,4vw,52px)] italic leading-none text-[color:var(--color-navy)] transition-all hover:tracking-[0.01em]"
        >
          Crea tu cover
          <ArrowDownRight className="h-7 w-7 transition-transform group-hover:translate-x-1 group-hover:translate-y-1 md:h-10 md:w-10" />
        </motion.a>

        <div className="mt-4 flex items-center gap-2">
          {CASES.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              aria-label={`Mockup ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active
                  ? "w-8 bg-[color:var(--color-navy)]"
                  : "w-2 bg-[color:var(--color-navy)]/25 hover:bg-[color:var(--color-navy)]/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TypographyStack — full-viewport "M90 / STUDIO" stacked.
   Both lines are OUTLINE only (stroke + transparent fill).
   The image carousel sits BEHIND, so the image shows through the
   letters where it overlaps. Where it doesn't, paper shows through.
   ============================================================ */
function TypographyStack() {
  const outlineStyle: React.CSSProperties = {
    fontSize: "clamp(96px, 22vw, 320px)",
    WebkitTextStroke: "2.5px var(--color-navy)",
    WebkitTextFillColor: "transparent",
  };
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center pt-24 pb-20 md:pt-32 md:pb-32"
    >
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="font-display text-center italic leading-[0.82] tracking-[-0.02em]"
        style={outlineStyle}
      >
        M90
      </motion.h1>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="font-display text-center italic leading-[0.82] tracking-[-0.02em]"
        style={outlineStyle}
      >
        STUDIO
      </motion.h1>
    </div>
  );
}

/* ============================================================
   CaseCarousel — gradwear-style: 1 big center + left/right peeks
   asoming from the viewport edges. Click any to jump.
   ============================================================ */
function CaseCarousel({
  active,
  onJump,
}: {
  active: number;
  onJump: (i: number) => void;
}) {
  const n = CASES.length;
  return (
    <div className="pointer-events-none relative h-full w-full">
      {CASES.map((c, i) => {
        const offset = (((i - active) % n) + n) % n;
        const slot: SlotPos =
          offset === 0
            ? "center"
            : offset === 1
              ? "right"
              : offset === n - 1
                ? "left"
                : "hidden";
        return (
          <SlideButton
            key={i}
            slot={slot}
            slide={c}
            onClick={() => onJump(i)}
          />
        );
      })}
    </div>
  );
}

type SlotPos = "center" | "left" | "right" | "hidden";

const SLOT_STYLES: Record<
  SlotPos,
  { x: string; scale: number; opacity: number; z: number; rotate: number }
> = {
  // Side peeks barely show — only ~10% asomes from the viewport edge,
  // matching gradwear's offset-carousel where laterals are nearly hidden.
  center: { x: "0vw", scale: 1, opacity: 1, z: 30, rotate: 0 },
  right: { x: "48vw", scale: 0.85, opacity: 1, z: 20, rotate: 3 },
  left: { x: "-48vw", scale: 0.85, opacity: 1, z: 20, rotate: -3 },
  hidden: { x: "0vw", scale: 0.7, opacity: 0, z: 0, rotate: 0 },
};

function SlideButton({
  slot,
  slide,
  onClick,
}: {
  slot: SlotPos;
  slide: CaseSlide;
  onClick: () => void;
}) {
  const s = SLOT_STYLES[slot];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={
        slot === "center"
          ? "Siguiente mockup"
          : slot === "left"
            ? "Mockup anterior"
            : slot === "right"
              ? "Siguiente mockup"
              : "Mockup oculto"
      }
      initial={{ opacity: 0, scale: 0.85, x: "0vw" }}
      animate={{
        x: s.x,
        scale: s.scale,
        opacity: s.opacity,
        rotate: s.rotate,
      }}
      transition={{ type: "spring", stiffness: 180, damping: 26 }}
      style={{
        zIndex: s.z,
        pointerEvents: slot === "hidden" ? "none" : "auto",
        // Top-right-skew clip-path (gradwear-style)
        clipPath: "polygon(0 4%, 100% 0, 100% 96%, 0 100%)",
      }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-navy)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--color-paper)]"
    >
      <div className="relative h-[300px] w-[230px] overflow-hidden rounded-[24px] shadow-[0_50px_120px_-30px_rgba(1,27,83,0.55)] md:h-[640px] md:w-[480px] md:rounded-[36px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.src}
          alt={slide.alt}
          loading="eager"
          draggable={false}
          className="h-full w-full object-cover"
        />
      </div>
    </motion.button>
  );
}
