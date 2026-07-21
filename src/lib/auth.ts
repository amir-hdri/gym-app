import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" as const },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      name: "Phone login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone as string },
        });
        if (!user || !user.isActive || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          branchId: user.branchId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone;
        token.branchId = user.branchId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
        session.user.phone = token.phone;
        session.user.branchId = token.branchId;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
