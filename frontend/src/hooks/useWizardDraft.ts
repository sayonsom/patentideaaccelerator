"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Idea } from "@/lib/types";
import { toast } from "@/components/ui/Toast";

// ─── Types ──────────────────────────────────────────────────────

export interface WizardDraft {
  step: number;
  draft: Partial<Idea>;
  savedAt: string; // ISO timestamp
}

// ─── Constants ──────────────────────────────────────────────────

const DRAFT_PREFIX = "ipramp:wizard-draft";
const DEBOUNCE_MS = 2000;

// ─── Hook ───────────────────────────────────────────────────────

/**
 * Silently auto-saves wizard drafts to localStorage.
 * Saving is assumed default behaviour — no UI feedback on success.
 * A toast notification is shown ONLY when a save fails.
 */
export function useWizardDraft(userId: string) {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<WizardDraft | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = `${DRAFT_PREFIX}:${userId}`;

  // ─── Read draft from localStorage on mount ──────────────────

  useEffect(() => {
    if (typeof window === "undefined" || !userId || userId === "anonymous") return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as WizardDraft;
        // Only consider drafts less than 24 hours old
        const age = Date.now() - new Date(parsed.savedAt).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          setDraftData(parsed);
          setHasDraft(true);
        } else {
          // Stale draft — remove it
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // corrupted data — remove it
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, userId]);

  // ─── Cleanup timer on unmount ─────────────────────────────

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ─── Debounced save (silent — toast only on failure) ──────

  const saveDraft = useCallback(
    (step: number, draft: Partial<Idea>) => {
      if (typeof window === "undefined" || !userId || userId === "anonymous") return;

      // Clear any pending save
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        try {
          const data: WizardDraft = {
            step,
            draft,
            savedAt: new Date().toISOString(),
          };

          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch {
          toast("Draft could not be saved. You may be low on storage.", "warning");
        }
      }, DEBOUNCE_MS);
    },
    [storageKey, userId]
  );

  // ─── Clear draft from localStorage ─────────────────────────

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setDraftData(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, [storageKey]);

  // ─── Dismiss (user chose not to restore) ───────────────────

  const dismissDraft = useCallback(() => {
    setHasDraft(false);
    setDraftData(null);
    // Don't remove from localStorage — user may navigate away then come back
  }, []);

  return {
    hasDraft,
    draftData,
    saveDraft,
    clearDraft,
    dismissDraft,
  };
}
