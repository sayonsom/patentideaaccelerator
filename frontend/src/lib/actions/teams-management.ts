"use server";

import { prisma } from "@/lib/prisma";
import { invalidateRbacCache } from "@/lib/auth";
import {
  requireSession,
  requireTeamMember,
  requireTeamAdmin,
  ForbiddenError,
} from "@/lib/actions/authorization";
import type { VoltEdgeTeam, TeamMemberRecord, TeamRole, TeamInvite } from "@/lib/types";
import type {
  Team as PrismaTeam,
  TeamMember as PrismaTeamMember,
  TeamInvite as PrismaTeamInvite,
  User as PrismaUser,
} from "@prisma/client";

// ─── Helpers ────────────────────────────────────────────────────

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

function mapPrismaToVoltEdgeTeam(
  row: PrismaTeam & { _count?: { members: number } }
): VoltEdgeTeam {
  return {
    id: row.id,
    name: row.name,
    orgId: row.orgId ?? null,
    memberCount: row._count?.members,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapPrismaToTeamInvite(row: PrismaTeamInvite): TeamInvite {
  return {
    id: row.id,
    teamId: row.teamId,
    email: row.email,
    role: row.role as TeamRole,
    code: row.code,
    expiresAt: row.expiresAt.toISOString(),
    used: row.used,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPrismaToTeamMemberRecord(
  row: PrismaTeamMember & { user?: PrismaUser }
): TeamMemberRecord {
  return {
    teamId: row.teamId,
    userId: row.userId,
    role: row.role as TeamRole,
    joinedAt: row.joinedAt.toISOString(),
    user: row.user
      ? { id: row.user.id, name: row.user.name, email: row.user.email }
      : undefined,
  };
}

// ─── Team CRUD ──────────────────────────────────────────────────

/**
 * Create a new team. The current session user becomes the team admin.
 *
 * @secured — Requires authentication. creatorId MUST match session user.
 */
export async function createTeam(data: {
  name: string;
  orgId?: string | undefined;
  creatorId: string;
}): Promise<VoltEdgeTeam> {
  const { userId } = await requireSession();

  // Ensure the caller can only create teams for themselves
  if (data.creatorId !== userId) {
    throw new ForbiddenError("team");
  }

  const team = await prisma.team.create({
    data: {
      name: data.name,
      ...(data.orgId ? { orgId: data.orgId } : {}),
      members: {
        create: {
          userId: data.creatorId,
          role: "admin",
        },
      },
    },
    include: { _count: { select: { members: true } } },
  });

  // Invalidate RBAC cache so teamIds[] is refreshed on next request
  invalidateRbacCache(userId);

  return mapPrismaToVoltEdgeTeam(team);
}

/**
 * Get a team by ID.
 *
 * @secured — Requires team membership.
 */
export async function getTeamById(
  teamId: string
): Promise<VoltEdgeTeam | null> {
  await requireTeamMember(teamId);

  const row = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { members: true } } },
  });
  return row ? mapPrismaToVoltEdgeTeam(row) : null;
}

/**
 * List teams the current session user belongs to.
 *
 * @secured — Requires authentication. Only returns caller's own teams.
 */
export async function listTeamsForUser(
  userId: string
): Promise<VoltEdgeTeam[]> {
  const { userId: sessionUserId } = await requireSession();

  // Users can only list their own teams
  if (userId !== sessionUserId) {
    throw new ForbiddenError("user data");
  }

  const rows = await prisma.team.findMany({
    where: {
      members: { some: { userId } },
    },
    include: { _count: { select: { members: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapPrismaToVoltEdgeTeam);
}

/**
 * List teams for an organization.
 *
 * @secured — Requires authentication. Caller must belong to the org.
 */
export async function listTeamsForOrg(orgId: string): Promise<VoltEdgeTeam[]> {
  const { session } = await requireSession();

  // Caller must belong to this org
  if (session.user.orgId !== orgId) {
    throw new ForbiddenError("organization");
  }

  const rows = await prisma.team.findMany({
    where: { orgId },
    include: { _count: { select: { members: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapPrismaToVoltEdgeTeam);
}

/**
 * Update a team's details (e.g. name).
 *
 * @secured — Requires team admin role.
 */
export async function updateTeam(
  teamId: string,
  updates: { name?: string }
): Promise<VoltEdgeTeam> {
  await requireTeamAdmin(teamId);

  const row = await prisma.team.update({
    where: { id: teamId },
    data: updates,
    include: { _count: { select: { members: true } } },
  });
  return mapPrismaToVoltEdgeTeam(row);
}

/**
 * Delete a team entirely.
 *
 * @secured — Requires team admin role.
 */
export async function deleteTeam(teamId: string): Promise<void> {
  await requireTeamAdmin(teamId);

  // Get all member userIds before deletion to invalidate their caches
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  });

  await prisma.team.delete({ where: { id: teamId } });

  // Invalidate RBAC cache for all affected members
  for (const member of members) {
    invalidateRbacCache(member.userId);
  }
}

// ─── Team Member Management ─────────────────────────────────────

/**
 * Add a member to a team.
 *
 * @secured — Requires team admin role.
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamRole = "member"
): Promise<TeamMemberRecord> {
  await requireTeamAdmin(teamId);

  const row = await prisma.teamMember.create({
    data: { teamId, userId, role },
    include: { user: true },
  });

  // Invalidate RBAC cache for the new member
  invalidateRbacCache(userId);

  return mapPrismaToTeamMemberRecord(row);
}

/**
 * Remove a member from a team.
 *
 * @secured — Requires team admin role. Admins cannot remove themselves
 *            if they are the last admin (to prevent orphaned teams).
 */
export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<void> {
  const { userId: callerUserId } = await requireTeamAdmin(teamId);

  // Prevent the last admin from removing themselves
  if (callerUserId === userId) {
    const adminCount = await prisma.teamMember.count({
      where: { teamId, role: "admin" },
    });
    if (adminCount <= 1) {
      throw new ForbiddenError(
        "team (cannot remove the last admin — transfer admin role first)"
      );
    }
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });

  // Invalidate RBAC cache for the removed member
  invalidateRbacCache(userId);
}

/**
 * List all members of a team.
 *
 * @secured — Requires team membership.
 */
export async function listTeamMembers(
  teamId: string
): Promise<TeamMemberRecord[]> {
  await requireTeamMember(teamId);

  const rows = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  return rows.map(mapPrismaToTeamMemberRecord);
}

/**
 * Update a team member's role.
 *
 * @secured — Requires team admin role.
 */
export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  newRole: TeamRole
): Promise<TeamMemberRecord> {
  const { userId: callerUserId } = await requireTeamAdmin(teamId);

  // Prevent the last admin from demoting themselves
  if (callerUserId === userId && newRole !== "admin") {
    const adminCount = await prisma.teamMember.count({
      where: { teamId, role: "admin" },
    });
    if (adminCount <= 1) {
      throw new ForbiddenError(
        "team (cannot demote the last admin — promote another member first)"
      );
    }
  }

  const row = await prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId } },
    data: { role: newRole },
    include: { user: true },
  });

  // Invalidate RBAC cache for the affected member
  invalidateRbacCache(userId);

  return mapPrismaToTeamMemberRecord(row);
}

