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
        console.log("AUTHORIZE: Credentials received:", credentials);
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          console.log("AUTHORIZE: Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        console.log("AUTHORIZE: User found in DB:", user);

        if (!user || !user.password_hash) {
          console.log("AUTHORIZE: User not found or no password hash");
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password_hash);
        console.log("AUTHORIZE: Passwords match:", passwordsMatch);

        if (!passwordsMatch) {
          console.log("AUTHORIZE: Passwords do not match");
          return null;
        }

        const authorizedUser = {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          managerId: user.managerId ? user.managerId.toString() : null,
        };

        console.log("AUTHORIZE: Returning authorized user:", authorizedUser);
        return authorizedUser;
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
        const user = await prisma.user.findUnique({ where: { id: token.id } });
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
