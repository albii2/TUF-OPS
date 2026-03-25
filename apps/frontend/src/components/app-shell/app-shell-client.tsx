"use client";

import { usePathname } from "next/navigation";
import type { AppSessionUser } from "@/types/auth";
import { AppShell } from "./app-shell";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { getPageTitle } from "@/lib/utils/get-page-title";

export function AppShellClient({ 
  user,
  children,
}: {
  user: AppSessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <AppShell
      sidebar={<AppSidebar role={user.role} pathname={pathname} />}
      header={<AppHeader title={title} user={user} />}
    >
      {children}
    </AppShell>
  );
}
