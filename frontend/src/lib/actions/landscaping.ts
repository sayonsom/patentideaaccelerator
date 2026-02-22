"use server";

import { prisma } from "@/lib/prisma";
import type {
  LandscapingSession,
  LandscapingPatent,
  LandscapingTaxonomy,
  LandscapingStatus,
} from "@/lib/types";
import type {
  LandscapingSession as PrismaSession,
  LandscapingPatent as PrismaPatent,
} from "@prisma/client";

// ─── Prisma ↔ App Type Mappers ──────────────────────────────────

function mapSession(row: PrismaSession & { patents?: PrismaPatent[] }): LandscapingSession {
  const taxonomy = row.taxonomy as LandscapingTaxonomy | null;
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    techDescription: row.techDescription,
    taxonomy: taxonomy && typeof taxonomy === "object" && "categories" in taxonomy ? taxonomy : null,
    status: row.status as LandscapingStatus,
    patents: row.patents?.map(mapPatent),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapPatent(row: PrismaPatent): LandscapingPatent {
  return {
    id: row.id,
    sessionId: row.sessionId,
    patentNumber: row.patentNumber,
    title: row.title,
    abstract: row.abstract,
    filingDate: row.filingDate?.toISOString() ?? null,
    cpcClasses: (row.cpcClasses as string[]) ?? [],
    taxonomyBucket: row.taxonomyBucket,
    relevanceScore: row.relevanceScore,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── Session CRUD ───────────────────────────────────────────────

export async function listLandscapingSessionsAction(userId: string): Promise<LandscapingSession[]> {
  const rows = await prisma.landscapingSession.findMany({
    where: { userId },
    include: { patents: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapSession);
}

export async function getLandscapingSessionAction(id: string): Promise<LandscapingSession | null> {
  const row = await prisma.landscapingSession.findUnique({
    where: { id },
    include: { patents: true },
  });
  return row ? mapSession(row) : null;
}

export async function createLandscapingSessionAction(
  userId: string,
  name: string,
  techDescription: string
): Promise<LandscapingSession> {
  const row = await prisma.landscapingSession.create({
    data: { userId, name, techDescription, status: "draft" },
    include: { patents: true },
  });
  return mapSession(row);
}

export async function updateLandscapingSessionAction(
  id: string,
  updates: {
    name?: string;
    techDescription?: string;
    taxonomy?: LandscapingTaxonomy;
    status?: LandscapingStatus;
  }
): Promise<LandscapingSession | null> {
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.techDescription !== undefined) data.techDescription = updates.techDescription;
  if (updates.taxonomy !== undefined) data.taxonomy = updates.taxonomy;
  if (updates.status !== undefined) data.status = updates.status;

  const row = await prisma.landscapingSession.update({
    where: { id },
    data,
    include: { patents: true },
  });
  return mapSession(row);
}

export async function deleteLandscapingSessionAction(id: string): Promise<boolean> {
  await prisma.landscapingSession.delete({ where: { id } });
  return true;
}

// ─── Patent Results ─────────────────────────────────────────────

export async function addLandscapingPatentsAction(
  sessionId: string,
  patents: {
    patentNumber: string;
    title: string;
    abstract: string;
    filingDate?: string;
    cpcClasses?: string[];
    taxonomyBucket: string;
    relevanceScore?: number;
  }[]
): Promise<number> {
  // Use createMany for bulk insert — skip duplicates
  const data = patents.map((p) => ({
    sessionId,
    patentNumber: p.patentNumber,
    title: p.title,
    abstract: p.abstract,
    filingDate: p.filingDate ? new Date(p.filingDate) : null,
    cpcClasses: p.cpcClasses || [],
    taxonomyBucket: p.taxonomyBucket,
    relevanceScore: p.relevanceScore || 0,
  }));

  const result = await prisma.landscapingPatent.createMany({
    data,
    skipDuplicates: true,
  });
  return result.count;
}

export async function clearLandscapingPatentsAction(sessionId: string): Promise<void> {
  await prisma.landscapingPatent.deleteMany({ where: { sessionId } });
}
