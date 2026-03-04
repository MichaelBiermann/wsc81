import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./config";

const adminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  providerType: z.literal("user"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Provider 1: Admin (existing)
    Credentials({
      id: "admin-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = adminSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const admin = await prisma.adminUser.findUnique({
          where: { email: parsed.data.email },
        });
        if (!admin) return null;

        const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);
        if (!valid) return null;

        return { id: admin.id, email: admin.email, name: admin.name, role: "admin", firstName: admin.name.split(" ")[0] };
      },
    }),
    // Provider 2: Public user accounts
    Credentials({
      id: "user-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        providerType: { type: "hidden" },
      },
      async authorize(credentials) {
        const parsed = userSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        if (!user.emailVerified) {
          const err = new CredentialsSignin("EMAIL_NOT_VERIFIED");
          err.code = "EMAIL_NOT_VERIFIED";
          throw err;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        const role = user.memberId ? "member" : "user";
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          avatarUrl: user.avatarUrl ?? null,
          role,
        };
      },
    }),
  ],
});
