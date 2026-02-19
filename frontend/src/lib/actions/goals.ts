"use server";

import { prisma } from "@/lib/prisma";
import type { BusinessGoal, AlignmentScore } from "@/lib/types";
import type { BusinessGoal as PrismaGoal, AlignmentScore as PrismaAlignmentScore } from "@prisma/client";

// ─── Mappers ────────────────────────────────────────────────────

function mapPrismaToGoal(row: PrismaGoal): BusinessGoal {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    color: row.color,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapPrismaToAlignmentScore(row: PrismaAlignmentScore): AlignmentScore {
  return {
    id: row.id,
    ideaId: row.ideaId,
    goalId: row.goalId,
    score: row.score,
    rationale: row.rationale,
  };
}

// ─── Business Goal CRUD ─────────────────────────────────────────

export async function listGoalsAction(userId: string): Promise<BusinessGoal[]> {
  const rows = await prisma.businessGoal.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(mapPrismaToGoal);
}

export async function createGoalAction(data: {
  userId: string;
  title: string;
  description?: string;
  color?: string;
}): Promise<BusinessGoal> {
  // Auto-assign sort order as max + 1
  const maxOrder = await prisma.businessGoal.aggregate({
    where: { userId: data.userId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const row = await prisma.businessGoal.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description ?? "",
      color: data.color ?? "#4F83CC",
      sortOrder,
    },
  });
  return mapPrismaToGoal(row);
}

export async function updateGoalAction(
  id: string,
  updates: Partial<Pick<BusinessGoal, "title" | "description" | "color" | "sortOrder">>
): Promise<BusinessGoal | null> {
  try {
    const row = await prisma.businessGoal.update({
      where: { id },
      data: updates,
    });
    return mapPrismaToGoal(row);
  } catch {
    return null;
  }
}

export async function deleteGoalAction(id: string): Promise<boolean> {
  try {
    await prisma.businessGoal.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ─── Alignment Scoring ──────────────────────────────────────────

export async function scoreIdeaAlignmentAction(
  ideaId: string,
  goalId: string,
  score: number,
  rationale: string
): Promise<AlignmentScore> {
  const row = await prisma.alignmentScore.upsert({
    where: { ideaId_goalId: { ideaId, goalId } },
    create: { ideaId, goalId, score, rationale },
    update: { score, rationale },
  });
  return mapPrismaToAlignmentScore(row);
}

export async function getAlignmentScoresForIdea(
  ideaId: string
): Promise<AlignmentScore[]> {
  const rows = await prisma.alignmentScore.findMany({
    where: { ideaId },
  });
  return rows.map(mapPrismaToAlignmentScore);
}

export async function batchScoreAlignmentAction(
  ideaId: string,
  scores: { goalId: string; score: number; rationale: string }[]
): Promise<AlignmentScore[]> {
  const results: AlignmentScore[] = [];
  for (const s of scores) {
    const row = await prisma.alignmentScore.upsert({
      where: { ideaId_goalId: { ideaId, goalId: s.goalId } },
      create: { ideaId, goalId: s.goalId, score: s.score, rationale: s.rationale },
      update: { score: s.score, rationale: s.rationale },
    });
    results.push(mapPrismaToAlignmentScore(row));
  }
  return results;
}
