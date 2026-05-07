import {
  Bell,
  Contact,
  DollarSign,
  Package,
  Send,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Configuración central de la navegación del admin.
 *
 * Cada item tiene:
 *   - href: ruta (ej. /admin/pedidos)
 *   - label: texto visible
 *   - icon: Lucide icon
 *   - matcher: función que decide si el item está "activo" para una pathname
 *   - ownerOnly: si solo lo ven los owners
 *   - badgeKey: clave del objeto `badges` que pasa el layout (counts dinámicos)
 *
 * Mantener sincronizado con las rutas reales — un item huérfano = link
 * que nos lleva a 404.
 */

export type AdminNavBadgeKey = "telegramPending" | "ordersPending";

export type AdminNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  matcher: (pathname: string) => boolean;
  ownerOnly?: boolean;
  badgeKey?: AdminNavBadgeKey;
};

const startsWith = (prefix: string) => (p: string) =>
  p === prefix || p.startsWith(prefix + "/");

export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    icon: Package,
    matcher: startsWith("/admin/pedidos"),
    badgeKey: "ordersPending",
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    icon: Contact,
    matcher: startsWith("/admin/clientes"),
  },
  {
    href: "/admin/telegram",
    label: "Telegram",
    shortLabel: "Tel.",
    icon: Send,
    matcher: startsWith("/admin/telegram"),
    badgeKey: "telegramPending",
  },
  {
    href: "/admin/precios",
    label: "Precios",
    icon: DollarSign,
    matcher: startsWith("/admin/precios"),
  },
  {
    href: "/admin/modelos",
    label: "Modelos",
    icon: Smartphone,
    matcher: startsWith("/admin/modelos"),
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    icon: Users,
    matcher: startsWith("/admin/usuarios"),
    ownerOnly: true,
  },
];

/** Ítems que aparecen en el bottom nav mobile. Mantener ≤ 5. */
export function getMobileNavItems(role: "owner" | "manager" | "staff") {
  const items = ADMIN_NAV.filter((it) => !it.ownerOnly || role === "owner");
  return items;
}

/** Ítems del sidebar desktop — todos los disponibles para el rol. */
export function getDesktopNavItems(role: "owner" | "manager" | "staff") {
  return ADMIN_NAV.filter((it) => !it.ownerOnly || role === "owner");
}

export type AdminNavBadges = Partial<Record<AdminNavBadgeKey, number>>;

/** Helpers UI */
export function isItemActive(
  item: AdminNavItem,
  pathname: string,
): boolean {
  return item.matcher(pathname);
}

export const NotificationsIcon = Bell;
