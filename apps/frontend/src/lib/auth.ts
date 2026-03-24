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
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        console.log("[AUTH] authorize called", { email });

        if (!email || !password) {
          console.log("[AUTH] missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        console.log("[AUTH] user found?", !!user);

        if (!user || !user.password_hash) {
          console.log("[AUTH] user missing or no password_hash");
          return null;
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        console.log("[AUTH] password valid?", valid);

        if (!valid) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.full_name ?? user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};
