"use server";

import { prisma } from "@/lib/prisma";
import type {
  Portfolio,
  PortfolioIdea,
  PortfolioIdeaStatus,
  PortfolioSummaryStats,
} from "@/lib/types";
import type {
  Portfolio as PrismaPortfolio,
  PortfolioIdea as PrismaPortfolioIdea,
} from "@prisma/client";

// ─── Prisma ↔ App Type Mappers ──────────────────────────────────

function mapPortfolio(row: PrismaPortfolio & { ideas?: PrismaPortfolioIdea[] }): Portfolio {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ideas: row.ideas?.map(mapPortfolioIdea),
  };
}

function mapPortfolioIdea(row: PrismaPortfolioIdea): PortfolioIdea {
  return {
    id: row.id,
    portfolioId: row.portfolioId,
    ideaId: row.ideaId,
    externalPatentNo: row.externalPatentNo,
    externalTitle: row.externalTitle,
    filingDate: row.filingDate?.toISOString() ?? null,
    grantDate: row.grantDate?.toISOString() ?? null,
    status: row.status as PortfolioIdeaStatus,
    notes: row.notes,
    cpcClasses: (row.cpcClasses as string[]) ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Portfolio CRUD ─────────────────────────────────────────────

export async function listPortfoliosAction(userId: string): Promise<Portfolio[]> {
  const rows = await prisma.portfolio.findMany({
    where: { userId },
    include: { ideas: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapPortfolio);
}

export async function getPortfolioAction(id: string): Promise<Portfolio | null> {
  const row = await prisma.portfolio.findUnique({
    where: { id },
    include: { ideas: true },
  });
  return row ? mapPortfolio(row) : null;
}

export async function createPortfolioAction(
  userId: string,
  name: string,
  description: string = ""
): Promise<Portfolio> {
  const row = await prisma.portfolio.create({
    data: { userId, name, description },
    include: { ideas: true },
  });
  return mapPortfolio(row);
}

export async function updatePortfolioAction(
  id: string,
  updates: { name?: string; description?: string }
): Promise<Portfolio | null> {
  const row = await prisma.portfolio.update({
    where: { id },
    data: updates,
    include: { ideas: true },
  });
  return mapPortfolio(row);
}

export async function deletePortfolioAction(id: string): Promise<boolean> {
  await prisma.portfolio.delete({ where: { id } });
  return true;
}

// ─── Portfolio Idea (Entry) CRUD ────────────────────────────────

export async function addPortfolioIdeaAction(
  portfolioId: string,
  data: {
    ideaId?: string;
    externalPatentNo?: string;
    externalTitle?: string;
    filingDate?: string;
    grantDate?: string;
    status?: PortfolioIdeaStatus;
    notes?: string;
    cpcClasses?: string[];
  }
): Promise<PortfolioIdea> {
  const row = await prisma.portfolioIdea.create({
    data: {
      portfolioId,
      ideaId: data.ideaId || null,
      externalPatentNo: data.externalPatentNo || null,
      externalTitle: data.externalTitle || null,
      filingDate: data.filingDate ? new Date(data.filingDate) : null,
      grantDate: data.grantDate ? new Date(data.grantDate) : null,
      status: data.status || "pending",
      notes: data.notes || "",
      cpcClasses: data.cpcClasses || [],
    },
  });
  return mapPortfolioIdea(row);
}

export async function updatePortfolioIdeaAction(
  id: string,
  updates: {
    externalPatentNo?: string;
    externalTitle?: string;
    filingDate?: string | null;
    grantDate?: string | null;
    status?: PortfolioIdeaStatus;
    notes?: string;
    cpcClasses?: string[];
  }
): Promise<PortfolioIdea | null> {
  const data: Record<string, unknown> = {};
  if (updates.externalPatentNo !== undefined) data.externalPatentNo = updates.externalPatentNo;
  if (updates.externalTitle !== undefined) data.externalTitle = updates.externalTitle;
  if (updates.filingDate !== undefined) data.filingDate = updates.filingDate ? new Date(updates.filingDate) : null;
  if (updates.grantDate !== undefined) data.grantDate = updates.grantDate ? new Date(updates.grantDate) : null;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.notes !== undefined) data.notes = updates.notes;
  if (updates.cpcClasses !== undefined) data.cpcClasses = updates.cpcClasses;

  const row = await prisma.portfolioIdea.update({
    where: { id },
    data,
  });
  return mapPortfolioIdea(row);
}

export async function removePortfolioIdeaAction(id: string): Promise<boolean> {
  await prisma.portfolioIdea.delete({ where: { id } });
  return true;
}

// ─── Portfolio Stats ────────────────────────────────────────────

export async function getPortfolioStatsAction(portfolioId: string): Promise<PortfolioSummaryStats> {
  const ideas = await prisma.portfolioIdea.findMany({
    where: { portfolioId },
  });

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const byStatus: Record<PortfolioIdeaStatus, number> = {
    pending: 0,
    filed: 0,
    granted: 0,
    abandoned: 0,
  };

  const byCpc: Record<string, number> = {};
  let filedThisYear = 0;
  let grantedThisYear = 0;

  for (const idea of ideas) {
    const status = idea.status as PortfolioIdeaStatus;
    byStatus[status] = (byStatus[status] || 0) + 1;

    const cpcClasses = (idea.cpcClasses as string[]) || [];
    for (const cpc of cpcClasses) {
      const prefix = cpc.slice(0, 4); // e.g. "G06F"
      byCpc[prefix] = (byCpc[prefix] || 0) + 1;
    }

    if (idea.filingDate && idea.filingDate >= yearStart) {
      filedThisYear++;
    }
    if (idea.grantDate && idea.grantDate >= yearStart) {
      grantedThisYear++;
    }
  }

  return {
    totalEntries: ideas.length,
    byStatus,
    byCpc,
    filedThisYear,
    grantedThisYear,
  };
}
