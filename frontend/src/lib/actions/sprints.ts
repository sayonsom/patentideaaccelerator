"use server";

import { prisma } from "@/lib/prisma";
import type { Sprint, SessionMode, SprintPhase } from "@/lib/types";
import type { Sprint as PrismaSprint, Prisma } from "@prisma/client";

// ─── Mapper ─────────────────────────────────────────────────────

function mapPrismaToSprint(row: PrismaSprint): Sprint {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
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

export async function listSprintsAction(ownerId: string): Promise<Sprint[]> {
  const rows = await prisma.sprint.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapPrismaToSprint);
}

export async function getSprintAction(id: string): Promise<Sprint | null> {
  const row = await prisma.sprint.findUnique({ where: { id } });
  return row ? mapPrismaToSprint(row) : null;
}

export async function createSprintAction(data: {
  id?: string;
  name: string;
  ownerId: string;
  sessionMode?: SessionMode;
  phase?: SprintPhase;
}): Promise<Sprint> {
  const row = await prisma.sprint.create({
    data: {
      ...(data.id ? { id: data.id } : {}),
      name: data.name,
      ownerId: data.ownerId,
      sessionMode: data.sessionMode ?? "quantity",
      phase: data.phase ?? "foundation",
    },
  });
  return mapPrismaToSprint(row);
}

export async function updateSprintAction(
  id: string,
  updates: Partial<Pick<Sprint, "name" | "status" | "sessionMode" | "phase" | "timerSecondsRemaining" | "timerRunning" | "startedAt">>
): Promise<Sprint | null> {
  try {
    const data: Prisma.SprintUncheckedUpdateInput = {};
    if (updates.name !== undefined) data.name = updates.name;
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

export async function deleteSprintAction(id: string): Promise<boolean> {
  try {
    await prisma.sprint.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ─── Sprint Members ─────────────────────────────────────────────

export async function addSprintMember(
  sprintId: string,
  userId: string,
  role: string = "member"
): Promise<void> {
  await prisma.sprintMember.upsert({
    where: { sprintId_userId: { sprintId, userId } },
    create: { sprintId, userId, role },
    update: { role },
  });
}

export async function removeSprintMember(
  sprintId: string,
  userId: string
): Promise<void> {
  try {
    await prisma.sprintMember.delete({
      where: { sprintId_userId: { sprintId, userId } },
    });
  } catch {
    // Member may not exist — ignore
  }
}

export async function listSprintMembers(
  sprintId: string
): Promise<{ userId: string; role: string }[]> {
  const rows = await prisma.sprintMember.findMany({
    where: { sprintId },
  });
  return rows.map((r) => ({ userId: r.userId, role: r.role }));
}
