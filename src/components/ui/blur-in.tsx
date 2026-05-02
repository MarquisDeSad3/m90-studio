"use client";

import { motion, useInView } from "framer-motion";
import { ReactNode, useRef } from "react";

type Segment = string | { text: string; accent?: boolean; italic?: boolean };

/**
 * BlurInWords — divide una frase en palabras que se desenfocan + slide al
 * entrar en viewport. Usa useInView en vez de whileInView para que aguante
 * Lenis + overflow parents.
 */
export function BlurInWords({
  text,
  segments,
  className = "",
  accentClass = "text-[color:var(--color-navy-500)]",
  delay = 0,
  stagger = 0.065,
  once = true,
  as: Tag = "span",
}: {
  text?: string;
  segments?: Segment[];
  className?: string;
  accentClass?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.2, once, margin: "0px 0px -80px 0px" });

  const parts: Segment[] =
    segments ??
    (text ?? "").split(/(\s+)/).filter((s) => s.trim().length > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;

  return (
    <Component className={className}>
      <span
        ref={ref}
        className="inline-flex flex-wrap items-baseline gap-x-[0.22em] gap-y-2"
      >
        {parts.map((seg, i) => {
          const word = typeof seg === "string" ? seg : seg.text;
          const italic = typeof seg !== "string" && seg.italic;
          const accent = typeof seg !== "string" && seg.accent;
          return (
            <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
              <motion.span
                initial={{ y: "110%", filter: "blur(10px)", opacity: 0 }}
                animate={
                  inView
                    ? { y: "0%", filter: "blur(0px)", opacity: 1 }
                    : { y: "110%", filter: "blur(10px)", opacity: 0 }
                }
                transition={{
                  delay: delay + i * stagger,
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`inline-block ${italic ? "italic font-normal" : ""} ${
                  accent ? accentClass : ""
                }`}
              >
                {word}
              </motion.span>
            </span>
          );
        })}
      </span>
    </Component>
  );
}

/**
 * BlurInParagraph — fade in con y-offset sutil, sin split por palabra.
 * Para body copy.
 */
export function BlurInParagraph({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.2,
    margin: "0px 0px -60px 0px",
  });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={
        inView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 16, filter: "blur(6px)" }
      }
      transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
