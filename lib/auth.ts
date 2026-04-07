import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
        if (!user) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        // Retornamos el usuario completo (incluyendo isActive)
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user }) {
      // Aquí validamos el estado ACTIVO
      // 'user' es lo que retornó el authorize de arriba
      if (user && "isActive" in user && !user.isActive) {
        // Al lanzar un error con un string específico aquí, 
        // NextAuth lo enviará a la URL o al result.error
        throw new Error("inactive_user");
      }
      return true; // Permitir el ingreso
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
