import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "gym-app-ultra-secure-jwt-auth-secret-key-32-chars-min";

export const authConfig = {
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: { signIn: "/sign-in" },
  trustHost: true,
  secret: AUTH_SECRET,
  providers: [
    Credentials({
      name: "Gym Login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;
        const identifier = String(credentials.phone).trim();
        const password = String(credentials.password);

        try {
          // Find user by phone or email
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { phone: identifier },
                { email: identifier },
              ],
            },
            include: {
              staffProfile: true,
              memberProfile: true,
            },
          });

          // If not found by direct phone/email, check employeeCode or membershipCode
          if (!user) {
            const staff = await prisma.staffProfile.findUnique({
              where: { employeeCode: identifier },
              include: { user: true },
            });
            if (staff?.user) user = staff.user;
          }

          if (!user) {
            const member = await prisma.memberProfile.findUnique({
              where: { membershipCode: identifier },
              include: { user: true },
            });
            if (member?.user) user = member.user;
          }

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
