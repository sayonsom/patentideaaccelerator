"use client";

import { useEffect, useState, useCallback } from "react";
import { usePatentDocumentStore } from "@/lib/stores/patent-document-store";
import { Spinner } from "@/components/ui";
import { PatentEditor } from "./PatentEditor";
import { DocumentCard } from "./DocumentCard";
import { NewDocumentModal } from "./NewDocumentModal";
import {
  getDocumentReadiness,
  DOCUMENT_TEMPLATES,
  buildContentFromTemplate,
} from "@/lib/document-templates";
import type { Idea, DocumentType } from "@/lib/types";

// ─── Props ──────────────────────────────────────────────────────────

interface DocumentTabProps {
  idea: Idea;
}

// ─── Component ──────────────────────────────────────────────────────

export function DocumentTab({ idea }: DocumentTabProps) {
  const documents = usePatentDocumentStore((s) => s.documents);
  const selectedDocumentId = usePatentDocumentStore((s) => s.selectedDocumentId);
  const document = usePatentDocumentStore((s) => s.document);
  const isLoadingList = usePatentDocumentStore((s) => s.isLoadingList);
  const isLoading = usePatentDocumentStore((s) => s.isLoading);
  const error = usePatentDocumentStore((s) => s.error);
  const focusMode = usePatentDocumentStore((s) => s.focusMode);
  const loadDocuments = usePatentDocumentStore((s) => s.loadDocuments);
  const selectDocument = usePatentDocumentStore((s) => s.selectDocument);
  const initializeDocument = usePatentDocumentStore((s) => s.initializeDocument);
  const duplicateDocument = usePatentDocumentStore((s) => s.duplicateDocument);
  const renameDocument = usePatentDocumentStore((s) => s.renameDocument);
  const deleteDocument = usePatentDocumentStore((s) => s.deleteDocument);
  const toggleFocusMode = usePatentDocumentStore((s) => s.toggleFocusMode);
  const reset = usePatentDocumentStore((s) => s.reset);

  const [newDocModalOpen, setNewDocModalOpen] = useState(false);

  // Load documents on mount, reset on unmount
  useEffect(() => {
    loadDocuments(idea.id);
    return () => {
      reset();
    };
  }, [idea.id, loadDocuments, reset]);

  // Escape key to exit focus mode
  useEffect(() => {
    if (!focusMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleFocusMode();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [focusMode, toggleFocusMode]);

  const handleQuickCreate = useCallback(
    async (templateId: string) => {
      const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const { content } = buildContentFromTemplate(template, idea);
      const title =
        templateId === "blank"
          ? "Untitled Document"
          : `${template.name} — ${idea.title || "Untitled"}`;

      await initializeDocument(
        idea.id,
        content,
        title,
        template.documentType as DocumentType,
        template.id
      );
    },
    [idea, initializeDocument]
  );

  // ── Loading ─────────────────────────────────────────────────────

  if (isLoadingList || isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          onClick={() => loadDocuments(idea.id)}
          className="text-sm text-blue-ribbon hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── No documents: show empty state with template picker ─────────

  if (documents.length === 0) {
    return (
      <EmptyState
        idea={idea}
        onQuickCreate={handleQuickCreate}
        onOpenModal={() => setNewDocModalOpen(true)}
        newDocModalOpen={newDocModalOpen}
        onCloseModal={() => setNewDocModalOpen(false)}
      />
    );
  }

  // ── Documents exist: two-panel layout ────────────────────────────

  return (
    <div
      className={`flex ${
        focusMode
          ? "fixed inset-0 z-40 bg-white h-screen"
          : "h-[calc(100vh-14rem)]"
      }`}
    >
      {/* Left sidebar — document list (hidden in focus mode) */}
      {!focusMode && (
        <div className="w-52 shrink-0 border-r border-border bg-neutral-off-white/50 overflow-y-auto p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Documents
            </span>
            <button
              type="button"
              onClick={() => setNewDocModalOpen(true)}
              className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-blue-ribbon hover:bg-blue-ribbon/10 transition-colors"
              title="New document"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </button>
          </div>

          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isSelected={doc.id === selectedDocumentId}
              onSelect={() => selectDocument(doc.id)}
              onDuplicate={() => duplicateDocument(doc.id)}
              onRename={(title) => renameDocument(doc.id, title)}
              onDelete={() => deleteDocument(doc.id)}
            />
          ))}

          {/* Add new document card */}
          <button
            type="button"
            onClick={() => setNewDocModalOpen(true)}
            className="w-full rounded-lg border border-dashed border-border p-3 text-center text-xs text-text-muted hover:border-blue-ribbon hover:text-blue-ribbon transition-colors"
          >
            + New Document
          </button>
        </div>
      )}

      {/* Right panel — editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Focus mode toolbar */}
        {focusMode && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-neutral-off-white/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFocusMode}
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-ink transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  />
                </svg>
                Exit Focus
              </button>
              <span className="text-xs text-text-muted">
                Press Esc to exit
              </span>
            </div>
            <span className="text-sm font-medium text-ink truncate max-w-md">
              {document?.title || "Untitled"}
            </span>
          </div>
        )}

        {document ? (
          <div className="flex-1 relative">
            {/* Focus mode toggle (shown when not in focus mode) */}
            {!focusMode && (
              <button
                type="button"
                onClick={toggleFocusMode}
                className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-ink hover:bg-neutral-100 transition-colors"
                title="Focus mode (expand editor)"
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
              </button>
            )}
            <PatentEditor
              key={document.id}
              documentId={document.id}
              initialContent={document.content}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-24 text-sm text-text-muted">
            Select a document to start editing
          </div>
        )}
      </div>

      {/* New Document Modal */}
      <NewDocumentModal
        open={newDocModalOpen}
        onClose={() => setNewDocModalOpen(false)}
        idea={idea}
      />
    </div>
  );
}

