import type { AppSessionUser } from "@/types/auth";

export function NavUser({ user }: { user: AppSessionUser }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-medium">{user.name ?? "User"}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </div>
    </div>
  );
}
