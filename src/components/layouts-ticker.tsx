"use client";

import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * LayoutsTicker — replica del efecto "We Design" de make-b.studio.
 *
 * Mecánica auto-rotación (NO scroll-driven):
 *  - "Hacemos" fijo a la izquierda en línea horizontal con la palabra
 *    activa. Forman frase: "Hacemos Single", "Hacemos Grid 4"...
 *  - Lista vertical de TODAS las palabras renderizadas a la vez. La
 *    palabra activa está en el centro con opacity 1; las otras tienen
 *    opacity decreciente según su distancia al centro.
 *  - Cada ROTATION_MS, el activeIdx avanza. Las palabras transicionan
 *    suavemente a su nueva posición vertical (efecto deslizamiento).
 *  - La imagen del lado izquierdo cross-fade sincronizada con la palabra.
 */

type LayoutItem = {
  word: string;
  image: string;
  alt: string;
};

const ITEMS: LayoutItem[] = [
  {
    word: "Single",
    image:
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=900&h=1200&q=80",
    alt: "Funda crema en mano",
  },
  {
    word: "Grid 4",
    image:
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&h=1200&q=80",
    alt: "Composición de fundas custom",
  },
  {
    word: "Grid 9",
    image:
      "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=900&h=1200&q=80",
    alt: "Foto a pantalla completa en móvil",
  },
  {
    word: "Asimétrico",
    image:
      "https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&w=900&h=1200&q=80",
    alt: "Mano sosteniendo móvil con funda",
  },
  {
    word: "Polaroid",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&h=1200&q=80",
    alt: "Mano sosteniendo teléfono",
  },
  {
    word: "Magazine",
    image:
      "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=900&h=1200&q=80",
    alt: "Móvil minimal en superficie",
  },
  {
    word: "Mosaico",
    image:
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&h=1200&q=80",
    alt: "Móvil con cover custom",
  },
  {
    word: "Tira",
    image:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&h=1200&q=80",
    alt: "Móvil en uso",
  },
];

const ROTATION_MS = 500;
const N = ITEMS.length;

/**
 * Fotos flotantes que suben de abajo a arriba durante el scroll de la
 * sección sticky. Cada foto tiene una "ventana" [enterAt, exitAt] en
 * scrollYProgress (0 a 1) durante la cual se mueve y es visible.
 *
 * - enterAt: punto de scroll donde la foto entra desde abajo (y = +60vh)
 * - exitAt: punto de scroll donde la foto sale por arriba (y = -60vh)
 * - posición horizontal (side + inset): izq o der pegada al borde
 *
 * Para que la última foto salga JUSTO al final, su exitAt = 1.0.
 */
type FloatingPhoto = {
  src: string;
  side: "left" | "right";
  inset: string;
  width: string;
  rotate: number;
  enterAt: number;
  exitAt: number;
};

const FLOATING_PHOTOS: FloatingPhoto[] = [
  {
    src: "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=600&h=780&q=80",
    side: "left",
    inset: "3%",
    width: "clamp(140px, 16vw, 260px)",
    rotate: -6,
    enterAt: 0.0,
    exitAt: 0.32,
  },
  {
    src: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=600&h=780&q=80",
    side: "right",
    inset: "5%",
    width: "clamp(160px, 18vw, 290px)",
    rotate: 5,
    enterAt: 0.08,
    exitAt: 0.42,
  },
  {
    src: "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=600&h=780&q=80",
    side: "left",
    inset: "10%",
    width: "clamp(130px, 14vw, 220px)",
    rotate: 8,
    enterAt: 0.22,
    exitAt: 0.55,
  },
  {
    src: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=600&h=780&q=80",
    side: "right",
    inset: "12%",
    width: "clamp(170px, 19vw, 310px)",
    rotate: -4,
    enterAt: 0.36,
    exitAt: 0.7,
  },
  {
    src: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&h=780&q=80",
    side: "left",
    inset: "6%",
    width: "clamp(150px, 17vw, 270px)",
    rotate: 7,
    enterAt: 0.5,
    exitAt: 0.85,
  },
  {
    src: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&h=780&q=80",
    side: "right",
    inset: "8%",
    width: "clamp(140px, 15vw, 240px)",
    rotate: -7,
    enterAt: 0.66,
    exitAt: 1.0,
  },
];

/**
 * Calcula offset firmado (corto) entre activeIdx y itemIdx, considerando
 * loop circular. El item en activeIdx tiene offset 0; los siguientes
 * positivos; los anteriores negativos. Para minimizar saltos en el loop,
 * elegimos el camino más corto (puede ser negativo aun siendo posterior).
 */
function shortestSignedOffset(activeIdx: number, itemIdx: number): number {
  const raw = itemIdx - activeIdx;
  const half = N / 2;
  if (raw > half) return raw - N;
  if (raw < -half) return raw + N;
  return raw;
}

/** Opacidad por distancia al centro: 0 → 1, 1 → 0.32, 2 → 0.16, 3 → 0.06, 4+ → 0 */
function opacityForDistance(d: number): number {
  if (d === 0) return 1;
  if (d === 1) return 0.32;
  if (d === 2) return 0.16;
  if (d === 3) return 0.06;
  return 0;
}

