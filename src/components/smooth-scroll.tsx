"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * SmoothScroll — montar una vez en root layout. Activa Lenis con easing
 * suave y deja al usuario detener el scroll con la rueda. Se respeta
 * prefers-reduced-motion (Lenis lo desactiva automáticamente).
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let raf = 0;
    function loop(time: number) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
