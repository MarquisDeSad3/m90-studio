"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CTA "Siguiente" sticky al fondo del viewport en mobile, inline en desktop.
 * Cada step lo renderiza al final con su propio `disabled` y `label`.
 */
export function NextCta({
  onClick,
  disabled,
  label = "Siguiente",
  helper,
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  /** Texto chico al lado del botón (ej: "iPhone 13 seleccionado"). Solo desktop. */
  helper?: string;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-12 border-t border-[color:var(--color-navy)]/10 bg-[color:var(--color-paper)]/95 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8 md:py-5">
      <div className="mx-auto flex max-w-[920px] items-center justify-between gap-3">
        {helper ? (
          <span className="hidden truncate text-[12px] text-[color:var(--color-navy)]/55 md:inline md:text-[13px]">
            {helper}
          </span>
        ) : (
          <span className="hidden md:inline" />
        )}
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.22em] transition-all md:w-auto md:px-8",
            disabled
              ? "cursor-not-allowed bg-[color:var(--color-navy)]/15 text-[color:var(--color-navy)]/40"
              : "bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)] shadow-[0_18px_40px_-18px_rgba(1,27,83,0.55)] hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-16px_rgba(1,27,83,0.7)] active:scale-[0.98]",
          )}
        >
          <span>{label}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
