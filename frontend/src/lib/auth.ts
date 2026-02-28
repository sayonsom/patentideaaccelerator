import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import CognitoProvider from "next-auth/providers/cognito";
import { prisma } from "@/lib/prisma";
import type { OrgRole } from "@/lib/types";
import {
  hashPassword,
  validatePasswordPolicy,
  verifyPassword,
} from "@/lib/password";

// ─── Personal email domains (not corporate) ────────────────────
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in",
  "hotmail.com", "outlook.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com", "pm.me",
  "aol.com", "zoho.com", "yandex.com", "mail.com",
  "tutanota.com", "fastmail.com", "hey.com",
]);

export function isPersonalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !domain || PERSONAL_DOMAINS.has(domain);
}

export function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

// ─── RBAC cache (avoid DB queries on every request) ─────────────
interface RbacData {
  orgId: string | null;
  orgSlug: string | null;
  orgRole: OrgRole | null;
  teamIds: string[];
  onboardingComplete: boolean;
  accountType: string;
}

const rbacCache = new Map<string, { data: RbacData; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchRbacData(userId: string): Promise<RbacData> {
  const cached = rbacCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingComplete: true,
      accountType: true,
      orgMemberships: {
        select: { orgId: true, role: true, org: { select: { slug: true } } },
        take: 1, // user belongs to at most one org
      },
      teamMemberships: {
        select: { teamId: true },
      },
    },
  });

  if (!user) {
    return {
      orgId: null, orgSlug: null, orgRole: null,
      teamIds: [], onboardingComplete: false, accountType: "personal",
    };
  }

  const orgMembership = user.orgMemberships[0] ?? null;
  const data: RbacData = {
    orgId: orgMembership?.orgId ?? null,
    orgSlug: orgMembership?.org.slug ?? null,
    orgRole: (orgMembership?.role as OrgRole) ?? null,
    teamIds: user.teamMemberships.map((tm) => tm.teamId),
    onboardingComplete: user.onboardingComplete,
    accountType: user.accountType,
  };

  rbacCache.set(userId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

/** Invalidate RBAC cache for a user (call after role/team changes). */
export function invalidateRbacCache(userId: string) {
  rbacCache.delete(userId);
}

// ─── Build providers list ──────────────────────────────────────
const providers: NextAuthOptions["providers"] = [];

// Cognito — only enabled when all three env vars are set
if (
  process.env.COGNITO_CLIENT_ID &&
  process.env.COGNITO_CLIENT_SECRET &&
  process.env.COGNITO_ISSUER
) {
  providers.push(
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID,
      clientSecret: process.env.COGNITO_CLIENT_SECRET,
      issuer: process.env.COGNITO_ISSUER,
    })
  );
}

// Credentials — email + password auth
providers.push(
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "you@company.com" },
      password: { label: "Password", type: "password" },
      name: { label: "Name", type: "text", placeholder: "Your name" },
      mode: { label: "Mode", type: "text" }, // "signup" | "login"
    },
    async authorize(credentials) {
      if (!credentials?.email) return null;

      const email = credentials.email.trim().toLowerCase();
      const password = credentials.password ?? "";
      const mode = credentials.mode === "signup" ? "signup" : "login";
      const name = credentials.name?.trim() || email.split("@")[0];
      const accountType = isPersonalEmail(email) ? "personal" : "corporate";
      if (!password) {
        throw new Error("Password is required.");
      }

      // Explicit signup path — creates local password auth user.
      if (mode === "signup") {
        const policyError = validatePasswordPolicy(password);
        if (policyError) throw new Error(policyError);

        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true, cognitoSub: true },
        });

        if (existing?.cognitoSub) {
          throw new Error("This account uses Single Sign-On.");
        }

        // Existing "orphaned" rows (no password + no SSO link) can be claimed
        // via signup to recover access without direct DB intervention.
        if (existing?.passwordHash) {
          throw new Error("An account with this email already exists.");
        }
        if (existing) {
          const passwordHash = await hashPassword(password);
          const updated = await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: existing.name?.trim() ? existing.name : name,
              passwordHash,
              accountType,
            },
          });
          invalidateRbacCache(existing.id);
          return { id: updated.id, email: updated.email, name: updated.name };
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
          data: {
            email,
            name,
            passwordHash,
            interests: [],
            accountType,
            onboardingComplete: false,
          },
        });
        return { id: user.id, email: user.email, name: user.name };
      }

      // Login path — verifies existing local password hash.
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, passwordHash: true, cognitoSub: true },
      });
      if (!user) {
        throw new Error("Invalid email or password.");
      }
      if (!user.passwordHash) {
        if (user.cognitoSub) {
          throw new Error("This account uses Single Sign-On.");
        }
        throw new Error("Password login is not set up for this account. Please reset your credentials.");
      }
      const passwordOk = await verifyPassword(password, user.passwordHash);
      if (!passwordOk) {
        throw new Error("Invalid email or password.");
      }
      return { id: user.id, email: user.email, name: user.name };
    },
  })
);

