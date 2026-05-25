import NextAuth from "next-auth";
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

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Carga inicial al iniciar sesión
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.email = u.email; // Aseguramos guardar el email en el JWT
      }
      // Opcional: Si actualizas la sesión desde el frontend usando session.update()
      if (trigger === "update" && session?.user) {
        if (session.user.firstName) token.firstName = session.user.firstName;
        if (session.user.lastName) token.lastName = session.user.lastName;
        if (session.user.email) token.email = session.user.email; // ¡ESTO CORRIGE EL REFLEJO DEL CORREO!
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.email = token.email as string; // Aseguramos que la sesión tenga el email
      }
      return session;
    },
    async signIn({ user }) {
      if (user && "isActive" in user && !(user as any).isActive) {
        throw new Error("inactive_user");
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});