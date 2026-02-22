"use server";

import { prisma } from "@/lib/prisma";
import {
  requireSession,
  requireIdeaAccess,
  requireIdeaOwner,
  requireTeamMember,
  requireSprintAccess,
  ForbiddenError,
} from "@/lib/actions/authorization";
import type { Idea, IdeaScore, AliceScore, ClaimDraft, FrameworkData, IdeaStatus, IdeaPhase, FrameworkType, AlignmentScore, InventiveStepAnalysis, MarketNeedsAnalysis, PatentReport } from "@/lib/types";
import { Prisma } from "@prisma/client";
import type { Idea as PrismaIdea, AlignmentScore as PrismaAlignmentScore } from "@prisma/client";

// ─── Prisma ↔ App Type Mappers ──────────────────────────────────

type PrismaIdeaWithScores = PrismaIdea & {
  alignmentScores?: PrismaAlignmentScore[];
};

function mapAlignmentScore(row: PrismaAlignmentScore): AlignmentScore {
  return {
    id: row.id,
    ideaId: row.ideaId,
    goalId: row.goalId,
    score: row.score,
    rationale: row.rationale,
  };
}

function mapPrismaToIdea(row: PrismaIdeaWithScores): Idea {
  return {
    id: row.id,
    userId: row.userId,
    sprintId: row.sprintId,
    teamId: row.teamId,
    title: row.title,
    problemStatement: row.problemStatement,
    existingApproach: row.existingApproach,
    proposedSolution: row.proposedSolution,
    technicalApproach: row.technicalApproach,
    contradictionResolved: row.contradictionResolved,
    priorArtNotes: row.priorArtNotes,
    status: row.status as IdeaStatus,
    phase: row.phase as IdeaPhase,
    techStack: (row.techStack as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    score: row.score as IdeaScore | null,
    aliceScore: row.aliceScore as AliceScore | null,
    frameworkUsed: row.frameworkUsed as FrameworkType,
    frameworkData: (row.frameworkData as FrameworkData) ?? {},
    claimDraft: row.claimDraft as ClaimDraft | null,
    inventiveStepAnalysis: (row.inventiveStep as InventiveStepAnalysis | null) ?? null,
    marketNeedsAnalysis: (row.marketNeeds as MarketNeedsAnalysis | null) ?? null,
    patentReport: (row.patentReport as PatentReport | null) ?? null,
    redTeamNotes: row.redTeamNotes,
    alignmentScores: (row.alignmentScores ?? []).map(mapAlignmentScore),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapIdeaToCreateInput(idea: Idea): Prisma.IdeaUncheckedCreateInput {
  return {
    id: idea.id,
    userId: idea.userId,
    sprintId: idea.sprintId,
    teamId: idea.teamId,
    title: idea.title,
    problemStatement: idea.problemStatement,
    existingApproach: idea.existingApproach,
    proposedSolution: idea.proposedSolution,
    technicalApproach: idea.technicalApproach,
    contradictionResolved: idea.contradictionResolved,
    priorArtNotes: idea.priorArtNotes,
    status: idea.status,
    phase: idea.phase,
    techStack: idea.techStack as unknown as Prisma.InputJsonValue,
    tags: idea.tags as unknown as Prisma.InputJsonValue,
    score: (idea.score as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    aliceScore: (idea.aliceScore as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    frameworkUsed: idea.frameworkUsed,
    frameworkData: idea.frameworkData as unknown as Prisma.InputJsonValue,
    claimDraft: (idea.claimDraft as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    inventiveStep: (idea.inventiveStepAnalysis as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    marketNeeds: (idea.marketNeedsAnalysis as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    patentReport: (idea.patentReport as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    redTeamNotes: idea.redTeamNotes,
  };
}

function mapUpdatesToInput(updates: Partial<Idea>): Prisma.IdeaUncheckedUpdateInput {
  const data: Prisma.IdeaUncheckedUpdateInput = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.problemStatement !== undefined) data.problemStatement = updates.problemStatement;
  if (updates.existingApproach !== undefined) data.existingApproach = updates.existingApproach;
  if (updates.proposedSolution !== undefined) data.proposedSolution = updates.proposedSolution;
  if (updates.technicalApproach !== undefined) data.technicalApproach = updates.technicalApproach;
  if (updates.contradictionResolved !== undefined) data.contradictionResolved = updates.contradictionResolved;
  if (updates.priorArtNotes !== undefined) data.priorArtNotes = updates.priorArtNotes;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.phase !== undefined) data.phase = updates.phase;
  if (updates.techStack !== undefined) data.techStack = updates.techStack as unknown as Prisma.InputJsonValue;
  if (updates.tags !== undefined) data.tags = updates.tags as unknown as Prisma.InputJsonValue;
  if (updates.score !== undefined) data.score = (updates.score as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull;
  if (updates.aliceScore !== undefined) data.aliceScore = (updates.aliceScore as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull;
  if (updates.frameworkUsed !== undefined) data.frameworkUsed = updates.frameworkUsed;
  if (updates.frameworkData !== undefined) data.frameworkData = updates.frameworkData as unknown as Prisma.InputJsonValue;
  if (updates.claimDraft !== undefined) data.claimDraft = (updates.claimDraft as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull;
  if (updates.inventiveStepAnalysis !== undefined) data.inventiveStep = (updates.inventiveStepAnalysis as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull;
  if (updates.marketNeedsAnalysis !== undefined) data.marketNeeds = (updates.marketNeedsAnalysis as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull;
  if (updates.patentReport !== undefined) data.patentReport = (updates.patentReport as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull;
  if (updates.redTeamNotes !== undefined) data.redTeamNotes = updates.redTeamNotes;
  if (updates.sprintId !== undefined) data.sprintId = updates.sprintId;
  if (updates.teamId !== undefined) data.teamId = updates.teamId;
  return data;
}

// ─── CRUD Actions ───────────────────────────────────────────────

/**
 * List all ideas owned by a user.
 *
 * @secured — Requires authentication. Users can only list their own ideas.
 */
export async function listIdeasAction(userId: string): Promise<Idea[]> {
  const { userId: sessionUserId } = await requireSession();

  if (userId !== sessionUserId) {
    throw new ForbiddenError("user data");
  }

  const rows = await prisma.idea.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { alignmentScores: true },
  });
  return rows.map(mapPrismaToIdea);
}

/**
 * Get a single idea by ID.
 *
 * @secured — Requires idea access (owner OR team member).
 */
export async function getIdeaAction(id: string): Promise<Idea | null> {
  await requireIdeaAccess(id);

  const row = await prisma.idea.findUnique({
    where: { id },
    include: { alignmentScores: true },
  });
  return row ? mapPrismaToIdea(row) : null;
}

/**
 * Create a new idea.
 *
 * @secured — Requires authentication. The idea's userId MUST match the session.
 *            If teamId is set, caller must be a member of that team.
 */
export async function createIdeaAction(idea: Idea): Promise<Idea> {
  const { userId } = await requireSession();

  // Idea must be created for the current user
  if (idea.userId !== userId) {
    throw new ForbiddenError("idea");
  }

  // If assigning to a team, verify team membership
  if (idea.teamId) {
    await requireTeamMember(idea.teamId);
  }

  // If assigning to a sprint, verify sprint access
  if (idea.sprintId) {
    await requireSprintAccess(idea.sprintId);
  }

  const row = await prisma.idea.create({
    data: mapIdeaToCreateInput(idea),
  });
  return mapPrismaToIdea(row);
}

/**
 * Update an existing idea.
 *
 * @secured — Requires idea access (owner OR team member).
 *            Changing teamId or sprintId requires membership in the target.
 */
export async function updateIdeaAction(
  id: string,
  updates: Partial<Idea>
): Promise<Idea | null> {
  await requireIdeaAccess(id);

  // If moving to a new team, verify membership in the target team
  if (updates.teamId !== undefined && updates.teamId !== null) {
    await requireTeamMember(updates.teamId);
  }

  // If linking to a new sprint, verify sprint access
  if (updates.sprintId !== undefined && updates.sprintId !== null) {
    await requireSprintAccess(updates.sprintId);
  }

  try {
    const row = await prisma.idea.update({
      where: { id },
      data: mapUpdatesToInput(updates),
    });
    return mapPrismaToIdea(row);
  } catch {
    return null;
  }
}

/**
 * Delete an idea.
 *
 * @secured — Requires idea ownership (only the creator can delete).
 */
export async function deleteIdeaAction(id: string): Promise<boolean> {
  await requireIdeaOwner(id);

  try {
    await prisma.idea.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Filter ideas with search, status, and sort options.
 *
 * @secured — Requires authentication. Users can only filter their own ideas.
 */
export async function filterIdeasAction(
  userId: string,
  opts: {
    status?: string;
    search?: string;
    sortBy?: "updatedAt" | "createdAt" | "title";
    sortDir?: "asc" | "desc";
  }
): Promise<Idea[]> {
  const { userId: sessionUserId } = await requireSession();

  if (userId !== sessionUserId) {
    throw new ForbiddenError("user data");
  }

  const where: Prisma.IdeaWhereInput = { userId };
  if (opts.status) where.status = opts.status;
  if (opts.search) {
    where.OR = [
      { title: { contains: opts.search, mode: "insensitive" } },
      { problemStatement: { contains: opts.search, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.idea.findMany({
    where,
    orderBy: { [opts.sortBy ?? "updatedAt"]: opts.sortDir ?? "desc" },
    include: { alignmentScores: true },
  });
  return rows.map(mapPrismaToIdea);
}

// ─── Team-Scoped Queries ────────────────────────────────────────

/**
 * List ideas belonging to a specific team.
 *
 * @secured — Requires team membership.
 */
export async function listTeamIdeasAction(teamId: string): Promise<Idea[]> {
  await requireTeamMember(teamId);

  const rows = await prisma.idea.findMany({
    where: { teamId },
    orderBy: { updatedAt: "desc" },
    include: { alignmentScores: true },
  });
  return rows.map(mapPrismaToIdea);
}

/**
 * List personal ideas for a user (ideas with no team).
 *
 * @secured — Requires authentication. Users can only list their own personal ideas.
 */
export async function listPersonalIdeasAction(userId: string): Promise<Idea[]> {
  const { userId: sessionUserId } = await requireSession();

  if (userId !== sessionUserId) {
    throw new ForbiddenError("user data");
  }

  const rows = await prisma.idea.findMany({
    where: { userId, teamId: null },
    orderBy: { updatedAt: "desc" },
    include: { alignmentScores: true },
  });
  return rows.map(mapPrismaToIdea);
}

// ─── Sprint-Idea Linking ──────────────────────────────────────

/**
 * List all ideas currently linked to a sprint.
 *
 * @secured — Requires sprint access (owner, sprint member, or team member).
 */
export async function listSprintIdeasAction(sprintId: string): Promise<Idea[]> {
  await requireSprintAccess(sprintId);

  const rows = await prisma.idea.findMany({
    where: { sprintId },
    orderBy: { updatedAt: "desc" },
    include: { alignmentScores: true },
  });
  return rows.map(mapPrismaToIdea);
}

/**
 * List candidate ideas for a sprint — unlinked ideas from sprint members.
 * These are ideas that could be added to the sprint.
 *
 * Privacy: For team-scoped sprints, only shows team ideas (not personal).
 * For personal sprints (no team), only shows the current user's own ideas.
 *
 * @secured — Requires sprint access.
 */
export async function listCandidateIdeasForSprint(sprintId: string): Promise<Idea[]> {
  const { userId: currentUserId } = await requireSprintAccess(sprintId);

  // Get sprint details including teamId
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    select: { ownerId: true, teamId: true },
  });
  if (!sprint) return [];

  // Get all sprint member userIds
  const members = await prisma.sprintMember.findMany({
    where: { sprintId },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);
  if (!memberIds.includes(sprint.ownerId)) {
    memberIds.push(sprint.ownerId);
  }

  if (memberIds.length === 0) return [];

  // Build privacy-aware query
  const where: Prisma.IdeaWhereInput = {
    sprintId: null,
  };

  if (sprint.teamId) {
    // Team-scoped sprint: only show team ideas from members (no personal idea leakage)
    where.userId = { in: memberIds };
    where.teamId = sprint.teamId;
  } else {
    // Personal sprint (no team): only show the current user's own unlinked ideas
    where.userId = currentUserId;
  }

  const rows = await prisma.idea.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { alignmentScores: true },
  });
  return rows.map(mapPrismaToIdea);
}

/**
 * Link an idea to a sprint.
 *
 * @secured — Requires idea access AND sprint access.
 */
export async function linkIdeaToSprint(ideaId: string, sprintId: string): Promise<Idea | null> {
  await requireIdeaAccess(ideaId);
  await requireSprintAccess(sprintId);

  try {
    const row = await prisma.idea.update({
      where: { id: ideaId },
      data: { sprintId },
      include: { alignmentScores: true },
    });
    return mapPrismaToIdea(row);
  } catch {
    return null;
  }
}

/**
 * Unlink an idea from its sprint.
 *
 * @secured — Requires idea access.
 */
export async function unlinkIdeaFromSprint(ideaId: string): Promise<Idea | null> {
  await requireIdeaAccess(ideaId);

  try {
    const row = await prisma.idea.update({
      where: { id: ideaId },
      data: { sprintId: null },
      include: { alignmentScores: true },
    });
    return mapPrismaToIdea(row);
  } catch {
    return null;
  }
}

// ─── Permission Checks ─────────────────────────────────────────

/**
 * Check if a user can access an idea.
 * Access is granted if:
 *   1. User owns the idea (userId matches), OR
 *   2. User is a member of the team the idea belongs to.
 *
 * @secured — Requires authentication. Callers can only check their own access.
 */
export async function canAccessIdea(
  userId: string,
  ideaId: string
): Promise<boolean> {
  const { userId: sessionUserId } = await requireSession();

  // Callers can only check their own access
  if (userId !== sessionUserId) {
    throw new ForbiddenError("idea");
  }

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { userId: true, teamId: true },
  });

  if (!idea) return false;

  // Owner can always access
  if (idea.userId === userId) return true;

  // If idea belongs to a team, check team membership
  if (idea.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: idea.teamId, userId } },
    });
    return membership !== null;
  }

  return false;
}
