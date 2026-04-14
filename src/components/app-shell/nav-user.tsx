"use client";

import { signOut } from "next-auth/react";
import type { AppSessionUser } from "@/types/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavUser({ user }: { user: AppSessionUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
        <div className="text-right">
          <div className="text-sm font-medium">{user.name ?? "User"}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
