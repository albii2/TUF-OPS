import NextAuth, { DefaultSession } from "next-auth"
import type { AppRole } from "@/types/auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role. */
      role: AppRole
      managerId?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    /** The user's role. */
    role: AppRole
    managerId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: AppRole
    managerId?: string | null
  }
}
