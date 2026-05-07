"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { ADMIN_NAV } from "@/lib/admin-nav";

export function AdminTopbar({
  adminName,
  onOpenMobileNav,
}: {
  adminName: string;
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const current = ADMIN_NAV.find((it) => it.matcher(pathname));
  const title = current?.label ?? "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-[color:var(--color-navy)]/10 bg-[color:var(--color-paper)]/95 px-3 backdrop-blur-md md:px-6">
      {/* Mobile: hamburguesa + título inline */}
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Abrir menú"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg active:bg-[color:var(--color-navy)]/[0.08]"
        >
          <Menu className="h-5 w-5 text-[color:var(--color-navy)]" />
        </button>
        <Link
          href="/admin/pedidos"
          className="flex flex-shrink-0 items-center text-[color:var(--color-navy)]"
        >
          <Logo variant="navy" className="text-[20px]" />
        </Link>
        <span className="ml-1 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
          · {title}
        </span>
      </div>

      {/* Desktop: page title */}
      <div className="hidden min-w-0 flex-1 lg:block">
        <h1 className="font-display text-[20px] italic leading-none text-[color:var(--color-navy)]">
          {title}
        </h1>
      </div>

      {/* Right: admin name (desktop) + logout */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <span className="hidden text-[12px] text-[color:var(--color-navy)]/65 lg:inline">
          {adminName}
        </span>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="rounded-lg px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)] active:bg-[color:var(--color-navy)]/[0.06] md:text-[11px]"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
