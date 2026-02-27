"use client";

import { create } from "zustand";
import type {
  PatentDocument,
  DocumentVersion,
  DocumentComment,
  DocumentImage,
  DocumentStatus,
  VersionTrigger,
} from "@/lib/types";
import {
  createPatentDocument,
  getPatentDocumentByIdeaId,
  updatePatentDocumentContent,
  updatePatentDocumentStatus,
} from "@/lib/actions/patent-documents";
import {
  createDocumentVersion,
  listDocumentVersions,
  restoreDocumentVersion,
} from "@/lib/actions/document-versions";
import {
  addDocumentComment,
  listDocumentComments,
  resolveDocumentComment,
  unresolveDocumentComment,
  deleteDocumentComment,
} from "@/lib/actions/document-comments";

// ─── Initial State ───────────────────────────────────────────────

const INITIAL_STATE = {
  // Core document
  document: null as PatentDocument | null,
  isLoading: false,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null as string | null,
  error: null as string | null,

  // Comments
  comments: [] as DocumentComment[],
  activeCommentId: null as string | null,
  commentSidebarOpen: false,
  commentFilter: "all" as "all" | "unresolved" | "ai",

  // Versions
  versions: [] as DocumentVersion[],
  versionPanelOpen: false,
  previewVersionId: null as string | null,

  // Images
  images: [] as DocumentImage[],
} as const;

// ─── Store Interface ─────────────────────────────────────────────

interface PatentDocumentState {
  // Core document state
  document: PatentDocument | null;
  isLoading: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  error: string | null;

  // Comments
  comments: DocumentComment[];
  activeCommentId: string | null;
  commentSidebarOpen: boolean;
  commentFilter: "all" | "unresolved" | "ai";

  // Versions
  versions: DocumentVersion[];
  versionPanelOpen: boolean;
  previewVersionId: string | null;

  // Images
  images: DocumentImage[];

  // Actions - Document
  loadDocument: (ideaId: string) => Promise<void>;
  initializeDocument: (
    ideaId: string,
    initialContent: Record<string, unknown>,
    title?: string
  ) => Promise<void>;
  updateContent: (content: Record<string, unknown>) => void;
  saveDocument: (label?: string, trigger?: VersionTrigger) => Promise<void>;
  setStatus: (status: DocumentStatus) => Promise<void>;

  // Actions - Comments
  loadComments: () => Promise<void>;
  addComment: (data: {
    content: string;
    anchorFrom?: number;
    anchorTo?: number;
    anchorText?: string;
    parentId?: string;
    source?: string;
  }) => Promise<DocumentComment | null>;
  resolveComment: (id: string) => Promise<void>;
  unresolveComment: (id: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  setActiveComment: (id: string | null) => void;
  toggleCommentSidebar: () => void;
  setCommentFilter: (filter: "all" | "unresolved" | "ai") => void;

  // Actions - Versions
  loadVersions: () => Promise<void>;
  restoreVersion: (versionId: string) => Promise<void>;
  toggleVersionPanel: () => void;
  setPreviewVersion: (id: string | null) => void;

  // Actions - Images
  addImage: (image: DocumentImage) => void;
  removeImage: (id: string) => void;
  setImages: (images: DocumentImage[]) => void;

  // Reset
  reset: () => void;
}

// ─── Helper ──────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred";
}

// ─── Store ───────────────────────────────────────────────────────

