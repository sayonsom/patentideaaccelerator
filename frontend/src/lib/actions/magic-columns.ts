"use server";

import { prisma } from "@/lib/prisma";
import type {
  MagicColumn,
  MagicColumnValue,
  MagicColumnValueStatus,
} from "@/lib/types";
import type {
  MagicColumn as PrismaMagicColumn,
  MagicColumnValue as PrismaMagicColumnValue,
} from "@prisma/client";

// ─── Mappers ────────────────────────────────────────────────────

function mapColumn(row: PrismaMagicColumn): MagicColumn {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    prompt: row.prompt,
    isPreset: row.isPreset,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapValue(row: PrismaMagicColumnValue): MagicColumnValue {
  return {
    id: row.id,
    columnId: row.columnId,
    ideaId: row.ideaId,
    value: row.value,
    status: row.status as MagicColumnValueStatus,
    computedAt: row.computedAt?.toISOString() ?? null,
  };
}

// ─── Column CRUD ────────────────────────────────────────────────

export async function listMagicColumnsAction(userId: string): Promise<MagicColumn[]> {
  const rows = await prisma.magicColumn.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(mapColumn);
}

export async function createMagicColumnAction(
  userId: string,
  data: { name: string; prompt: string; isPreset?: boolean }
): Promise<MagicColumn> {
  // Get max sortOrder
  const max = await prisma.magicColumn.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  const nextSort = (max._max.sortOrder ?? -1) + 1;

  const row = await prisma.magicColumn.create({
    data: {
      userId,
      name: data.name,
      prompt: data.prompt,
      isPreset: data.isPreset ?? false,
      sortOrder: nextSort,
    },
  });
  return mapColumn(row);
}

export async function deleteMagicColumnAction(id: string): Promise<boolean> {
  await prisma.magicColumn.delete({ where: { id } });
  return true;
}

// ─── Value CRUD ─────────────────────────────────────────────────

export async function listMagicColumnValuesAction(
  columnId: string,
  ideaIds?: string[]
): Promise<MagicColumnValue[]> {
  const rows = await prisma.magicColumnValue.findMany({
    where: {
      columnId,
      ...(ideaIds ? { ideaId: { in: ideaIds } } : {}),
    },
  });
  return rows.map(mapValue);
}

export async function listAllMagicValuesForUserAction(
  userId: string,
  ideaIds: string[]
): Promise<MagicColumnValue[]> {
  const columns = await prisma.magicColumn.findMany({
    where: { userId },
    select: { id: true },
  });
  const columnIds = columns.map((c) => c.id);
  if (columnIds.length === 0 || ideaIds.length === 0) return [];

  const rows = await prisma.magicColumnValue.findMany({
    where: {
      columnId: { in: columnIds },
      ideaId: { in: ideaIds },
    },
  });
  return rows.map(mapValue);
}

export async function upsertMagicColumnValueAction(
  columnId: string,
  ideaId: string,
  value: string,
  status: MagicColumnValueStatus = "done"
): Promise<MagicColumnValue> {
  const row = await prisma.magicColumnValue.upsert({
    where: {
      columnId_ideaId: { columnId, ideaId },
    },
    create: {
      columnId,
      ideaId,
      value,
      status,
      computedAt: status === "done" ? new Date() : null,
    },
    update: {
      value,
      status,
      computedAt: status === "done" ? new Date() : null,
    },
  });
  return mapValue(row);
}

export async function setMagicColumnValueStatusAction(
  columnId: string,
  ideaId: string,
  status: MagicColumnValueStatus
): Promise<void> {
  await prisma.magicColumnValue.upsert({
    where: {
      columnId_ideaId: { columnId, ideaId },
    },
    create: { columnId, ideaId, status, value: "" },
    update: { status },
  });
}
