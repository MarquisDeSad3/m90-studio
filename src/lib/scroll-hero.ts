/**
 * Animacion: scrollea por todo el hero section (la que tiene id="top")
 * con easing cubico, y al terminar invoca onDone (tipicamente navegar
 * a /disenar).
 *
 * Si la pagina actual no tiene un hero (estamos en otra ruta), o si el
 * usuario ya scrolleo casi todo el hero, llama a onDone directo.
 *
 * Usa RAF manual independiente de Lenis: el target absoluto se ignora si
 * Lenis intercepta, asi que escribimos directo a window.scrollTo.
 */
export function scrollHeroThenRun(onDone: () => void) {
  if (typeof window === "undefined") {
    onDone();
    return;
  }
  const hero = document.getElementById("top");
  if (!hero) {
    onDone();
    return;
  }

  const sectionTop = hero.offsetTop;
  const sectionEnd = sectionTop + hero.offsetHeight - window.innerHeight;
  const currentY = window.scrollY;
  const remaining = sectionEnd - currentY;

  if (remaining < window.innerHeight * 0.3) {
    onDone();
    return;
  }

  const startY = currentY;
  const distance = sectionEnd - startY;
  const duration = Math.min(2400, Math.max(1200, distance * 0.6));
  const startTime = performance.now();

  function step(now: number) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo(0, startY + distance * eased);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      setTimeout(onDone, 350);
    }
  }
  requestAnimationFrame(step);
}
