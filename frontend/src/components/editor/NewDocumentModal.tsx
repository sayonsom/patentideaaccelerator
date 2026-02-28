"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import {
  DOCUMENT_TEMPLATES,
  buildContentFromTemplate,
} from "@/lib/document-templates";
import type { DocumentTemplate } from "@/lib/document-templates";
import type { Idea, DocumentType } from "@/lib/types";
import { usePatentDocumentStore } from "@/lib/stores/patent-document-store";

// ─── Props ──────────────────────────────────────────────────────────

interface NewDocumentModalProps {
  open: boolean;
  onClose: () => void;
  idea: Idea;
}

// ─── Template icon badges ───────────────────────────────────────────

const ICON_STYLES: Record<string, { bg: string; text: string }> = {
  US: { bg: "bg-blue-ribbon/10", text: "text-blue-ribbon" },
  PA: { bg: "bg-amber-100", text: "text-amber-700" },
  PCT: { bg: "bg-emerald-100", text: "text-emerald-700" },
  EU: { bg: "bg-indigo-100", text: "text-indigo-700" },
  BL: { bg: "bg-neutral-100", text: "text-neutral-500" },
};

// ─── Component ──────────────────────────────────────────────────────

export function NewDocumentModal({ open, onClose, idea }: NewDocumentModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const initializeDocument = usePatentDocumentStore((s) => s.initializeDocument);

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    try {
      const { content } = buildContentFromTemplate(selectedTemplate, idea);
      const title = selectedTemplate.id === "blank"
        ? "Untitled Document"
        : `${selectedTemplate.name} — ${idea.title || "Untitled"}`;

      await initializeDocument(
        idea.id,
        content,
        title,
        selectedTemplate.documentType as DocumentType,
        selectedTemplate.id
      );
      onClose();
      setSelectedTemplate(null);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Document" maxWidth="lg">
      <p className="text-sm text-text-muted mb-5">
        Choose a template to start from. Your idea data will be automatically
        populated into the relevant sections.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {DOCUMENT_TEMPLATES.map((template) => {
          const isActive = selectedTemplate?.id === template.id;
          const iconStyle = ICON_STYLES[template.icon] ?? ICON_STYLES.BL;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelectedTemplate(template)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? "border-blue-ribbon bg-blue-ribbon/5"
                  : "border-border hover:border-neutral-300 bg-white"
              }`}
            >
              {/* Icon badge */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold mb-3 ${iconStyle.bg} ${iconStyle.text}`}
              >
                {template.icon}
              </div>

              {/* Name */}
              <p className="text-sm font-medium text-ink mb-1">
                {template.name}
              </p>

              {/* Description */}
              <p className="text-xs text-text-muted leading-relaxed mb-2">
                {template.description}
              </p>

              {/* Section count */}
              <p className="text-[10px] text-text-muted">
                {template.sections.length === 0
                  ? "Empty document"
                  : `${template.sections.length} sections`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => {
            onClose();
            setSelectedTemplate(null);
          }}
          className="px-4 py-2 text-sm text-text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!selectedTemplate || isCreating}
          className="px-5 py-2 rounded-md bg-blue-ribbon text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isCreating ? "Creating..." : "Create Document"}
        </button>
      </div>
    </Modal>
  );
}
