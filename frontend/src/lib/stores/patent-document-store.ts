"use client";

import { create } from "zustand";
import type {
  PatentDocument,
  DocumentVersion,
  DocumentComment,
  DocumentImage,
  DocumentStatus,
  DocumentType,
  VersionTrigger,
} from "@/lib/types";
import {
  createPatentDocument,
  getPatentDocumentsByIdeaId,
  updatePatentDocumentContent,
  updatePatentDocumentStatus,
  duplicatePatentDocument,
  deletePatentDocument,
  updatePatentDocumentTitle,
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
  // Multi-document list
  documents: [] as PatentDocument[],
  selectedDocumentId: null as string | null,
  isLoadingList: false,

  // Core document (selected)
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

  // Focus mode
  focusMode: false,
} as const;

// ─── Store Interface ─────────────────────────────────────────────

interface PatentDocumentState {
  // Multi-document list
  documents: PatentDocument[];
  selectedDocumentId: string | null;
  isLoadingList: boolean;

  // Core document state (selected document)
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

  // Focus mode
  focusMode: boolean;

  // Actions - Document List
  loadDocuments: (ideaId: string) => Promise<void>;
  selectDocument: (documentId: string) => void;

  // Actions - Document CRUD
  initializeDocument: (
    ideaId: string,
    initialContent: Record<string, unknown>,
    title?: string,
    documentType?: DocumentType,
    templateId?: string
  ) => Promise<void>;
  updateContent: (content: Record<string, unknown>) => void;
  saveDocument: (label?: string, trigger?: VersionTrigger) => Promise<void>;
  setStatus: (status: DocumentStatus) => Promise<void>;
  renameDocument: (documentId: string, title: string) => Promise<void>;
  duplicateDocument: (documentId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;

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

  // Actions - Focus mode
  toggleFocusMode: () => void;

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

    // ── Document List Actions ─────────────────────────────────────

    loadDocuments: async (ideaId: string) => {
      set({ isLoadingList: true, error: null });
      try {
        const docs = await getPatentDocumentsByIdeaId(ideaId);
        set({ documents: docs, isLoadingList: false });

        // Auto-select first document if none selected
        const { selectedDocumentId } = get();
        if (docs.length > 0 && !selectedDocumentId) {
          get().selectDocument(docs[0].id);
        }
      } catch (err) {
        set({ isLoadingList: false, error: errorMessage(err) });
      }
    },

    selectDocument: (documentId: string) => {
      const { documents } = get();
      const doc = documents.find((d) => d.id === documentId);
      if (!doc) return;

      set({
        selectedDocumentId: documentId,
        document: doc,
        isDirty: false,
        lastSavedAt: doc.updatedAt,
        comments: [],
        versions: [],
        activeCommentId: null,
        commentSidebarOpen: false,
        versionPanelOpen: false,
        previewVersionId: null,
        images: [],
      });
    },

    // ── Document CRUD Actions ─────────────────────────────────────

    initializeDocument: async (
      ideaId: string,
      initialContent: Record<string, unknown>,
      title?: string,
      documentType?: DocumentType,
      templateId?: string
    ) => {
      set({ isLoading: true, error: null });
      try {
        // Ensure content has no null-prototype objects (Prisma JSON fields
        // can produce these, and Next.js Server Actions reject them).
        const safeContent = JSON.parse(JSON.stringify(initialContent)) as Record<string, unknown>;
        const doc = await createPatentDocument(
          ideaId,
          safeContent,
          title,
          documentType,
          templateId
        );
        set((s) => ({
          documents: [...s.documents, doc],
          selectedDocumentId: doc.id,
          document: doc,
          isLoading: false,
          isDirty: false,
          lastSavedAt: doc.updatedAt,
        }));
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
        // Compute word count from content
        const contentStr = JSON.stringify(document.content);
        const textNodes = contentStr.match(/"text":"([^"]*)"/g) || [];
        const totalWords = textNodes.reduce((count, match) => {
          const text = match.replace(/"text":"/, "").replace(/"$/, "");
          return count + text.trim().split(/\s+/).filter(Boolean).length;
        }, 0);

        // 1. Persist the content to the database
        // Sanitize content to strip any null-prototype objects before sending to server action
        const safeContent = JSON.parse(contentStr) as Record<string, unknown>;
        const updated = await updatePatentDocumentContent(
          document.id,
          safeContent,
          document.paragraphCounter,
          totalWords
        );

        // 2. Create a version snapshot
        await createDocumentVersion(
          document.id,
          label ?? "Save",
          trigger ?? "manual"
        );

        const now = new Date().toISOString();

        // Update the document in the list too
        set((s) => ({
          document: updated,
          documents: s.documents.map((d) =>
            d.id === updated.id ? updated : d
          ),
          isSaving: false,
          isDirty: false,
          lastSavedAt: now,
        }));
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

        set((s) => ({
          document: updated,
          documents: s.documents.map((d) =>
            d.id === updated.id ? updated : d
          ),
        }));
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    renameDocument: async (documentId: string, title: string) => {
      set({ error: null });
      try {
        const updated = await updatePatentDocumentTitle(documentId, title);
        set((s) => ({
          document: s.document?.id === documentId ? updated : s.document,
          documents: s.documents.map((d) =>
            d.id === documentId ? updated : d
          ),
        }));
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    duplicateDocument: async (documentId: string) => {
      set({ error: null });
      try {
        const copy = await duplicatePatentDocument(documentId);
        set((s) => ({
          documents: [...s.documents, copy],
          selectedDocumentId: copy.id,
          document: copy,
          isDirty: false,
          lastSavedAt: copy.updatedAt,
        }));
      } catch (err) {
        set({ error: errorMessage(err) });
      }
    },

    deleteDocument: async (documentId: string) => {
      set({ error: null });
      try {
        const success = await deletePatentDocument(documentId);
        if (success) {
          set((s) => {
            const remaining = s.documents.filter((d) => d.id !== documentId);
            const wasSelected = s.selectedDocumentId === documentId;
            return {
              documents: remaining,
              selectedDocumentId: wasSelected
                ? remaining[0]?.id ?? null
                : s.selectedDocumentId,
              document: wasSelected
                ? remaining[0] ?? null
                : s.document,
            };
          });
        }
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
        set((s) => ({
          document: restored,
          documents: s.documents.map((d) =>
            d.id === restored.id ? restored : d
          ),
          isDirty: false,
          lastSavedAt: new Date().toISOString(),
          previewVersionId: null,
        }));
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

    // ── Focus Mode ────────────────────────────────────────────────

    toggleFocusMode: () =>
      set((s) => ({ focusMode: !s.focusMode })),

    // ── Reset ────────────────────────────────────────────────────

    reset: () =>
      set({
        documents: [],
        selectedDocumentId: null,
        isLoadingList: false,
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
        focusMode: false,
      }),
  })
);
