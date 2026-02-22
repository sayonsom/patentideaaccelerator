"use server";

import { prisma } from "@/lib/prisma";
import type {
  ContinuationResult,
  ContinuationDirection,
  Idea,
} from "@/lib/types";
import type { ContinuationResult as PrismaContinuation } from "@prisma/client";

// ─── Mapper ─────────────────────────────────────────────────────

function mapContinuation(row: PrismaContinuation): ContinuationResult {
  return {
    id: row.id,
    ideaId: row.ideaId,
    directionType: row.directionType as ContinuationDirection,
    title: row.title,
    description: row.description,
    technicalDelta: row.technicalDelta,
    promotedIdeaId: row.promotedIdeaId,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── CRUD ───────────────────────────────────────────────────────

export async function listContinuationsAction(ideaId: string): Promise<ContinuationResult[]> {
  const rows = await prisma.continuationResult.findMany({
    where: { ideaId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapContinuation);
}

export async function saveContinuationsAction(
  ideaId: string,
  results: {
    directionType: ContinuationDirection;
    title: string;
    description: string;
    technicalDelta: string;
  }[]
): Promise<ContinuationResult[]> {
  // Clear existing continuations for this idea (regeneration)
  await prisma.continuationResult.deleteMany({ where: { ideaId } });

  const created = await Promise.all(
    results.map((r) =>
      prisma.continuationResult.create({
        data: {
          ideaId,
          directionType: r.directionType,
          title: r.title,
          description: r.description,
          technicalDelta: r.technicalDelta,
        },
      })
    )
  );
  return created.map(mapContinuation);
}

export async function promoteContinuationAction(
  continuationId: string,
  userId: string
): Promise<{ idea: Idea; continuation: ContinuationResult } | null> {
  // Get the continuation
  const cont = await prisma.continuationResult.findUnique({
    where: { id: continuationId },
    include: { idea: true },
  });
  if (!cont) return null;

  // Create a new idea from the continuation
  const parentIdea = cont.idea;
  const newIdea = await prisma.idea.create({
    data: {
      userId,
      title: cont.title,
      problemStatement: parentIdea.problemStatement,
      proposedSolution: cont.description,
      technicalApproach: cont.technicalDelta,
      contradictionResolved: parentIdea.contradictionResolved,
      status: "draft",
      phase: "foundation",
      frameworkUsed: "none",
      techStack: parentIdea.techStack ?? undefined,
      tags: parentIdea.tags ?? undefined,
      parentIdeaId: parentIdea.id,
      continuationType: cont.directionType,
    },
  });

  // Link the continuation to the promoted idea
  const updated = await prisma.continuationResult.update({
    where: { id: continuationId },
    data: { promotedIdeaId: newIdea.id },
  });

  // Re-import mapPrismaToIdea pattern — simplified inline
  const idea = {
    id: newIdea.id,
    userId: newIdea.userId,
    sprintId: newIdea.sprintId,
    teamId: newIdea.teamId,
    title: newIdea.title,
    problemStatement: newIdea.problemStatement,
    existingApproach: newIdea.existingApproach,
    proposedSolution: newIdea.proposedSolution,
    technicalApproach: newIdea.technicalApproach,
    contradictionResolved: newIdea.contradictionResolved,
    priorArtNotes: newIdea.priorArtNotes,
    status: newIdea.status,
    phase: newIdea.phase,
    techStack: (newIdea.techStack as string[]) ?? [],
    tags: (newIdea.tags as string[]) ?? [],
    score: null,
    aliceScore: null,
    frameworkUsed: newIdea.frameworkUsed,
    frameworkData: {},
    claimDraft: null,
    inventiveStepAnalysis: null,
    marketNeedsAnalysis: null,
    patentReport: null,
    redTeamNotes: "",
    alignmentScores: [],
    createdAt: newIdea.createdAt.toISOString(),
    updatedAt: newIdea.updatedAt.toISOString(),
  } as Idea;

  return { idea, continuation: mapContinuation(updated) };
}
