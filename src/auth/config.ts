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
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl ?? null;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string; firstName?: string; avatarUrl?: string | null; mustChangePassword?: boolean }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { firstName?: string }).firstName = token.firstName as string;
        (session.user as { avatarUrl?: string | null }).avatarUrl = token.avatarUrl as string | null;
        (session.user as { mustChangePassword?: boolean }).mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
  providers: [], // providers added in auth/index.ts
};

