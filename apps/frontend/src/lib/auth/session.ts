import { redirect } from "next/navigation";
import { getAuthSession } from "./auth";
import type { AppRole } from "@/types/auth";

export async function requireSession() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return session;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const session = await requireSession();
  const userRole = session.user.role;

  if (!allowedRoles.includes(userRole)) {
    redirect("/forbidden");
  }

  return session;
}
