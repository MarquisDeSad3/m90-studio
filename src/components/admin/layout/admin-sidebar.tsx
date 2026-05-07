"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  getDesktopNavItems,
  isItemActive,
  type AdminNavBadges,
} from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "m90-admin-sidebar-collapsed";

export function AdminSidebar({
  role,
  badges,
  adminName,
}: {
  role: "owner" | "manager" | "staff";
  badges: AdminNavBadges;
  adminName: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const items = getDesktopNavItems(role);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-[color:var(--color-navy)]/10 bg-white transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
      aria-label="Navegación admin"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-[color:var(--color-navy)]/8 px-4",
          collapsed ? "justify-center px-2" : "justify-between",
        )}
      >
        <Link
          href="/admin/pedidos"
          className="flex items-center gap-2 text-[color:var(--color-navy)]"
        >
          <Logo
            variant="navy"
            className={cn("transition-all", collapsed ? "text-[22px]" : "text-[22px]")}
          />
          {!collapsed && (
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-navy-500)]">
              Admin
            </span>
          )}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isItemActive(item, pathname);
            const Icon = item.icon;
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
            const showBadge = !!badgeCount && badgeCount > 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[color:var(--color-navy)] text-[color:var(--color-cream-soft)]"
                      : "text-[color:var(--color-navy)]/70 hover:bg-[color:var(--color-navy)]/[0.06] hover:text-[color:var(--color-navy)]",
                    collapsed && "justify-center px-2",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className="h-4.5 w-4.5 flex-shrink-0"
                    strokeWidth={active ? 2.4 : 2}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {showBadge && (
                    <span
                      className={cn(
                        "ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold",
                        active
                          ? "bg-[color:var(--color-cream-soft)]/25 text-[color:var(--color-cream-soft)]"
                          : "bg-amber-100 text-amber-800",
                        collapsed &&
                          "absolute right-1 top-1 ml-0 min-w-0 px-1 leading-none",
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

      {/* Footer: user + collapse toggle */}
      <div className="border-t border-[color:var(--color-navy)]/8 p-3">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-[color:var(--color-navy)]">
                {adminName}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
                {role}
              </p>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label="Colapsar sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--color-navy)]/55 hover:bg-[color:var(--color-navy)]/[0.06] hover:text-[color:var(--color-navy)]"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggle}
            aria-label="Expandir sidebar"
            className="mx-auto flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--color-navy)]/55 hover:bg-[color:var(--color-navy)]/[0.06] hover:text-[color:var(--color-navy)]"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Hide hydration mismatch flicker */}
      {!mounted && <span className="sr-only">loading</span>}
    </aside>
  );
}
