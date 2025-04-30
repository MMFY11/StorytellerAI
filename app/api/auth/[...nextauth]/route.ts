import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const [rows]: any = await pool.query(
          "SELECT id, name, email, password, role FROM users WHERE email = ?",
          [credentials.email]
        );
        if (Array.isArray(rows) && rows.length) {
          const user = rows[0];
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (valid) {
            return {
              id:   user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role, // "reader" or "creator"
            };
          }
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.sub!;
        session.user.role = token.role as "reader" | "creator";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error:  "/auth/error",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
