"use server";

import { prisma } from "@/lib/prisma";
import {
  requireSession,
  ForbiddenError,
  NotFoundError,
} from "@/lib/actions/authorization";
import type { DocumentComment, CommentSource } from "@/lib/types";
import type {
  DocumentComment as PrismaDocumentComment,
  User as PrismaUser,
} from "@prisma/client";

// ─── Prisma ↔ App Type Mappers ──────────────────────────────────

type PrismaCommentWithUser = PrismaDocumentComment & {
  user?: Pick<PrismaUser, "id" | "name" | "email">;
  replies?: (PrismaDocumentComment & {
    user?: Pick<PrismaUser, "id" | "name" | "email">;
  })[];
};

function mapPrismaToDocumentComment(row: PrismaCommentWithUser): DocumentComment {
  return {
    id: row.id,
    documentId: row.documentId,
    userId: row.userId,
    content: row.content,
    anchorFrom: row.anchorFrom,
    anchorTo: row.anchorTo,
    anchorText: row.anchorText,
    parentId: row.parentId,
    resolved: row.resolved,
    source: row.source as CommentSource,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: row.user
      ? { id: row.user.id, name: row.user.name, email: row.user.email }
      : undefined,
    replies: row.replies?.map((reply) => mapPrismaToDocumentComment(reply)),
  };
}

// ─── Document Access Guards ──────────────────────────────────────

/**
 * Verify the current user can access a patent document (for comments).
 * Access is granted if the user owns the document OR has access to the
 * underlying idea via team membership.
 *
 * @throws NotFoundError if the document does not exist.
 * @throws ForbiddenError if the user cannot access the document.
 */
async function requireDocumentAccessForComments(documentId: string) {
  const { userId } = await requireSession();

  const doc = await prisma.patentDocument.findUnique({
    where: { id: documentId },
    select: { id: true, userId: true, ideaId: true },
  });

  if (!doc) {
    throw new NotFoundError("Patent document");
  }

  // Owner always has access
  if (doc.userId === userId) {
    return { userId, documentId: doc.id, ideaId: doc.ideaId };
  }

  // Check idea-level access (team membership, etc.)
  const idea = await prisma.idea.findUnique({
    where: { id: doc.ideaId },
    select: { userId: true, teamId: true },
  });

  if (!idea) {
    throw new NotFoundError("Idea");
  }

  if (idea.userId === userId) {
    return { userId, documentId: doc.id, ideaId: doc.ideaId };
  }

  if (idea.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: idea.teamId, userId } },
    });
    if (membership) {
      return { userId, documentId: doc.id, ideaId: doc.ideaId };
    }
  }

  throw new ForbiddenError("patent document");
}

/**
 * Verify the current user can manage a comment (resolve/unresolve/delete).
 * A user can manage a comment if they own the comment OR own the document.
 *
 * @throws NotFoundError if the comment does not exist.
 * @throws ForbiddenError if the user has no management rights.
 */
async function requireCommentManageAccess(commentId: string) {
  const { userId } = await requireSession();

  const comment = await prisma.documentComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new NotFoundError("Document comment");
  }

  // Comment author can manage
  if (comment.userId === userId) {
    return { userId, comment };
  }

  // Document owner can also manage any comment
  const doc = await prisma.patentDocument.findUnique({
    where: { id: comment.documentId },
    select: { userId: true },
  });

  if (doc && doc.userId === userId) {
    return { userId, comment };
  }

  throw new ForbiddenError("document comment");
}

// ─── Comment Actions ────────────────────────────────────────────

/**
 * Add a comment to a patent document.
 * Supports inline annotations (anchorFrom/anchorTo) and threaded replies (parentId).
 *
 * @secured — Requires document access.
 */
export async function addDocumentComment(
  documentId: string,
  data: {
    content: string;
    anchorFrom?: number;
    anchorTo?: number;
    anchorText?: string;
    parentId?: string;
    source?: string;
  }
): Promise<DocumentComment> {
  const { userId } = await requireDocumentAccessForComments(documentId);

  const row = await prisma.documentComment.create({
    data: {
      documentId,
      userId,
      content: data.content,
      anchorFrom: data.anchorFrom ?? null,
      anchorTo: data.anchorTo ?? null,
      anchorText: data.anchorText ?? null,
      parentId: data.parentId ?? null,
      source: data.source ?? "user",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return mapPrismaToDocumentComment(row);
}

/**
 * List all comments for a patent document.
 * Returns top-level comments with their replies, ordered by anchor position.
 *
 * @secured — Requires document access.
 */
export async function listDocumentComments(
  documentId: string
): Promise<DocumentComment[]> {
  await requireDocumentAccessForComments(documentId);

  const rows = await prisma.documentComment.findMany({
    where: { documentId, parentId: null },
    orderBy: [{ anchorFrom: "asc" }, { createdAt: "asc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return rows.map(mapPrismaToDocumentComment);
}

/**
 * Resolve a document comment (mark as addressed).
 *
 * @secured — Requires comment management access (comment author or document owner).
 */
export async function resolveDocumentComment(
  commentId: string
): Promise<DocumentComment> {
  await requireCommentManageAccess(commentId);

  const row = await prisma.documentComment.update({
    where: { id: commentId },
    data: { resolved: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return mapPrismaToDocumentComment(row);
}

/**
 * Unresolve a document comment (re-open).
 *
 * @secured — Requires comment management access (comment author or document owner).
 */
export async function unresolveDocumentComment(
  commentId: string
): Promise<DocumentComment> {
  await requireCommentManageAccess(commentId);

  const row = await prisma.documentComment.update({
    where: { id: commentId },
    data: { resolved: false },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return mapPrismaToDocumentComment(row);
}

/**
 * Delete a document comment and all its replies.
 *
 * @secured — Requires comment management access (comment author or document owner).
 */
export async function deleteDocumentComment(
  commentId: string
): Promise<boolean> {
  const { comment } = await requireCommentManageAccess(commentId);

  try {
    // Delete replies first (children), then the parent comment
    // Prisma's onDelete: SetNull handles the parent reference, but we want
    // full cascading delete of the thread when the root is removed.
    await prisma.$transaction([
      prisma.documentComment.deleteMany({
        where: { parentId: comment.id },
      }),
      prisma.documentComment.delete({
        where: { id: commentId },
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}
