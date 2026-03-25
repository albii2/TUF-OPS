"use client";

import { usePathname } from "next/navigation";
import type { AppSessionUser } from "@/types/auth";
import { AppShell } from "./app-shell";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { getPageTitle } from "@/lib/utils/get-page-title";
import { getPageActions } from "@/lib/utils/get-page-actions.tsx";

export function AppShellClient({ 
  user,
  children,
}: {
  user: AppSessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const actions = getPageActions(pathname);

  return (
    <AppShell
      sidebar={<AppSidebar role={user.role} pathname={pathname} />}
      header={<AppHeader title={title} user={user} actions={actions} />}
    >
      {children}
    </AppShell>
  );
}
