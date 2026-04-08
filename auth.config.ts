import type { NextAuthConfig } from "next-auth";

export interface IAdminSession {
  name: string;
  surname: string;
  username: string;
  uuid: string;
  role: "ADMIN" | "EMPLOYEE";
}

export const authConfig = {
  providers: [],
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/admin/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) token.user = user;
      return token;
    },
    session({ session, token }: any) {
      session.user = token.user as IAdminSession;
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
} satisfies NextAuthConfig;
