// Shared auth config — no Node.js-only imports here (used in Edge middleware)
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminArea = nextUrl.pathname.startsWith("/admin");
      const isLoginPage = nextUrl.pathname === "/admin/login";

      if (isAdminArea && !isLoginPage) {
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.firstName = (user as { firstName?: string }).firstName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string; firstName?: string }).id = token.id as string;
        (session.user as { role?: string; firstName?: string }).role = token.role as string;
        (session.user as { role?: string; firstName?: string }).firstName = token.firstName as string;
      }
      return session;
    },
  },
  providers: [], // providers added in auth/index.ts
};

