"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getMobileNavItems,
  isItemActive,
  type AdminNavBadges,
} from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

export function AdminBottomNav({
  role,
  badges,
}: {
  role: "owner" | "manager" | "staff";
  badges: AdminNavBadges;
}) {
  const pathname = usePathname();
  const items = getMobileNavItems(role);

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-[color:var(--color-navy)]/10 bg-white/95 pt-1.5 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)" }}
    >
      {items.map((item) => {
        const active = isItemActive(item, pathname);
        const Icon = item.icon;
        const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
        const showBadge = !!badgeCount && badgeCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors",
              active
                ? "text-[color:var(--color-navy)]"
                : "text-[color:var(--color-navy)]/55 active:text-[color:var(--color-navy)]/85",
            )}
          >
            <span className="relative">
              <Icon
                className="h-5 w-5"
                strokeWidth={active ? 2.4 : 1.9}
              />
              {showBadge && (
                <span
                  aria-label={`${badgeCount} pendientes`}
                  className="absolute -right-2.5 -top-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 py-0 font-mono text-[8px] font-bold leading-none text-white"
                >
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </span>
            <span className="text-center font-mono text-[9px] uppercase tracking-[0.14em] leading-tight">
              {item.shortLabel ?? item.label}
            </span>
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-3 top-0 h-[2px] rounded-b-full bg-[color:var(--color-navy)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
