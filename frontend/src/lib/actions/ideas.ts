"use server";

import { prisma } from "@/lib/prisma";
import type { Idea, IdeaScore, AliceScore, ClaimDraft, FrameworkData, IdeaStatus, IdeaPhase, FrameworkType, AlignmentScore } from "@/lib/types";
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
  if (updates.redTeamNotes !== undefined) data.redTeamNotes = updates.redTeamNotes;
  if (updates.sprintId !== undefined) data.sprintId = updates.sprintId;
  return data;
}

// ─── CRUD Actions ───────────────────────────────────────────────

export async function listIdeasAction(userId: string): Promise<Idea[]> {
  const rows = await prisma.idea.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { alignmentScores: true },
  });
  return rows.map(mapPrismaToIdea);
}

export async function getIdeaAction(id: string): Promise<Idea | null> {
  const row = await prisma.idea.findUnique({
    where: { id },
    include: { alignmentScores: true },
  });
  return row ? mapPrismaToIdea(row) : null;
}

export async function createIdeaAction(idea: Idea): Promise<Idea> {
  const row = await prisma.idea.create({
    data: mapIdeaToCreateInput(idea),
  });
  return mapPrismaToIdea(row);
}

export async function updateIdeaAction(
  id: string,
  updates: Partial<Idea>
): Promise<Idea | null> {
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

export async function deleteIdeaAction(id: string): Promise<boolean> {
  try {
    await prisma.idea.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function filterIdeasAction(
  userId: string,
  opts: {
    status?: string;
    search?: string;
    sortBy?: "updatedAt" | "createdAt" | "title";
    sortDir?: "asc" | "desc";
  }
): Promise<Idea[]> {
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
