/**
 * ════════════════════════════════════════════════════════════════════
 * Authorization Guards — Server-Side Access Control
 * ════════════════════════════════════════════════════════════════════
 *
 * NOTE: This file intentionally does NOT use "use server" because it
 * exports classes (Error subclasses), which are not allowed in server
 * action modules. The async guard functions are imported by files that
 * DO have "use server" (ideas.ts, sprints.ts, teams-management.ts,
 * etc.), so they still only run on the server.
 *
 * Centralised authorization utilities for all server actions.
 * Every mutating or data-fetching server action that touches
 * team-scoped, idea-scoped, or sprint-scoped resources MUST go
 * through one of these guards.
 *
 * Design principles:
 *   1. Auth is verified INSIDE the action, never trusted from callers.
 *   2. Guards are composable — combine session + membership checks.
 *   3. All failures throw typed errors with clear codes.
 *   4. No data is leaked in error messages.
 */

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Error Types ──────────────────────────────────────────────────

export class AuthorizationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UnauthenticatedError extends AuthorizationError {
  constructor() {
    super("UNAUTHENTICATED", "Authentication required", 401);
  }
}

export class ForbiddenError extends AuthorizationError {
  constructor(resource: string = "resource") {
    super("FORBIDDEN", `You do not have access to this ${resource}`, 403);
  }
}

export class NotFoundError extends AuthorizationError {
  constructor(resource: string = "resource") {
    super("NOT_FOUND", `${resource} not found`, 404);
  }
}

// ─── Session Guard ──────────────────────────────────────────────

/**
 * Authenticate the current user from the session.
 * Every protected server action should start with this.
 *
 * @returns The authenticated user's ID and full session.
 * @throws UnauthenticatedError if no valid session exists.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new UnauthenticatedError();
  }
  return {
    userId: session.user.id,
    session,
  };
}

// ─── Team Membership Guards ─────────────────────────────────────

interface TeamMembershipResult {
  userId: string;
  teamId: string;
  role: string;
}

/**
 * Require that the current user is a member of the specified team.
 *
 * @param teamId - The team to check membership for.
 * @returns The user's ID, team ID, and their role in the team.
 * @throws UnauthenticatedError if not logged in.
 * @throws ForbiddenError if the user is not a member of the team.
 */
export async function requireTeamMember(
  teamId: string
): Promise<TeamMembershipResult> {
  const { userId } = await requireSession();

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!membership) {
    throw new ForbiddenError("team");
  }

  return {
    userId,
    teamId,
    role: membership.role,
  };
}

/**
 * Require that the current user is an admin of the specified team.
 *
 * @param teamId - The team to check admin status for.
 * @returns The user's ID, team ID, and role.
 * @throws UnauthenticatedError if not logged in.
 * @throws ForbiddenError if the user is not a team admin.
 */
export async function requireTeamAdmin(
  teamId: string
): Promise<TeamMembershipResult> {
  const membership = await requireTeamMember(teamId);

  if (membership.role !== "admin") {
    throw new ForbiddenError("team (admin required)");
  }

  return membership;
}

// ─── Idea Access Guards ─────────────────────────────────────────

interface IdeaAccessResult {
  userId: string;
  ideaId: string;
  ideaOwnerId: string;
  teamId: string | null;
  isOwner: boolean;
  isTeamMember: boolean;
}

/**
 * Require that the current user can access a specific idea.
 * Access is granted if:
 *   1. The user owns the idea (userId matches), OR
 *   2. The idea belongs to a team and the user is a member of that team.
 *
 * @param ideaId - The idea to check access for.
 * @returns Access details including ownership and team membership info.
 * @throws UnauthenticatedError if not logged in.
 * @throws NotFoundError if the idea does not exist.
 * @throws ForbiddenError if the user cannot access the idea.
 */
export async function requireIdeaAccess(
  ideaId: string
): Promise<IdeaAccessResult> {
  const { userId } = await requireSession();

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { userId: true, teamId: true },
  });

  if (!idea) {
    throw new NotFoundError("Idea");
  }

  const isOwner = idea.userId === userId;

  // Owner always has access
  if (isOwner) {
    return {
      userId,
      ideaId,
      ideaOwnerId: idea.userId,
      teamId: idea.teamId,
      isOwner: true,
      isTeamMember: false,
    };
  }

  // Check team membership if idea belongs to a team
  if (idea.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: idea.teamId, userId } },
    });

    if (membership) {
      return {
        userId,
        ideaId,
        ideaOwnerId: idea.userId,
        teamId: idea.teamId,
        isOwner: false,
        isTeamMember: true,
      };
    }
  }

  throw new ForbiddenError("idea");
}

