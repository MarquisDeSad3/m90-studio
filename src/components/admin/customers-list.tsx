"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { CustomerWithStats } from "@/lib/data/customers-db";

export function CustomersList({
  initial,
}: {
  initial: CustomerWithStats[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initial;
    return initial.filter((c) => {
      if (c.phone.toLowerCase().includes(q)) return true;
      if (c.name && c.name.toLowerCase().includes(q)) return true;
      if (c.tags.some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [initial, query]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[color:var(--color-navy)]/10 bg-white p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--color-navy)]/40" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-white pl-9 pr-3 font-mono text-[12px] text-[color:var(--color-navy)] focus:border-[color:var(--color-navy)] focus:outline-none"
          />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
          {filtered.length} de {initial.length}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[color:var(--color-navy)]/10 bg-white p-10 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/45">
            {initial.length === 0
              ? "Sin clientes todavía"
              : "Ningún cliente coincide con la búsqueda"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[color:var(--color-navy)]/10 bg-white">
          <table className="w-full text-left text-[13px] text-[color:var(--color-navy)]">
            <thead className="bg-[color:var(--color-navy)]/[0.04] font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
              <tr>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Teléfono</th>
                <th className="px-3 py-2.5">Tags</th>
                <th className="px-3 py-2.5 text-right">Pedidos</th>
                <th className="px-3 py-2.5 text-right">Total USD</th>
                <th className="px-3 py-2.5">Último</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.phone}
                  className="border-t border-[color:var(--color-navy)]/8 transition-colors hover:bg-[color:var(--color-navy)]/[0.03]"
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium">
                      {c.name ?? (
                        <em className="text-[color:var(--color-navy)]/45">
                          sin nombre
                        </em>
                      )}
                    </div>
                    {c.firstOrderAt && (
                      <div className="font-mono text-[10px] text-[color:var(--color-navy)]/45">
                        Desde{" "}
                        {c.firstOrderAt.toLocaleDateString("es-CU")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px]">
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[color:var(--color-navy)]/85 hover:underline"
                    >
                      {c.phone}
                    </a>
                  </td>
                  <td className="px-3 py-2.5">
                    {c.tags.length === 0 ? (
                      <span className="font-mono text-[10px] text-[color:var(--color-navy)]/35">
                        —
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-full bg-[color:var(--color-cream-warm)]/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/85"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[13px]">
                    <strong>{c.ordersCount}</strong>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[color:var(--color-navy)]/85">
                    ${(c.totalUsdCents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[color:var(--color-navy)]/65">
                    {c.lastOrderAt
                      ? c.lastOrderAt.toLocaleDateString("es-CU", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/admin/clientes/${encodeURIComponent(c.phone)}`}
                      className="inline-flex h-8 items-center rounded-full border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04]"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
