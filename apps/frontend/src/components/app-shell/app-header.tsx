import type { AppSessionUser } from "@/types/auth";
import { NavUser } from "./nav-user";

export function AppHeader({ 
  title,
  user,
}: {
  title: string;
  user: AppSessionUser;
}) {
  return (
    <header className="border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <NavUser user={user} />
      </div>
    </header>
  );
}