export const usePatentDocumentStore = create<PatentDocumentState>(
  (set, get) => ({
    // ── Initial values ───────────────────────────────────────────
    ...INITIAL_STATE,

    // ── Document Actions ─────────────────────────────────────────

    loadDocument: async (ideaId: string) => {
      set({ isLoading: true, error: null });
      try {
        const doc = await getPatentDocumentByIdeaId(ideaId);
        set({
          document: doc,
          isLoading: false,
          isDirty: false,
          lastSavedAt: doc?.updatedAt ?? null,
        });
      } catch (err) {
        set({ isLoading: false, error: errorMessage(err) });
      }
    },

    initializeDocument: async (
      ideaId: string,
      initialContent: Record<string, unknown>,
      title?: string
    ) => {
      set({ isLoading: true, error: null });
      try {
        const doc = await createPatentDocument(ideaId, initialContent, title);
        set({
          document: doc,
          isLoading: false,
          isDirty: false,
          lastSavedAt: doc.updatedAt,
        });
      } catch (err) {
        set({ isLoading: false, error: errorMessage(err) });
      }
    },

    updateContent: (content: Record<string, unknown>) => {
      const { document } = get();
      if (!document) return;

      set({
        document: { ...document, content },
        isDirty: true,
        error: null,
      });
    },

    saveDocument: async (label?: string, trigger?: VersionTrigger) => {
      const { document, isDirty, isSaving } = get();
      if (!document || isSaving) return;

      // Allow explicit saves even when not dirty (e.g. manual snapshots),
      // but skip auto-saves when there are no pending changes.
      if (trigger === "auto" && !isDirty) return;

      set({ isSaving: true, error: null });
      try {
        // 1. Persist the content to the database
        const updated = await updatePatentDocumentContent(
          document.id,
          document.content,
          document.paragraphCounter
        );

        // 2. Create a version snapshot
        await createDocumentVersion(
          document.id,
          label ?? "Save",
          trigger ?? "manual"
        );

        const now = new Date().toISOString();
        set({
          document: updated,
          isSaving: false,
          isDirty: false,
          lastSavedAt: now,
        });
      } catch (err) {
        set({ isSaving: false, error: errorMessage(err) });
      }
    },

    setStatus: async (status: DocumentStatus) => {
      const { document } = get();
      if (!document) return;

      set({ error: null });
      try {
        const updated = await updatePatentDocumentStatus(document.id, status);

        // Create a version for the status change
        await createDocumentVersion(
          document.id,
          `Status changed to ${status}`,
          "stage_change"
        );

        set({ document: updated });
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    // ── Comment Actions ──────────────────────────────────────────

    loadComments: async () => {
      const { document } = get();
      if (!document) return;

      try {
        const comments = await listDocumentComments(document.id);
        set({ comments });
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    addComment: async (data) => {
      const { document } = get();
      if (!document) return null;

      try {
        const comment = await addDocumentComment(document.id, data);
        set((s) => {
          // If this is a reply, attach it to the parent in the tree
          if (comment.parentId) {
            return {
              comments: s.comments.map((c) =>
                c.id === comment.parentId
                  ? { ...c, replies: [...(c.replies ?? []), comment] }
                  : c
              ),
            };
          }
          // Top-level comment — append
          return { comments: [...s.comments, comment] };
        });
        return comment;
      } catch (err) {
        set({ error: errorMessage(err) });
        return null;
      }
    },

    resolveComment: async (id: string) => {
      try {
        const updated = await resolveDocumentComment(id);
        set((s) => ({
          comments: s.comments.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        }));
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    unresolveComment: async (id: string) => {
      try {
        const updated = await unresolveDocumentComment(id);
        set((s) => ({
          comments: s.comments.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        }));
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    deleteComment: async (id: string) => {
      try {
        const success = await deleteDocumentComment(id);
        if (success) {
          set((s) => ({
            comments: s.comments
              .filter((c) => c.id !== id)
              .map((c) => ({
                ...c,
                replies: c.replies?.filter((r) => r.id !== id),
              })),
            activeCommentId:
              s.activeCommentId === id ? null : s.activeCommentId,
          }));
        }
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    setActiveComment: (id: string | null) => set({ activeCommentId: id }),

    toggleCommentSidebar: () =>
      set((s) => ({ commentSidebarOpen: !s.commentSidebarOpen })),

    setCommentFilter: (filter) => set({ commentFilter: filter }),

    // ── Version Actions ──────────────────────────────────────────

    loadVersions: async () => {
      const { document } = get();
      if (!document) return;

      try {
        const versions = await listDocumentVersions(document.id);
        set({ versions });
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    restoreVersion: async (versionId: string) => {
      const { document } = get();
      if (!document) return;

      set({ error: null });
      try {
        const restored = await restoreDocumentVersion(document.id, versionId);
        set({
          document: restored,
          isDirty: false,
          lastSavedAt: new Date().toISOString(),
          previewVersionId: null,
        });
        // Reload the version list to include the new "Restored from" entry
        const versions = await listDocumentVersions(document.id);
        set({ versions });
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    toggleVersionPanel: () =>
      set((s) => ({ versionPanelOpen: !s.versionPanelOpen })),

    setPreviewVersion: (id: string | null) =>
      set({ previewVersionId: id }),

    // ── Image Actions ────────────────────────────────────────────

    addImage: (image: DocumentImage) =>
      set((s) => ({ images: [...s.images, image] })),

    removeImage: (id: string) =>
      set((s) => ({ images: s.images.filter((img) => img.id !== id) })),

    setImages: (images: DocumentImage[]) => set({ images }),

    // ── Reset ────────────────────────────────────────────────────

    reset: () =>
      set({
        document: null,
        isLoading: false,
        isDirty: false,
        isSaving: false,
        lastSavedAt: null,
        error: null,
        comments: [],
        activeCommentId: null,
        commentSidebarOpen: false,
        commentFilter: "all",
        versions: [],
        versionPanelOpen: false,
        previewVersionId: null,
        images: [],
      }),
  })
);
