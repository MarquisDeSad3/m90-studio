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
    <header className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-[color:var(--color-navy)]/10 bg-[color:var(--color-paper)]/95 px-4 backdrop-blur-md md:px-6">
      {/* Mobile: hamburguesa + logo small */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-[color:var(--color-navy)]/[0.06]"
        >
          <Menu className="h-5 w-5 text-[color:var(--color-navy)]" />
        </button>
        <Link
          href="/admin/pedidos"
          className="flex items-center gap-2 text-[color:var(--color-navy)]"
        >
          <Logo variant="navy" className="text-[20px]" />
        </Link>
      </div>

      {/* Desktop: page title */}
      <div className="hidden flex-1 lg:block">
        <h1 className="font-display text-[18px] italic leading-none text-[color:var(--color-navy)]">
          {title}
        </h1>
      </div>

      {/* Mobile: page title centered */}
      <div className="flex-1 text-center lg:hidden">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-navy)]/65">
          {title}
        </span>
      </div>

      {/* Right: admin name + logout */}
      <div className="flex items-center gap-3">
        <span className="hidden text-[12px] text-[color:var(--color-navy)]/65 md:inline">
          {adminName}
        </span>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55 hover:text-[color:var(--color-navy)] md:text-[11px]"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
