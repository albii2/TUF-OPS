import NextAuth, { DefaultSession } from "next-auth"
import type { AppRole, AppSessionUser } from "@/types/auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: AppSessionUser
  }

  interface User {
    /** The user's id. */
    id: string;
    /** The user's role. */
    role: AppRole
    managerId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole
    managerId?: string | null
  }
}