export function LayoutsTicker() {
  const sectionRef = useRef<HTMLElement>(null);
  // amount: 0.05 — la sección es 400vh tall y el viewport solo 100vh,
  // así que máximo se puede ver ~25% del elemento. Con 0.05 (5%) basta
  // para que inView sea true durante todo el sticky scroll.
  const inView = useInView(sectionRef, { amount: 0.05, once: false });
  const [activeIdx, setActiveIdx] = useState(0);

  // Scroll progress: 0 al iniciar la sección, 1 al terminar.
  // Usamos ["start start", "end end"] para que la sección sticky-pinned
  // tenga progresión completa durante todo su scroll.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Precarga todas las imágenes (rotation + flotantes)
  useEffect(() => {
    [...ITEMS.map((i) => i.image), ...FLOATING_PHOTOS.map((p) => p.src)].forEach(
      (src) => {
        const img = new Image();
        img.src = src;
      },
    );
  }, []);

  // Auto-rotación: solo cuando la sección está visible
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % N);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[400vh] bg-[color:var(--color-navy-900)] text-[color:var(--color-cream-soft)]"
    >
      {/* Sticky pin: el contenido principal queda fijo durante 400vh de scroll.
          Las fotos suben dentro de este viewport pinned. */}
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* Floating photos layer — suben dentro del sticky con scroll */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {FLOATING_PHOTOS.map((photo, i) => (
            <FloatingPhotoEl
              key={i}
              photo={photo}
              scrollProgress={scrollYProgress}
            />
          ))}
        </div>

        {/* Center content — pinned mientras la sección scrollea */}
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="flex flex-col items-center justify-center gap-8 text-center md:gap-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-cream-warm)]">
            · {String(activeIdx + 1).padStart(2, "0")} / {String(N).padStart(2, "0")} · Lo que hacemos
          </span>

          {/* Phrase row — Hacemos + word column centered */}
          <div
            className="flex items-center justify-center gap-4 md:gap-8"
            style={{
              fontSize: "clamp(48px, 9vw, 140px)",
              lineHeight: 1,
            }}
          >
              {/* "Hacemos" fixed left, aligned with active word in center */}
              <motion.span
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="font-display tracking-tight text-[color:var(--color-cream-soft)]/55"
              >
                Hacemos
              </motion.span>

              {/* Vertical word column — width fija basada en palabra más larga */}
              <div
                className="relative"
                style={{
                  height: "5em",
                  width: "5.8em",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%)",
                }}
              >
                {ITEMS.map((item, i) => {
                  const offset = shortestSignedOffset(activeIdx, i);
                  const distance = Math.abs(offset);
                  const opacity = opacityForDistance(distance);
                  return (
                    <motion.span
                      key={item.word}
                      initial={false}
                      animate={{
                        y: `calc(${offset} * 1em)`,
                        opacity,
                      }}
                      transition={{
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        marginTop: "-0.5em",
                        height: "1em",
                        lineHeight: 1,
                      }}
                      className="block whitespace-nowrap font-display tracking-tight text-[color:var(--color-cream-warm)]"
                    >
                      {item.word}
                    </motion.span>
                  );
                })}
              </div>
            </div>

            {/* Indicator dots */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {ITEMS.map((item, i) => (
                <button
                  key={item.word}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Layout ${item.word}`}
                  className="group/dot flex items-center gap-1.5"
                >
                  <span
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === activeIdx
                        ? "w-8 bg-[color:var(--color-cream-warm)]"
                        : "w-1.5 bg-[color:var(--color-cream-soft)]/25 group-hover/dot:bg-[color:var(--color-cream-soft)]/50"
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className="mt-2 max-w-[42ch] font-mono text-[12px] uppercase leading-relaxed tracking-[0.22em] text-[color:var(--color-cream-soft)]/55 md:text-[13px]">
              · Cualquier layout · cualquier modelo · mismo precio · $15 USD
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── Floating photo ────────────────────── */

function FloatingPhotoEl({
  photo,
  scrollProgress,
}: {
  photo: FloatingPhoto;
  scrollProgress: MotionValue<number>;
}) {
  const { enterAt, exitAt } = photo;
  const span = exitAt - enterAt;
  const fadeIn = enterAt + span * 0.12;
  const fadeOut = exitAt - span * 0.12;

  // y: durante la ventana [enterAt, exitAt] la foto sube de +90vh (debajo)
  // a -90vh (arriba), pasando por 0 (centro) en el medio del recorrido.
  const y = useTransform(scrollProgress, [enterAt, exitAt], ["90vh", "-90vh"]);

  // opacity: bell — invisible antes/después de su ventana, visible durante.
  // Los offsets deben ser monotónicamente crecientes y dentro de [0, 1].
  const opStart = Math.max(0, enterAt - 0.02);
  const opEnd = Math.min(1, exitAt + 0.02);
  const opacity = useTransform(
    scrollProgress,
    [opStart, fadeIn, fadeOut, opEnd],
    [0, 0.95, 0.95, 0],
  );

  const sideStyle =
    photo.side === "left" ? { left: photo.inset } : { right: photo.inset };

  return (
    <motion.div
      style={{
        position: "absolute",
        top: "50%",
        ...sideStyle,
        width: photo.width,
        marginTop: "-25vh",
        y,
        opacity,
        rotate: photo.rotate,
      }}
      className="overflow-hidden rounded-[12px] border border-[color:var(--color-cream-soft)]/12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.65)]"
    >
      <div style={{ aspectRatio: "3 / 4" }} className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt=""
          aria-hidden
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover grayscale-[0.18]"
        />
      </div>
    </motion.div>
  );
}
