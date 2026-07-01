import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js configuration shared between the full server instance
// (src/auth.ts) and the middleware. It must NOT import Node-only modules
// (Prisma, argon2) so it can run on the edge runtime.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // real providers are added in src/auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "MEMBER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "MEMBER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
