import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/validation";

const oauthProviders = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })] : []),
  ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET ? [GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET })] : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash || !user.emailVerified) return null;
        if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl };
      },
    }),
    ...oauthProviders,
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;
      if (!user.email || !account.providerAccountId) return false;

      const linked = await prisma.externalAccount.findUnique({
        where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
        include: { user: true },
      });
      if (linked) {
        user.id = linked.userId;
        user.name = linked.user.name;
        return true;
      }

      const normalizedEmail = user.email.toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) return false;

      const created = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: user.name?.trim() || normalizedEmail.split("@")[0],
          avatarUrl: user.image,
          emailVerified: new Date(),
          externalAccounts: {
            create: { provider: account.provider, providerAccountId: account.providerAccountId, type: account.type },
          },
        },
      });
      user.id = created.id;
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      const publicPath = path === "/login" || path === "/signup" || path === "/forgot-password" || path === "/reset-password" || path === "/verify-email";
      if (publicPath || path.startsWith("/api/auth")) return true;
      return Boolean(session?.user);
    },
  },
});
