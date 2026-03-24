import { requireSession } from "@/lib/auth/session";
import { AppShellClient } from "@/components/app-shell/app-shell-client";

export default async function AppLayout({ 
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <AppShellClient user={session.user}>
      {children}
    </AppShellClient>
  );
}
