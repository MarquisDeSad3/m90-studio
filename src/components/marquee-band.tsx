"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

/**
 * MarqueeBand — banda horizontal con texto en loop infinito.
 * Reutilizable en cualquier sección. La animación está definida en
 * globals.css (.animate-marquee).
 */
export function MarqueeBand({
  items,
  variant = "light",
  className,
  duration = 35,
}: {
  items: string[];
  variant?: "light" | "dark" | "accent";
  className?: string;
  duration?: number;
}) {
  // duplicate so animation -50% loops seamlessly
  const doubled = [...items, ...items];

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden border-y py-5 md:py-7",
        variant === "light" &&
          "border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)] text-[color:var(--color-navy)]",
        variant === "dark" &&
          "border-[color:var(--color-cream-soft)]/15 bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]",
        variant === "accent" &&
          "border-[color:var(--color-navy)]/15 bg-[color:var(--color-cream-warm)] text-[color:var(--color-navy)]",
        className,
      )}
    >
      <div
        className="flex w-max items-center gap-10 whitespace-nowrap will-change-transform md:gap-14"
        style={{
          animation: `marquee ${duration}s linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-display text-[40px] leading-none tracking-tight md:gap-14 md:text-[68px]"
          >
            <span>{item}</span>
            <Sparkles className="h-5 w-5 shrink-0 opacity-60 md:h-7 md:w-7" />
          </span>
        ))}
      </div>
    </div>
  );
}