/**
 * Require that the current user owns a specific idea.
 * Stricter than requireIdeaAccess — team membership is NOT sufficient.
 * Use for mutations that should only be done by the creator.
 *
 * @param ideaId - The idea to check ownership for.
 * @throws UnauthenticatedError if not logged in.
 * @throws NotFoundError if the idea does not exist.
 * @throws ForbiddenError if the user does not own the idea.
 */
export async function requireIdeaOwner(ideaId: string) {
  const { userId } = await requireSession();

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { userId: true },
  });

  if (!idea) {
    throw new NotFoundError("Idea");
  }

  if (idea.userId !== userId) {
    throw new ForbiddenError("idea");
  }

  return { userId, ideaId };
}

// ─── Sprint Access Guards ───────────────────────────────────────

interface SprintAccessResult {
  userId: string;
  sprintId: string;
  sprintOwnerId: string;
  teamId: string | null;
  isOwner: boolean;
  isSprintMember: boolean;
  isTeamMember: boolean;
}

/**
 * Require that the current user can access a specific sprint.
 * Access is granted if:
 *   1. The user owns the sprint (ownerId matches), OR
 *   2. The user is a SprintMember, OR
 *   3. The sprint belongs to a team and the user is a TeamMember.
 *
 * @param sprintId - The sprint to check access for.
 * @returns Access details.
 * @throws UnauthenticatedError if not logged in.
 * @throws NotFoundError if the sprint does not exist.
 * @throws ForbiddenError if the user cannot access the sprint.
 */
export async function requireSprintAccess(
  sprintId: string
): Promise<SprintAccessResult> {
  const { userId } = await requireSession();

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    select: { ownerId: true, teamId: true },
  });

  if (!sprint) {
    throw new NotFoundError("Sprint");
  }

  const isOwner = sprint.ownerId === userId;

  // Owner always has access
  if (isOwner) {
    return {
      userId,
      sprintId,
      sprintOwnerId: sprint.ownerId,
      teamId: sprint.teamId,
      isOwner: true,
      isSprintMember: false,
      isTeamMember: false,
    };
  }

  // Check sprint membership
  const sprintMembership = await prisma.sprintMember.findUnique({
    where: { sprintId_userId: { sprintId, userId } },
  });

  if (sprintMembership) {
    return {
      userId,
      sprintId,
      sprintOwnerId: sprint.ownerId,
      teamId: sprint.teamId,
      isOwner: false,
      isSprintMember: true,
      isTeamMember: false,
    };
  }

  // Check team membership if sprint belongs to a team
  if (sprint.teamId) {
    const teamMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: sprint.teamId, userId } },
    });

    if (teamMembership) {
      return {
        userId,
        sprintId,
        sprintOwnerId: sprint.ownerId,
        teamId: sprint.teamId,
        isOwner: false,
        isSprintMember: false,
        isTeamMember: true,
      };
    }
  }

  throw new ForbiddenError("sprint");
}

/**
 * Require that the current user owns a specific sprint.
 * Stricter than requireSprintAccess — only the owner can perform this action.
 *
 * @param sprintId - The sprint to check ownership for.
 * @throws UnauthenticatedError if not logged in.
 * @throws NotFoundError if the sprint does not exist.
 * @throws ForbiddenError if the user does not own the sprint.
 */
export async function requireSprintOwner(sprintId: string) {
  const { userId } = await requireSession();

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    select: { ownerId: true },
  });

  if (!sprint) {
    throw new NotFoundError("Sprint");
  }

  if (sprint.ownerId !== userId) {
    throw new ForbiddenError("sprint");
  }

  return { userId, sprintId };
}

// ─── Ownership Verification (for list actions) ──────────────────

/**
 * Require that the current session user matches the provided userId.
 * Use this to protect list actions that accept a userId parameter —
 * ensures the caller can only request their own data.
 *
 * @param requestedUserId - The userId the caller is requesting data for.
 * @returns The verified userId.
 * @throws UnauthenticatedError if not logged in.
 * @throws ForbiddenError if the requested userId doesn't match the session.
 */
export async function requireSelf(requestedUserId: string) {
  const { userId } = await requireSession();

  if (userId !== requestedUserId) {
    throw new ForbiddenError("user data");
  }

  return { userId };
}
