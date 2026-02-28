"use server";

import { prisma } from "@/lib/prisma";
import {
  requireSession,
  ForbiddenError,
  NotFoundError,
} from "@/lib/actions/authorization";
import type { DocumentVersion, PatentDocument, DocumentStatus, VersionTrigger } from "@/lib/types";
import { Prisma } from "@prisma/client";
import type { DocumentVersion as PrismaDocumentVersion, PatentDocument as PrismaPatentDocument } from "@prisma/client";

// ─── Prisma ↔ App Type Mappers ──────────────────────────────────

function mapPrismaToDocumentVersion(row: PrismaDocumentVersion): DocumentVersion {
  return {
    id: row.id,
    documentId: row.documentId,
    versionNum: row.versionNum,
    content: (row.content as Record<string, unknown>) ?? {},
    label: row.label,
    trigger: row.trigger as VersionTrigger,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPrismaToPatentDocument(row: PrismaPatentDocument): PatentDocument {
  return {
    id: row.id,
    ideaId: row.ideaId,
    userId: row.userId,
    title: row.title,
    content: (row.content as Record<string, unknown>) ?? {},
    status: row.status as DocumentStatus,
    documentType: row.documentType as import("@/lib/types").DocumentType,
    templateId: row.templateId,
    sortOrder: row.sortOrder,
    wordCount: row.wordCount,
    paragraphCounter: row.paragraphCounter,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Document Access Guard ───────────────────────────────────────

/**
 * Verify the current user owns the patent document that a version belongs to.
 *
 * @throws NotFoundError if the document does not exist.
 * @throws ForbiddenError if the user does not own the document.
 */
async function requireDocumentOwnerById(documentId: string) {
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

// ─── Version Actions ────────────────────────────────────────────

/**
 * Create a new version snapshot of a patent document.
 * Captures the document's current content and assigns the next version number.
 *
 * @secured — Requires document ownership.
 */
export async function createDocumentVersion(
  documentId: string,
  label: string,
  trigger: string
): Promise<DocumentVersion> {
  const { document } = await requireDocumentOwnerById(documentId);

  // Determine the next version number
  const maxVersion = await prisma.documentVersion.aggregate({
    where: { documentId },
    _max: { versionNum: true },
  });
  const nextVersionNum = (maxVersion._max.versionNum ?? 0) + 1;

  const row = await prisma.documentVersion.create({
    data: {
      documentId,
      versionNum: nextVersionNum,
      content: document.content as unknown as Prisma.InputJsonValue,
      label,
      trigger,
    },
  });

  return mapPrismaToDocumentVersion(row);
}

/**
 * List all versions for a patent document, newest first.
 *
 * @secured — Requires document ownership.
 */
export async function listDocumentVersions(
  documentId: string
): Promise<DocumentVersion[]> {
  await requireDocumentOwnerById(documentId);

  const rows = await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { versionNum: "desc" },
  });

  return rows.map(mapPrismaToDocumentVersion);
}

/**
 * Get a single version by ID.
 *
 * @secured — Requires ownership of the parent document.
 */
export async function getDocumentVersion(
  versionId: string
): Promise<DocumentVersion | null> {
  const row = await prisma.documentVersion.findUnique({
    where: { id: versionId },
  });

  if (!row) return null;

  // Verify ownership of the parent document
  await requireDocumentOwnerById(row.documentId);

  return mapPrismaToDocumentVersion(row);
}

/**
 * Restore a document to a previous version's content.
 * This sets the document content to the version's snapshot and creates
 * a new version with label "Restored from v{X}", trigger "manual".
 *
 * @secured — Requires document ownership.
 * @returns The updated PatentDocument with restored content.
 */
export async function restoreDocumentVersion(
  documentId: string,
  versionId: string
): Promise<PatentDocument> {
  await requireDocumentOwnerById(documentId);

  // Get the version to restore
  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new NotFoundError("Document version");
  }

  if (version.documentId !== documentId) {
    throw new ForbiddenError("document version");
  }

  // Determine the next version number for the restore snapshot
  const maxVersion = await prisma.documentVersion.aggregate({
    where: { documentId },
    _max: { versionNum: true },
  });
  const nextVersionNum = (maxVersion._max.versionNum ?? 0) + 1;

  // Use a transaction to atomically update the document and create the new version
  const [updatedDoc] = await prisma.$transaction([
    // 1. Set document content to the restored version's content
    prisma.patentDocument.update({
      where: { id: documentId },
      data: {
        content: version.content as unknown as Prisma.InputJsonValue,
      },
    }),
    // 2. Create a new version recording the restoration
    prisma.documentVersion.create({
      data: {
        documentId,
        versionNum: nextVersionNum,
        content: version.content as unknown as Prisma.InputJsonValue,
        label: `Restored from v${version.versionNum}`,
        trigger: "manual",
      },
    }),
  ]);

  return mapPrismaToPatentDocument(updatedDoc);
}

/**
 * Prune old auto-save versions, keeping only the most recent `keepCount`.
 * Only deletes versions with trigger "auto". Manual and other versions
 * are always preserved.
 *
 * @secured — Requires document ownership.
 */
export async function pruneAutoSaveVersions(
  documentId: string,
  keepCount: number
): Promise<void> {
  await requireDocumentOwnerById(documentId);

  // Get all auto-save versions ordered by versionNum DESC
  const autoSaveVersions = await prisma.documentVersion.findMany({
    where: { documentId, trigger: "auto" },
    orderBy: { versionNum: "desc" },
    select: { id: true },
  });

  // If we have more auto-saves than keepCount, delete the oldest ones
  if (autoSaveVersions.length > keepCount) {
    const versionsToDelete = autoSaveVersions.slice(keepCount);
    const idsToDelete = versionsToDelete.map((v) => v.id);

    await prisma.documentVersion.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }
}
