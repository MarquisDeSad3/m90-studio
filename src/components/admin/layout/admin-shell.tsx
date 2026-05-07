"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import { AdminBottomNav } from "./admin-bottom-nav";
import { AdminMobileDrawer } from "./admin-mobile-drawer";
import type { AdminNavBadges } from "@/lib/admin-nav";

export function AdminShell({
  role,
  adminName,
  badges,
  children,
}: {
  role: "owner" | "manager" | "staff";
  adminName: string;
  badges: AdminNavBadges;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[color:var(--color-paper)]">
      <AdminSidebar role={role} badges={badges} adminName={adminName} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          adminName={adminName}
          onOpenMobileNav={() => setDrawerOpen(true)}
        />
        <main className="flex-1 pb-20 lg:pb-6">{children}</main>
      </div>

      <AdminBottomNav role={role} badges={badges} />
      <AdminMobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
        badges={badges}
        adminName={adminName}
      />
    </div>
  );
}