// ─── NextAuth config ───────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers,

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    /** On sign-in, reconcile OAuth identities with existing users. */
    async signIn({ user, account }) {
      if (!account || !user.email) return true;

      // Credentials provider — user handled in authorize()
      if (account.provider === "credentials") return true;

      // OAuth providers (Cognito)
      const sub = account.providerAccountId;
      const accountType = isPersonalEmail(user.email) ? "personal" : "corporate";
      const existingBySub = await prisma.user.findUnique({
        where: { cognitoSub: sub },
      });

      if (existingBySub) return true;

      const existingByEmail = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, cognitoSub: true },
      });

      if (existingByEmail) {
        // If this email is already linked to another IdP subject, reject linkage.
        if (existingByEmail.cognitoSub && existingByEmail.cognitoSub !== sub) {
          return false;
        }
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { cognitoSub: sub, accountType },
        });
        invalidateRbacCache(existingByEmail.id);
        return true;
      }

      await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? user.email.split("@")[0],
            cognitoSub: sub,
            interests: [],
            accountType,
            onboardingComplete: false,
          },
      });

      return true;
    },

    /**
     * Attach database user ID + RBAC data to the JWT.
     */
    async jwt({ token, account, user, trigger }) {
      // Credentials provider — user.id IS the database UUID
      if (account?.provider === "credentials" && user) {
        token.dbUserId = user.id;
      }

      // OAuth provider — store providerAccountId on first sign-in
      if (account && account.provider !== "credentials") {
        token.sub = account.providerAccountId;
      }

      // Resolve database user ID from cognitoSub (OAuth flow)
      if (token.sub && !token.dbUserId) {
        const dbUser = await prisma.user.findUnique({
          where: { cognitoSub: token.sub },
          select: { id: true },
        });
        if (dbUser) {
          token.dbUserId = dbUser.id;
        }
      }

      // When updateSession() is called from client, force-refresh RBAC
      // data from DB. This is critical on serverless (Vercel) where
      // in-memory cache invalidation doesn't cross Lambda boundaries.
      if (trigger === "update" && token.dbUserId) {
        invalidateRbacCache(token.dbUserId as string);
      }

      // Embed RBAC data into JWT
      if (token.dbUserId) {
        const rbac = await fetchRbacData(token.dbUserId as string);
        token.orgId = rbac.orgId;
        token.orgSlug = rbac.orgSlug;
        token.orgRole = rbac.orgRole;
        token.teamIds = rbac.teamIds;
        token.onboardingComplete = rbac.onboardingComplete;
        token.accountType = rbac.accountType;
      }

      return token;
    },

    /**
     * Expose the database user ID + RBAC data on the session object.
     */
    async session({ session, token }) {
      if (session.user) {
        if (token.dbUserId) session.user.id = token.dbUserId as string;
        session.user.orgId = (token.orgId as string) ?? null;
        session.user.orgSlug = (token.orgSlug as string) ?? null;
        session.user.orgRole = (token.orgRole as OrgRole) ?? null;
        session.user.teamIds = (token.teamIds as string[]) ?? [];
        session.user.onboardingComplete = (token.onboardingComplete as boolean) ?? false;
        session.user.accountType = (token.accountType as string) ?? "personal";
      }
      return session;
    },
  },
};

// ─── Extend NextAuth types ──────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      orgId: string | null;
      orgSlug: string | null;
      orgRole: OrgRole | null;
      teamIds: string[];
      onboardingComplete: boolean;
      accountType: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    dbUserId?: string;
    orgId?: string | null;
    orgSlug?: string | null;
    orgRole?: OrgRole | null;
    teamIds?: string[];
    onboardingComplete?: boolean;
    accountType?: string;
  }
}

// ─── Server-side session helpers ─────────────────────────────────

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

/**
 * Require a specific org role. Throws if user doesn't have the role.
 */
export async function requireOrgRole(requiredRole: OrgRole) {
  const session = await requireAuth();
  const roleHierarchy: Record<OrgRole, number> = {
    business_admin: 3,
    team_admin: 2,
    member: 1,
  };
  if (!session.user.orgRole || roleHierarchy[session.user.orgRole] < roleHierarchy[requiredRole]) {
    throw new Error(`Requires ${requiredRole} role`);
  }
  return session;
}
