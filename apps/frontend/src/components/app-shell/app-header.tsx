import type { AppSessionUser } from "@/types/auth";
import { NavUser } from "./nav-user";

export function AppHeader({ 
  title,
  user,
  actions,
}: {
  title: string;
  user: AppSessionUser;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-4">
          {actions}
          <NavUser user={user} />
        </div>
      </div>
    </header>
  );
}
