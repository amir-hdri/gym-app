import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authConfig = {
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: { signIn: "/sign-in" },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Phone login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;
        const phone = String(credentials.phone).trim();
        const password = String(credentials.password);
        try {
          const user = await prisma.user.findUnique({
            where: { phone },
          });
          if (!user || !user.isActive || !user.passwordHash) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;
          return {
            id: user.id,
            name: user.name,
            email: user.email || undefined,
            phone: user.phone,
            role: user.role,
            branchId: user.branchId,
          } as any;
        } catch (e) {
          console.error("[auth] authorize error", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone;
        token.branchId = user.branchId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub ?? token.id ?? "";
        (session.user as any).role = token.role;
        (session.user as any).phone = token.phone;
        (session.user as any).branchId = token.branchId;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