// ─── Membership Checks ─────────────────────────────────────────

/**
 * Check if a user is a member of a team.
 *
 * @secured — Requires authentication. Callers can only check their own
 *            membership or membership of users in teams they belong to.
 */
export async function isTeamMember(
  teamId: string,
  userId: string
): Promise<boolean> {
  const { userId: callerUserId } = await requireSession();

  // If checking someone else's membership, caller must be a member themselves
  if (userId !== callerUserId) {
    const callerMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: callerUserId } },
    });
    if (!callerMembership) {
      throw new ForbiddenError("team");
    }
  }

  const row = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return row !== null;
}

/**
 * Check if a user is an admin of a team.
 *
 * @secured — Requires authentication. Same access rules as isTeamMember.
 */
export async function isTeamAdmin(
  teamId: string,
  userId: string
): Promise<boolean> {
  const { userId: callerUserId } = await requireSession();

  // If checking someone else's admin status, caller must be a team member
  if (userId !== callerUserId) {
    const callerMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: callerUserId } },
    });
    if (!callerMembership) {
      throw new ForbiddenError("team");
    }
  }

  const row = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return row?.role === "admin";
}

// ─── Team Invite Management ──────────────────────────────────────

/**
 * Create a team invite.
 *
 * @secured — Requires team admin role.
 */
export async function createTeamInvite(
  teamId: string,
  email?: string,
  role: string = "member"
): Promise<TeamInvite> {
  await requireTeamAdmin(teamId);

  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const row = await prisma.teamInvite.create({
    data: { teamId, email: email || null, role, code, expiresAt },
  });
  return mapPrismaToTeamInvite(row);
}

/**
 * Redeem a team invite code to join a team.
 *
 * @secured — Requires authentication. The invite is consumed for the
 *            current session user.
 */
export async function redeemTeamInvite(
  code: string,
  userId: string
): Promise<{ success: boolean; teamId?: string }> {
  const { userId: callerUserId } = await requireSession();

  // Ensure caller can only redeem invites for themselves
  if (userId !== callerUserId) {
    throw new ForbiddenError("invite");
  }

  try {
    const invite = await prisma.teamInvite.findUnique({ where: { code } });
    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return { success: false };
    }

    // If invite targets a specific email, verify it matches
    if (invite.email) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user?.email?.toLowerCase() !== invite.email.toLowerCase()) {
        return { success: false };
      }
    }

    // Check if user is already a member
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: invite.teamId, userId } },
    });
    if (existing) {
      return { success: true, teamId: invite.teamId };
    }
    await prisma.$transaction([
      prisma.teamMember.create({
        data: { teamId: invite.teamId, userId, role: invite.role },
      }),
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: { used: true },
      }),
    ]);

    // Invalidate RBAC cache so teamIds[] is refreshed
    invalidateRbacCache(userId);

    return { success: true, teamId: invite.teamId };
  } catch {
    return { success: false };
  }
}

/**
 * List active (unexpired, unused) invites for a team.
 *
 * @secured — Requires team admin role.
 */
export async function listTeamInvites(teamId: string): Promise<TeamInvite[]> {
  await requireTeamAdmin(teamId);

  const rows = await prisma.teamInvite.findMany({
    where: { teamId, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapPrismaToTeamInvite);
}

/**
 * Revoke (delete) a team invite.
 *
 * @secured — Requires team admin role for the invite's team.
 */
export async function revokeTeamInvite(inviteId: string): Promise<void> {
  const { userId } = await requireSession();

  // Look up the invite to find which team it belongs to
  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
    select: { teamId: true },
  });

  if (!invite) {
    return; // Invite already deleted — idempotent
  }

  // Verify caller is admin of the invite's team
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invite.teamId, userId } },
  });

  if (!membership || membership.role !== "admin") {
    throw new ForbiddenError("team invite");
  }

  await prisma.teamInvite.delete({ where: { id: inviteId } });
}
