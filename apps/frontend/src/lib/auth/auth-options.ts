import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password_hash) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordsMatch) {
          return null;
        }

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
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT CB: user", user);
      console.log("JWT CB: token", token);
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.managerId = user.managerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        const user = await prisma.user.findUnique({ where: { id: parseInt(token.id as string, 10) } });
        if (user) {
          session.user.id = user.id.toString();
          session.user.role = user.role;
          session.user.managerId = user.managerId ? user.managerId.toString() : null;
          session.user.email = user.email;
        }
      }
      return session;
    },
  },
};
