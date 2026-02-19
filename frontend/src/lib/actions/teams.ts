"use server";

import { prisma } from "@/lib/prisma";
import type { Team, Member, TeamTimer, Idea, SessionMode, SprintPhase } from "@/lib/types";
import type { Idea as PrismaIdea } from "@prisma/client";

// ─── Helpers ────────────────────────────────────────────────────

/** Re-use the idea mapper from the ideas actions */
function mapPrismaIdeaToIdea(row: PrismaIdea): Idea {
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
    status: row.status as Idea["status"],
    phase: row.phase as Idea["phase"],
    techStack: (row.techStack as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    score: row.score as Idea["score"],
    aliceScore: row.aliceScore as Idea["aliceScore"],
    frameworkUsed: row.frameworkUsed as Idea["frameworkUsed"],
    frameworkData: (row.frameworkData as Idea["frameworkData"]) ?? {},
    claimDraft: row.claimDraft as Idea["claimDraft"],
    redTeamNotes: row.redTeamNotes,
    alignmentScores: [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Reconstruct Team from Sprint + Members + Ideas ─────────────

/**
 * Build a Team object from the Sprint, its SprintMembers (with User data),
 * and all Ideas belonging to that sprint.
 * Timer fields are mapped from the Sprint model — real-time tick state
 * is managed client-side.
 */
export async function getTeamForSprint(sprintId: string): Promise<Team | null> {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      members: {
        include: { user: true },
      },
      ideas: true,
    },
  });

  if (!sprint) return null;

  // Map sprint members → Team.members
  const members: Member[] = sprint.members.map((sm) => ({
    id: sm.user.id,
    name: sm.user.name,
    email: sm.user.email,
    interests: (sm.user.interests as string[]) ?? [],
  }));

  // Find data minister (if one is assigned)
  const dataMinister = sprint.members.find((sm) => sm.role === "data_minister")?.userId ?? null;

  // Map ideas
  const ideas: Idea[] = sprint.ideas.map(mapPrismaIdeaToIdea);

  // Build timer — server stores budget/remaining, client manages live tick
  const timer: TeamTimer = {
    budgetSeconds: 259200, // 72h default
    spentSeconds: 259200 - sprint.timerSecondsRemaining,
    runningSinceMs: sprint.timerRunning ? Date.now() : null,
    startedAtMs: sprint.startedAt?.getTime() ?? null,
    startedStage: sprint.phase,
  };

  return {
    id: sprint.id,
    name: sprint.name,
    members,
    dataMinister,
    ideas,
    sessionMode: sprint.sessionMode as SessionMode,
    sprintPhase: sprint.phase as SprintPhase,
    lastActivityAt: sprint.updatedAt.getTime(),
    timer,
  };
}

// ─── Update Team ─────────────────────────────────────────────────

export async function updateTeamAction(
  sprintId: string,
  updates: Partial<Pick<Team, "name" | "sessionMode" | "sprintPhase" | "dataMinister">>
): Promise<Team | null> {
  try {
    // Update sprint-level fields
    const sprintData: Record<string, unknown> = {};
    if (updates.name !== undefined) sprintData.name = updates.name;
    if (updates.sessionMode !== undefined) sprintData.sessionMode = updates.sessionMode;
    if (updates.sprintPhase !== undefined) sprintData.phase = updates.sprintPhase;

    if (Object.keys(sprintData).length > 0) {
      await prisma.sprint.update({ where: { id: sprintId }, data: sprintData });
    }

    // Update data minister role
    if (updates.dataMinister !== undefined) {
      // Remove existing data minister
      await prisma.sprintMember.updateMany({
        where: { sprintId, role: "data_minister" },
        data: { role: "member" },
      });

      // Set new data minister
      if (updates.dataMinister) {
        await prisma.sprintMember.update({
          where: { sprintId_userId: { sprintId, userId: updates.dataMinister } },
          data: { role: "data_minister" },
        });
      }
    }

    // Return reconstructed team
    return getTeamForSprint(sprintId);
  } catch {
    return null;
  }
}

// ─── List teams for a user ──────────────────────────────────────

export async function listTeamsForUser(userId: string): Promise<Team[]> {
  // Find all sprints where the user is a member
  const memberships = await prisma.sprintMember.findMany({
    where: { userId },
    select: { sprintId: true },
  });

  const teams: Team[] = [];
  for (const { sprintId } of memberships) {
    const team = await getTeamForSprint(sprintId);
    if (team) teams.push(team);
  }

  return teams;
}
