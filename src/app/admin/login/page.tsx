"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/admin/orders";

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Login falló");
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login falló");
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-[color:var(--color-paper)] px-5 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.25]"
      />
      <div className="w-full max-w-[400px]">
        <div className="mb-10 flex flex-col items-center gap-4">
          <Logo variant="navy" className="text-[34px]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
            · Panel admin · interno
          </span>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-[color:var(--color-navy)]/12 bg-white p-7 shadow-[0_30px_80px_-30px_rgba(1,27,83,0.25)] md:p-8"
        >
          <label
            htmlFor="password"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]"
          >
            · Contraseña
          </label>
          <div className="relative mt-2">
            <Lock
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-navy)]/40"
            />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)] pl-11 pr-4 text-[14px] text-[color:var(--color-navy)] focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15"
            />
          </div>

          {error && (
            <p className="mt-3 text-[12px] text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-navy)] px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] shadow-[0_18px_40px_-18px_rgba(1,27,83,0.55)] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
