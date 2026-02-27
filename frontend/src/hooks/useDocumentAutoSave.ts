"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePatentDocumentStore } from "@/lib/stores/patent-document-store";
import { pruneAutoSaveVersions } from "@/lib/actions/document-versions";

const AUTO_SAVE_DEBOUNCE_MS = 3_000;
const AUTO_SAVE_KEEP_COUNT = 10;

/**
 * Watches the patent document store for unsaved changes and auto-saves
 * after 3 seconds of inactivity. Also saves on window blur and beforeunload.
 *
 * Call `pruneAutoSaveVersions` after each auto-save to keep the version
 * history from growing unbounded (retains the last 10 auto-save versions).
 *
 * @returns `{ isSaving, lastSavedAt }` for displaying save status in the UI.
 */
export function useDocumentAutoSave() {
  const isSaving = usePatentDocumentStore((s) => s.isSaving);
  const isDirty = usePatentDocumentStore((s) => s.isDirty);
  const lastSavedAt = usePatentDocumentStore((s) => s.lastSavedAt);
  const documentId = usePatentDocumentStore((s) => s.document?.id ?? null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether a save is in flight to prevent double-fires from
  // blur + beforeunload racing against each other.
  const savingRef = useRef(false);

  // ── Core save routine ────────────────────────────────────────────

  const performAutoSave = useCallback(async () => {
    if (savingRef.current) return;

    const { isDirty: dirty, document, isSaving: saving, saveDocument } =
      usePatentDocumentStore.getState();

    if (!dirty || !document || saving) return;

    savingRef.current = true;
    try {
      await saveDocument("Auto-save", "auto");

      // Prune old auto-save versions — fire-and-forget so it doesn't
      // block the UI or fail the save.
      pruneAutoSaveVersions(document.id, AUTO_SAVE_KEEP_COUNT).catch(() => {
        // Pruning is best-effort; swallow errors.
      });
    } finally {
      savingRef.current = false;
    }
  }, []);

  // ── Debounced dirty watcher ──────────────────────────────────────

  useEffect(() => {
    if (!documentId) return;

    if (isDirty) {
      // Reset the debounce timer every time the content changes.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        performAutoSave();
      }, AUTO_SAVE_DEBOUNCE_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isDirty, documentId, performAutoSave]);

  // ── Immediate save on blur / beforeunload ────────────────────────

  useEffect(() => {
    if (!documentId) return;

    const handleBlur = () => {
      if (usePatentDocumentStore.getState().isDirty) {
        // Clear the debounce timer — we are saving now.
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        performAutoSave();
      }
    };

    const handleBeforeUnload = () => {
      if (usePatentDocumentStore.getState().isDirty) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        // Best-effort save — the browser may terminate us before it completes,
        // but we try anyway. sendBeacon is not applicable here because we need
        // to call server actions (not a raw HTTP request).
        performAutoSave();
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [documentId, performAutoSave]);

  // ── Cleanup on unmount ───────────────────────────────────────────

  useEffect(() => {
    return () => {
      // If there are unsaved changes when the hook unmounts (e.g. navigating
      // away within the SPA), attempt a final auto-save.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (usePatentDocumentStore.getState().isDirty) {
        performAutoSave();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isSaving, lastSavedAt };
}
