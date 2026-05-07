"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reemplazo del `window.confirm()` nativo (el feo "m90studio says...")
 * por un modal estilizado consistente con la marca. Se usa via hook:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "¿Borrar foto?", variant: "danger" })) { ... }
 *
 * Provider va en `app/layout.tsx` para que esté disponible globalmente.
 */

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" pinta el botón de confirmar en rojo y agrega icono de
      warning. Default es "default" (botón navy normal). */
  variant?: "default" | "danger";
};

type ConfirmCtx = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const Ctx = createContext<ConfirmCtx | null>(null);

type Pending = {
  opts: ConfirmOptions;
  resolve: (value: boolean) => void;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ opts, resolve });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      if (pending) pending.resolve(value);
      setPending(null);
    },
    [pending],
  );

  // Esc cierra (cancel), Enter confirma
  useEffect(() => {
    if (!pending) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        close(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pending, close]);

  return (
    <Ctx.Provider value={{ confirm }}>
      {children}
      {pending && <ConfirmDialog opts={pending.opts} onClose={close} />}
    </Ctx.Provider>
  );
}

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useConfirm() debe usarse dentro de <ConfirmProvider>");
  }
  return ctx.confirm;
}

function ConfirmDialog({
  opts,
  onClose,
}: {
  opts: ConfirmOptions;
  onClose: (value: boolean) => void;
}) {
  const isDanger = opts.variant === "danger";
  const confirmLabel = opts.confirmLabel ?? "Confirmar";
  const cancelLabel = opts.cancelLabel ?? "Cancelar";

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[color:var(--color-navy)]/45 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(false);
      }}
    >
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          {isDanger && (
            <div
              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-red-50"
              aria-hidden
            >
              <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[20px] italic leading-tight text-[color:var(--color-navy)] md:text-[22px]">
              {opts.title}
            </h2>
            {opts.message && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--color-navy)]/65 md:text-[14px]">
                {opts.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="flex-shrink-0 rounded-full p-1 text-[color:var(--color-navy)]/45 hover:bg-[color:var(--color-navy)]/[0.06] hover:text-[color:var(--color-navy)]/80"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[color:var(--color-navy)]/10 bg-[color:var(--color-cream-soft)]/30 px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[color:var(--color-navy)]/15 bg-white px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]/75 transition-colors hover:bg-[color:var(--color-navy)]/[0.04]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            autoFocus
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-full px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5 active:scale-[0.98]",
              isDanger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
