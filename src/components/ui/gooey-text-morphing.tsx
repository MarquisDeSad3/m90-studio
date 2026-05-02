"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName,
}: GooeyTextProps) {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;
    let raf = 0;
    let isVisible = false;
    let isTabActive = !document.hidden;

    const setMorph = (fraction: number) => {
      const t1 = text1Ref.current;
      const t2 = text2Ref.current;
      if (!t1 || !t2) return;

      t2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      t2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const inv = 1 - fraction;
      t1.style.filter = `blur(${Math.min(8 / inv - 8, 100)}px)`;
      t1.style.opacity = `${Math.pow(inv, 0.4) * 100}%`;
    };

    const doCooldown = () => {
      morph = 0;
      const t1 = text1Ref.current;
      const t2 = text2Ref.current;
      if (!t1 || !t2) return;
      t2.style.filter = "";
      t2.style.opacity = "100%";
      t1.style.filter = "";
      t1.style.opacity = "0%";
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;
      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }
      setMorph(fraction);
    };

    function tick() {
      raf = requestAnimationFrame(tick);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length];
            text2Ref.current.textContent =
              texts[(textIndex + 1) % texts.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    function start() {
      if (raf) return; // ya corriendo
      time = new Date(); // resetear dt para no saltar al reanudar
      tick();
    }

    function stop() {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function maybeRun() {
      if (isVisible && isTabActive) start();
      else stop();
    }

    // Solo corremos el RAF cuando el componente esta en viewport Y la pestaña
    // esta activa. Sin esto el morph chupa CPU/GPU 24/7 aunque el usuario este
    // en otra seccion o en otra pestaña — bateria muerta gratis.
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
        maybeRun();
      },
      { threshold: 0.05 },
    );
    if (containerRef.current) observer.observe(containerRef.current);

    const onVisibility = () => {
      isTabActive = !document.hidden;
      maybeRun();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [texts, morphTime, cooldownTime]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center"
        style={{ filter: "url(#threshold)" }}
      >
        <span
          ref={text1Ref}
          className={cn(
            "absolute inline-block select-none text-center text-6xl md:text-[60pt]",
            "text-foreground",
            textClassName,
          )}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute inline-block select-none text-center text-6xl md:text-[60pt]",
            "text-foreground",
            textClassName,
          )}
        />
      </div>
    </div>
  );
}