// ─── Empty State Sub-component ──────────────────────────────────────

function EmptyState({
  idea,
  onQuickCreate,
  onOpenModal,
  newDocModalOpen,
  onCloseModal,
}: {
  idea: Idea;
  onQuickCreate: (templateId: string) => Promise<void>;
  onOpenModal: () => void;
  newDocModalOpen: boolean;
  onCloseModal: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const sections = getDocumentReadiness(idea);

  const handleQuickCreate = async (templateId: string) => {
    setIsCreating(true);
    try {
      await onQuickCreate(templateId);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Content readiness card */}
      <div className="bg-white border border-border rounded-lg p-8 max-w-2xl w-full mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-blue-ribbon/10 flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-ribbon"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-medium text-ink">
              Create Your First Document
            </h3>
            <p className="text-xs text-text-muted">
              Choose a patent filing template to get started
            </p>
          </div>
        </div>

        {/* Readiness checklist */}
        <div className="space-y-2 mb-6">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">
            Available content from your idea
          </p>
          {sections.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              {s.ready ? (
                <svg
                  className="w-4 h-4 text-blue-ribbon shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              ) : (
                <div className="w-4 h-4 rounded-full border border-border shrink-0" />
              )}
              <span
                className={`text-sm flex-1 ${
                  s.ready ? "text-neutral-dark" : "text-text-muted"
                }`}
              >
                {s.label}
              </span>
              <span className="text-[10px] text-text-muted">{s.detail}</span>
            </div>
          ))}
        </div>

        {/* Quick-start template grid */}
        <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3">
          Choose a template
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DOCUMENT_TEMPLATES.slice(0, 3).map((template) => (
            <button
              key={template.id}
              type="button"
              disabled={isCreating}
              onClick={() => handleQuickCreate(template.id)}
              className="text-left p-3 rounded-lg border border-border hover:border-blue-ribbon hover:bg-blue-ribbon/5 transition-colors disabled:opacity-50"
            >
              <p className="text-sm font-medium text-ink mb-0.5">
                {template.name}
              </p>
              <p className="text-[10px] text-text-muted">
                {template.sections.length} sections
              </p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="mt-3 text-sm text-blue-ribbon hover:underline"
        >
          See all templates...
        </button>
      </div>

      {/* New Document Modal */}
      <NewDocumentModal open={newDocModalOpen} onClose={onCloseModal} idea={idea} />
    </div>
  );
}
