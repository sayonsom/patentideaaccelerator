"use server";

import { prisma } from "@/lib/prisma";
import type {
  Organization,
  OrgMember,
  OrgRole,
  OrgInvite,
} from "@/lib/types";
import type {
  Organization as PrismaOrganization,
  OrgMember as PrismaOrgMember,
  OrgInvite as PrismaOrgInvite,
} from "@prisma/client";

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Generate a URL-friendly slug from an organization name.
 * Lowercases, replaces spaces with hyphens, strips non-alphanumeric
 * characters (except hyphens), and appends a random 4-char suffix.
 */
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `${base}-${suffix}`;
}

/**
 * Generate an 8-character uppercase alphanumeric invite code.
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Mappers ────────────────────────────────────────────────────

function mapPrismaToOrganization(row: PrismaOrganization): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapPrismaToOrgMember(
  row: PrismaOrgMember & { user?: { id: string; name: string; email: string } }
): OrgMember {
  return {
    orgId: row.orgId,
    userId: row.userId,
    role: row.role as OrgRole,
    joinedAt: row.joinedAt.toISOString(),
    ...(row.user
      ? { user: { id: row.user.id, name: row.user.name, email: row.user.email } }
      : {}),
  };
}

function mapPrismaToOrgInvite(row: PrismaOrgInvite): OrgInvite {
  return {
    id: row.id,
    orgId: row.orgId,
    email: row.email,
    role: row.role as OrgRole,
    code: row.code,
    expiresAt: row.expiresAt.toISOString(),
    used: row.used,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── Read Actions ───────────────────────────────────────────────

export async function findOrgByDomain(
  domain: string
): Promise<Organization | null> {
  const row = await prisma.organization.findUnique({ where: { domain } });
  return row ? mapPrismaToOrganization(row) : null;
}

export async function findOrgBySlug(
  slug: string
): Promise<Organization | null> {
  const row = await prisma.organization.findUnique({ where: { slug } });
  return row ? mapPrismaToOrganization(row) : null;
}

export async function getOrganization(
  orgId: string
): Promise<Organization | null> {
  const row = await prisma.organization.findUnique({ where: { id: orgId } });
  return row ? mapPrismaToOrganization(row) : null;
}

// ─── Write Actions ──────────────────────────────────────────────

export async function createOrganization(data: {
  name: string;
  slug?: string;
  domain?: string;
  creatorId: string;
}): Promise<Organization> {
  const slug = data.slug ?? generateSlug(data.name);

  const row = await prisma.organization.create({
    data: {
      name: data.name,
      slug,
      domain: data.domain ?? null,
      members: {
        create: {
          userId: data.creatorId,
          role: "business_admin",
        },
      },
    },
  });

  return mapPrismaToOrganization(row);
}

// ─── Member Actions ─────────────────────────────────────────────

export async function addOrgMember(
  orgId: string,
  userId: string,
  role: OrgRole = "member"
): Promise<OrgMember> {
  const row = await prisma.orgMember.create({
    data: { orgId, userId, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return mapPrismaToOrgMember(row);
}

export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const rows = await prisma.orgMember.findMany({
    where: { orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return rows.map(mapPrismaToOrgMember);
}

export async function updateOrgMemberRole(
  orgId: string,
  userId: string,
  newRole: OrgRole
): Promise<OrgMember> {
  const row = await prisma.orgMember.update({
    where: { orgId_userId: { orgId, userId } },
    data: { role: newRole },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return mapPrismaToOrgMember(row);
}

export async function removeOrgMember(
  orgId: string,
  userId: string
): Promise<void> {
  await prisma.orgMember.delete({
    where: { orgId_userId: { orgId, userId } },
  });
}

// ─── Invite Actions ─────────────────────────────────────────────

export async function createOrgInvite(
  orgId: string,
  email?: string,
  role: OrgRole = "member"
): Promise<OrgInvite> {
  const code = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const row = await prisma.orgInvite.create({
    data: {
      orgId,
      email: email ?? null,
      role,
      code,
      expiresAt,
    },
  });

  return mapPrismaToOrgInvite(row);
}

export async function redeemOrgInvite(
  code: string,
  userId: string
): Promise<{ success: boolean; orgId?: string }> {
  const invite = await prisma.orgInvite.findUnique({ where: { code } });

  if (!invite) {
    return { success: false };
  }

  if (invite.used) {
    return { success: false };
  }

  if (invite.expiresAt < new Date()) {
    return { success: false };
  }

  // Add user as org member with the invite's role and mark invite as used
  await prisma.$transaction([
    prisma.orgMember.create({
      data: {
        orgId: invite.orgId,
        userId,
        role: invite.role,
      },
    }),
    prisma.orgInvite.update({
      where: { id: invite.id },
      data: { used: true },
    }),
  ]);

  return { success: true, orgId: invite.orgId };
}

export async function listOrgInvites(orgId: string): Promise<OrgInvite[]> {
  const now = new Date();

  const rows = await prisma.orgInvite.findMany({
    where: {
      orgId,
      used: false,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapPrismaToOrgInvite);
}

export async function revokeOrgInvite(inviteId: string): Promise<void> {
  await prisma.orgInvite.delete({ where: { id: inviteId } });
}
