"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  getDesktopNavItems,
  isItemActive,
  type AdminNavBadges,
} from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

export function AdminMobileDrawer({
  open,
  onClose,
  role,
  badges,
  adminName,
}: {
  open: boolean;
  onClose: () => void;
  role: "owner" | "manager" | "staff";
  badges: AdminNavBadges;
  adminName: string;
}) {
  const pathname = usePathname();

  // Cerrar drawer cuando cambia la ruta
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // ESC cierra
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const items = getDesktopNavItems(role);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-[color:var(--color-navy-900)]/55 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[color:var(--color-navy)]/10 bg-white shadow-xl transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-[color:var(--color-navy)]/8 px-4">
          <Link
            href="/admin/pedidos"
            className="flex items-center gap-2 text-[color:var(--color-navy)]"
          >
            <Logo variant="navy" className="text-[22px]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-[color:var(--color-navy)]/[0.06]"
          >
            <X className="h-4.5 w-4.5 text-[color:var(--color-navy)]" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isItemActive(item, pathname);
              const Icon = item.icon;
              const badgeCount = item.badgeKey
                ? badges[item.badgeKey]
                : 0;
              const showBadge = !!badgeCount && badgeCount > 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium transition-colors",
                      active
                        ? "bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]"
                        : "text-[color:var(--color-navy)]/75 hover:bg-[color:var(--color-navy)]/[0.06]",
                    )}
                  >
                    <Icon
                      className="h-5 w-5 flex-shrink-0"
                      strokeWidth={active ? 2.4 : 2}
                    />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span
                        className={cn(
                          "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold",
                          active
                            ? "bg-[color:var(--color-cream-soft)]/25 text-[color:var(--color-cream-soft)]"
                            : "bg-amber-100 text-amber-800",
                        )}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: user info */}
        <div className="border-t border-[color:var(--color-navy)]/8 p-4">
          <p className="text-[13px] font-medium text-[color:var(--color-navy)]">
            {adminName}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
            {role}
          </p>
        </div>
      </div>
    </>
  );
}
