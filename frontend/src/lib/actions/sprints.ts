"use server";

import { prisma } from "@/lib/prisma";
import {
  requireSession,
  requireSprintAccess,
  requireSprintOwner,
  requireTeamMember,
  ForbiddenError,
} from "@/lib/actions/authorization";
import type { Sprint, SprintMemberRecord, SessionMode, SprintPhase } from "@/lib/types";
import type { Sprint as PrismaSprint, Prisma } from "@prisma/client";

// ─── Mapper ─────────────────────────────────────────────────────

function mapPrismaToSprint(row: PrismaSprint): Sprint {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    teamId: row.teamId,
    description: row.description,
    theme: row.theme,
    status: row.status as Sprint["status"],
    sessionMode: row.sessionMode as SessionMode,
    phase: row.phase as SprintPhase,
    timerSecondsRemaining: row.timerSecondsRemaining,
    timerRunning: row.timerRunning,
    startedAt: row.startedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Actions ────────────────────────────────────────────────────

/**
 * List sprints owned by the user.
 *
 * @secured — Requires authentication. Users can only list their own sprints.
 */
export async function listSprintsAction(ownerId: string): Promise<Sprint[]> {
  const { userId } = await requireSession();

  if (ownerId !== userId) {
    throw new ForbiddenError("user data");
  }

  const rows = await prisma.sprint.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapPrismaToSprint);
}

/**
 * List all sprints accessible to a user:
 *  1. Sprints they own
 *  2. Sprints where they are a SprintMember
 *
 * @secured — Requires authentication. Users can only list their own accessible sprints.
 */
export async function listAccessibleSprintsAction(userId: string): Promise<Sprint[]> {
  const { userId: sessionUserId } = await requireSession();

  if (userId !== sessionUserId) {
    throw new ForbiddenError("user data");
  }

  const rows = await prisma.sprint.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapPrismaToSprint);
}

/**
 * Get a single sprint by ID.
 *
 * @secured — Requires sprint access (owner, sprint member, or team member).
 */
export async function getSprintAction(id: string): Promise<Sprint | null> {
  await requireSprintAccess(id);

  const row = await prisma.sprint.findUnique({ where: { id } });
  return row ? mapPrismaToSprint(row) : null;
}

/**
 * Create a new sprint.
 *
 * @secured — Requires authentication. OwnerId MUST match session user.
 *            If teamId is set, caller must be a member of that team.
 */
export async function createSprintAction(data: {
  id?: string;
  name: string;
  ownerId: string;
  teamId?: string;
  description?: string;
  theme?: string;
  sessionMode?: SessionMode;
  phase?: SprintPhase;
}): Promise<Sprint> {
  const { userId } = await requireSession();

  // Sprint must be created for the current user
  if (data.ownerId !== userId) {
    throw new ForbiddenError("sprint");
  }

  // If assigning to a team, verify team membership
  if (data.teamId) {
    await requireTeamMember(data.teamId);
  }

  const row = await prisma.sprint.create({
    data: {
      ...(data.id ? { id: data.id } : {}),
      name: data.name,
      ownerId: data.ownerId,
      ...(data.teamId ? { teamId: data.teamId } : {}),
      description: data.description ?? "",
      theme: data.theme ?? "",
      sessionMode: data.sessionMode ?? "quantity",
      phase: data.phase ?? "foundation",
    },
  });
  return mapPrismaToSprint(row);
}

/**
 * Update an existing sprint.
 *
 * @secured — Requires sprint access (owner, sprint member, or team member).
 */
export async function updateSprintAction(
  id: string,
  updates: Partial<Pick<Sprint, "name" | "description" | "theme" | "status" | "sessionMode" | "phase" | "timerSecondsRemaining" | "timerRunning" | "startedAt">>
): Promise<Sprint | null> {
  await requireSprintAccess(id);

  try {
    const data: Prisma.SprintUncheckedUpdateInput = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.theme !== undefined) data.theme = updates.theme;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.sessionMode !== undefined) data.sessionMode = updates.sessionMode;
    if (updates.phase !== undefined) data.phase = updates.phase;
    if (updates.timerSecondsRemaining !== undefined) data.timerSecondsRemaining = updates.timerSecondsRemaining;
    if (updates.timerRunning !== undefined) data.timerRunning = updates.timerRunning;
    if (updates.startedAt !== undefined) data.startedAt = updates.startedAt ? new Date(updates.startedAt) : null;

    const row = await prisma.sprint.update({ where: { id }, data });
    return mapPrismaToSprint(row);
  } catch {
    return null;
  }
}

/**
 * Delete a sprint.
 *
 * @secured — Requires sprint ownership (only the owner can delete).
 */
export async function deleteSprintAction(id: string): Promise<boolean> {
  await requireSprintOwner(id);

  try {
    await prisma.sprint.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ─── Team-Scoped Queries ────────────────────────────────────────

/**
 * List sprints belonging to a specific team.
 *
 * @secured — Requires team membership.
 */
export async function listTeamSprintsAction(teamId: string): Promise<Sprint[]> {
  await requireTeamMember(teamId);

  const rows = await prisma.sprint.findMany({
    where: { teamId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapPrismaToSprint);
}

// ─── Sprint Members ─────────────────────────────────────────────

/**
 * Add a member to a sprint.
 *
 * @secured — Requires sprint ownership (only owner can add members).
 */
export async function addSprintMember(
  sprintId: string,
  userId: string,
  role: string = "member"
): Promise<void> {
  await requireSprintOwner(sprintId);

  await prisma.sprintMember.upsert({
    where: { sprintId_userId: { sprintId, userId } },
    create: { sprintId, userId, role },
    update: { role },
  });
}

/**
 * Remove a member from a sprint.
 *
 * @secured — Requires sprint ownership (only owner can remove members).
 */
export async function removeSprintMember(
  sprintId: string,
  userId: string
): Promise<void> {
  await requireSprintOwner(sprintId);

  try {
    await prisma.sprintMember.delete({
      where: { sprintId_userId: { sprintId, userId } },
    });
  } catch {
    // Member may not exist — ignore
  }
}

/**
 * List all members of a sprint.
 *
 * @secured — Requires sprint access.
 */
export async function listSprintMembers(
  sprintId: string
): Promise<SprintMemberRecord[]> {
  await requireSprintAccess(sprintId);

  const rows = await prisma.sprintMember.findMany({
    where: { sprintId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return rows.map((r) => ({
    sprintId: r.sprintId,
    userId: r.userId,
    role: r.role,
    user: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email } : undefined,
  }));
}
