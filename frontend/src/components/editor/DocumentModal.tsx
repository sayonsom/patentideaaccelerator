"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePatentDocumentStore } from "@/lib/stores/patent-document-store";
import { DocumentTab } from "./DocumentTab";
import type { Idea } from "@/lib/types";

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  idea: Idea;
}

export function DocumentModal({ open, onClose, idea }: DocumentModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const activeDoc = usePatentDocumentStore((s) => s.document);
  const isSaving = usePatentDocumentStore((s) => s.isSaving);
  const lastSavedAt = usePatentDocumentStore((s) => s.lastSavedAt);

  // Escape key: close modal only if focus mode is NOT active
  // (focus mode has its own Escape handler inside DocumentTab)
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const focusMode = usePatentDocumentStore.getState().focusMode;
        if (focusMode) return; // Let DocumentTab handle Escape to exit focus mode
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    // Prevent body scrolling when modal is open
    const prevOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      window.document.body.style.overflow = prevOverflow;
    };
  }, [open, handleClose]);

  if (!open) return null;

  // Format save status
  const saveStatus = isSaving
    ? "Saving..."
    : lastSavedAt
      ? `Saved ${formatTime(new Date(lastSavedAt))}`
      : "";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 bg-black-pearl/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      {/* Modal Panel */}
      <div className="fixed inset-4 flex flex-col bg-white rounded-xl shadow-2xl animate-slide-up overflow-hidden">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-12 px-5 border-b border-border shrink-0 bg-neutral-off-white/60">
          {/* Left: icon + document title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-ribbon shrink-0"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="text-sm font-medium text-ink truncate">
              {activeDoc?.title || "Patent Document"}
            </span>
          </div>

          {/* Center: save status */}
          <div className="text-xs text-text-muted">
            {saveStatus}
          </div>

          {/* Right: close button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-ink hover:bg-neutral-100 transition-colors"
            title="Close (Esc)"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <DocumentTab idea={idea} />
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}
