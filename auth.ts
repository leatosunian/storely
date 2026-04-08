import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDB from "@/lib/db/db";
import AdminModel from "@/lib/db/models/admin";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          await connectDB();
          const userExists = await AdminModel.findOne({
            username: credentials?.username,
          }).select("+password");
          if (!userExists) return null;
          if (credentials?.password !== userExists.password) return null;
          return {
            id: userExists._id?.toString() ?? "",
            name: userExists.name,
            surname: userExists.surname,
            username: userExists.username,
            uuid: userExists.uuid,
            role: userExists.role,
          } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
});
