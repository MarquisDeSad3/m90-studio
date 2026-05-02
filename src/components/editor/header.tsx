"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Modelo", "Layout", "Fotos", "Confirmar"] as const;

export function EditorHeader() {
  const { state, goBack } = useEditor();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-navy)]/10 bg-[color:var(--color-paper)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[960px] items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-3">
          {state.step > 1 ? (
            <button
              onClick={goBack}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--color-navy)]/8 active:bg-[color:var(--color-navy)]/12"
              aria-label="Paso anterior"
            >
              <ArrowLeft className="h-4 w-4 text-[color:var(--color-navy)]" />
            </button>
          ) : (
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--color-navy)]/8 active:bg-[color:var(--color-navy)]/12"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-4 w-4 text-[color:var(--color-navy)]" />
            </Link>
          )}
          <Logo variant="navy" className="text-[20px] md:text-[22px]" />
        </div>

        {/* Step indicator: dots con label del actual */}
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-navy)]/60 sm:inline md:text-[11px]">
            {state.step} / 4 · {STEP_LABELS[state.step - 1]}
          </span>
          <ol className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <li
                key={n}
                aria-current={n === state.step ? "step" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  n === state.step
                    ? "w-7 bg-[color:var(--color-navy)] md:w-8"
                    : n < state.step
                    ? "w-3 bg-[color:var(--color-navy)]/55"
                    : "w-3 bg-[color:var(--color-navy)]/15",
                )}
              />
            ))}
          </ol>
        </div>
      </div>
    </header>
  );
}
