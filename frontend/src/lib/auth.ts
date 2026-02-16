import { getServerSession, type NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER!,
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    /**
     * On sign-in, upsert user in the database.
     * Cognito's `profile.sub` is the stable identifier.
     */
    async signIn({ user, account }) {
      if (!account || !user.email) return true;

      const sub = account.providerAccountId;

      // Check if a user with this cognitoSub already exists
      const existing = await prisma.user.findUnique({
        where: { cognitoSub: sub },
      });

      if (!existing) {
        // Create user on first login
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? user.email.split("@")[0],
            cognitoSub: sub,
            interests: [],
          },
        });
      }

      return true;
    },

    /**
     * Attach database user ID to the JWT so it's available in the session.
     */
    async jwt({ token, account }) {
      // On initial sign-in, account is present — store providerAccountId
      if (account) {
        token.sub = account.providerAccountId;
      }

      // Resolve the database user ID from cognitoSub
      if (token.sub && !token.dbUserId) {
        const dbUser = await prisma.user.findUnique({
          where: { cognitoSub: token.sub },
          select: { id: true },
        });
        if (dbUser) {
          token.dbUserId = dbUser.id;
        }
      }

      return token;
    },

    /**
     * Expose the database user ID on the session object.
     */
    async session({ session, token }) {
      if (token.dbUserId && session.user) {
        session.user.id = token.dbUserId as string;
      }
      return session;
    },
  },
};

/**
 * Get the current NextAuth session (server-side only).
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Require authentication — throws if not authenticated.
 * Use in server components and API routes.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }
  return session;
}

/**
 * Get the authenticated user's database ID.
 * Returns null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}
