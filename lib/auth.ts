import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          const names = (user.name || "").split(" ");
          const firstName = names[0] || "";
          const lastName = names.slice(1).join(" ") || "";

          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              firstName,
              lastName,
              image: user.image,
              password: await bcrypt.hash(globalThis.crypto.randomUUID(), 10),
              role: Role.CLIENTE,
              isActive: true,
            },
          });

          user.id = newUser.id;
          (user as any).role = newUser.role;
          (user as any).firstName = newUser.firstName;
          (user as any).lastName = newUser.lastName;
        } else {
          if (!existingUser.isActive) {
            throw new Error("inactive_user");
          }
          user.id = existingUser.id;
          (user as any).role = existingUser.role;
          (user as any).firstName = existingUser.firstName;
          (user as any).lastName = existingUser.lastName;
        }
      }

      if (account?.provider === "credentials") {
        if (user && "isActive" in user && !(user as any).isActive) {
          throw new Error("inactive_user");
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.email = u.email;
      }
      if (trigger === "update" && session?.user) {
        if (session.user.firstName) token.firstName = session.user.firstName;
        if (session.user.lastName) token.lastName = session.user.lastName;
        if (session.user.email) token.email = session.user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
