
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("--- AUTHORIZE RUNTIME DIAGNOSTIC ---");
        if (!credentials?.email || !credentials.password) {
          console.error("CRITICAL FAILURE: Credentials object missing email or password.", { email: !!credentials?.email, password: !!credentials?.password });
          return null;
        }

        const email = credentials.email.toString().trim().toLowerCase();
        const password = credentials.password.toString();
        console.log(`Authorizing user: ${email}`);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password_hash) {
          console.log("User not found or hash is missing.");
          return null;
        }
        console.log(`User found. Hash: ${user.password_hash}`);

        const passwordsMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`Password match result: ${passwordsMatch}`);

        if (!passwordsMatch) {
          console.log("Password mismatch.");
          return null;
        }

        console.log("Authorization successful.");
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          managerId: user.managerId?.toString() ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.managerId = user.managerId as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.managerId = token.managerId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
