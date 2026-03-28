import { DefaultSession } from "next-auth";
import type { AppRole } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      managerId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AppRole;
    managerId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    managerId?: string | null;
  }
}
