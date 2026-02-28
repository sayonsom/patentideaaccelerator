"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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

  // Two-phase close: first show confirmation, then actually close
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const okButtonRef = useRef<HTMLButtonElement>(null);

  // ── Initiate close: save if dirty, then show confirmation ──────
  const initiateClose = useCallback(async () => {
    if (showCloseConfirm) return; // Already showing confirmation

    // Force-save any unsaved changes before showing confirmation
    const { isDirty, isSaving: saving, saveDocument } =
      usePatentDocumentStore.getState();

    if (isDirty && !saving) {
      try {
        await saveDocument("Auto-save", "auto");
      } catch {
        // Save failed — still show confirmation so user isn't stuck
      }
    }

    setShowCloseConfirm(true);
  }, [showCloseConfirm]);

  // ── Dismiss confirmation and close for real ────────────────────
  const confirmAndClose = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  // ── Escape key handling ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // If the save-confirmation dialog is showing, Enter or Escape dismisses
        if (showCloseConfirm) {
          confirmAndClose();
          return;
        }

        const focusMode = usePatentDocumentStore.getState().focusMode;
        if (focusMode) return; // Let DocumentTab handle Escape to exit focus mode

        initiateClose();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && showCloseConfirm) {
        e.preventDefault();
        confirmAndClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    window.addEventListener("keydown", handleEnter);

    // Prevent body scrolling when modal is open
    const prevOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      window.removeEventListener("keydown", handleEnter);
      window.document.body.style.overflow = prevOverflow;
    };
  }, [open, showCloseConfirm, initiateClose, confirmAndClose]);

  // Auto-focus the OK button when confirmation appears
  useEffect(() => {
    if (showCloseConfirm && okButtonRef.current) {
      okButtonRef.current.focus();
    }
  }, [showCloseConfirm]);

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
        if (e.target === overlayRef.current) initiateClose();
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
            onClick={initiateClose}
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

        {/* ── Autosave confirmation overlay ─────────────────────── */}
        {showCloseConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black-pearl/30 backdrop-blur-[2px] animate-fade-in rounded-xl">
            <div className="bg-white rounded-lg shadow-xl border border-border px-8 py-6 max-w-sm w-full mx-4 animate-slide-up text-center">
              {/* Checkmark icon */}
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-600"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <h3 className="text-base font-semibold text-ink mb-1.5">
                Document saved
              </h3>
              <p className="text-sm text-text-muted mb-5">
                Your document is autosaved. You can continue editing anytime.
              </p>

              <button
                ref={okButtonRef}
                type="button"
                onClick={confirmAndClose}
                className="w-full px-4 py-2.5 bg-blue-ribbon text-white text-sm font-medium rounded-lg hover:bg-blue-ribbon/90 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-ribbon/50"
              >
                OK
              </button>

              <p className="text-[11px] text-text-muted mt-2.5">
                Press Enter or Esc to close
              </p>
            </div>
          </div>
        )}
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
