"use server";

import { prisma } from "@/lib/prisma";
import {
  requireSession,
  requireIdeaAccess,
  ForbiddenError,
  NotFoundError,
} from "@/lib/actions/authorization";
import type { PatentDocument, DocumentStatus } from "@/lib/types";
import { Prisma } from "@prisma/client";
import type { PatentDocument as PrismaPatentDocument } from "@prisma/client";

// ─── Prisma ↔ App Type Mappers ──────────────────────────────────

function mapPrismaToPatentDocument(row: PrismaPatentDocument): PatentDocument {
  return {
    id: row.id,
    ideaId: row.ideaId,
    userId: row.userId,
    title: row.title,
    content: (row.content as Record<string, unknown>) ?? {},
    status: row.status as DocumentStatus,
    paragraphCounter: row.paragraphCounter,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Document Access Guard ───────────────────────────────────────

/**
 * Verify the current user owns a patent document.
 * Returns the userId and the document row.
 *
 * @throws NotFoundError if the document does not exist.
 * @throws ForbiddenError if the user does not own the document.
 */
async function requireDocumentOwner(documentId: string) {
  const { userId } = await requireSession();

  const doc = await prisma.patentDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) {
    throw new NotFoundError("Patent document");
  }

  if (doc.userId !== userId) {
    throw new ForbiddenError("patent document");
  }

  return { userId, document: doc };
}

/**
 * Verify the current user can access a patent document (read-level).
 * Access is granted if the user owns the document OR has access to
 * the underlying idea (e.g. via team membership).
 *
 * @throws NotFoundError if the document does not exist.
 * @throws ForbiddenError if the user cannot access the document.
 */
async function requireDocumentAccess(documentId: string) {
  const { userId } = await requireSession();

  const doc = await prisma.patentDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) {
    throw new NotFoundError("Patent document");
  }

  // Owner always has access
  if (doc.userId === userId) {
    return { userId, document: doc };
  }

  // Check idea-level access (covers team membership)
  await requireIdeaAccess(doc.ideaId);
  return { userId, document: doc };
}

// ─── CRUD Actions ───────────────────────────────────────────────

/**
 * Create a new patent document for an idea.
 *
 * @secured — Requires authentication and access to the idea.
 *            Only one document per idea (enforced by unique constraint).
 */
export async function createPatentDocument(
  ideaId: string,
  initialContent: Record<string, unknown>,
  title?: string
): Promise<PatentDocument> {
  const { userId } = await requireSession();

  // Verify the user has access to the idea
  await requireIdeaAccess(ideaId);

  const row = await prisma.patentDocument.create({
    data: {
      ideaId,
      userId,
      title: title ?? "",
      content: initialContent as unknown as Prisma.InputJsonValue,
      status: "draft",
      paragraphCounter: 0,
    },
  });

  return mapPrismaToPatentDocument(row);
}

/**
 * Get a patent document by its linked idea ID.
 *
 * @secured — Requires access to the idea (owner OR team member).
 */
export async function getPatentDocumentByIdeaId(
  ideaId: string
): Promise<PatentDocument | null> {
  // Verify the user has access to the idea
  await requireIdeaAccess(ideaId);

  const row = await prisma.patentDocument.findUnique({
    where: { ideaId },
  });

  return row ? mapPrismaToPatentDocument(row) : null;
}

/**
 * Update the content JSON of a patent document.
 *
 * @secured — Requires document access (owner or idea-level access).
 */
export async function updatePatentDocumentContent(
  documentId: string,
  content: Record<string, unknown>,
  paragraphCounter?: number
): Promise<PatentDocument> {
  await requireDocumentAccess(documentId);

  const data: Prisma.PatentDocumentUncheckedUpdateInput = {
    content: content as unknown as Prisma.InputJsonValue,
  };

  if (paragraphCounter !== undefined) {
    data.paragraphCounter = paragraphCounter;
  }

  const row = await prisma.patentDocument.update({
    where: { id: documentId },
    data,
  });

  return mapPrismaToPatentDocument(row);
}

/**
 * Update the status of a patent document.
 *
 * @secured — Requires document ownership (only the creator can change status).
 */
export async function updatePatentDocumentStatus(
  documentId: string,
  status: string
): Promise<PatentDocument> {
  await requireDocumentOwner(documentId);

  const row = await prisma.patentDocument.update({
    where: { id: documentId },
    data: { status },
  });

  return mapPrismaToPatentDocument(row);
}

/**
 * Delete a patent document.
 *
 * @secured — Requires document ownership (only the creator can delete).
 */
export async function deletePatentDocument(
  documentId: string
): Promise<boolean> {
  await requireDocumentOwner(documentId);

  try {
    await prisma.patentDocument.delete({ where: { id: documentId } });
    return true;
  } catch {
    return false;
  }
}
