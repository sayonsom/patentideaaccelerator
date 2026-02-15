"use client";

import { useState, useCallback } from "react";
import type {
  IdeateRequest,
  IdeateResponse,
  AliceScoreRequest,
  AliceScore,
  ClaimDraftRequest,
  ClaimDraft,
} from "@/lib/types";

/**
 * Hook for AI-powered features (ideation, Alice scoring, claim drafting).
 * Calls Next.js API routes which proxy to Claude.
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ideate = useCallback(async (req: IdeateRequest): Promise<IdeateResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`AI ideation failed (${res.status})`);
      return (await res.json()) as IdeateResponse;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const scoreAlice = useCallback(async (req: AliceScoreRequest): Promise<AliceScore | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/alice-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`Alice scoring failed (${res.status})`);
      return (await res.json()) as AliceScore;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const draftClaims = useCallback(async (req: ClaimDraftRequest): Promise<ClaimDraft | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/claim-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`Claim drafting failed (${res.status})`);
      return (await res.json()) as ClaimDraft;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refine = useCallback(async (field: string, value: string, context: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value, context }),
      });
      if (!res.ok) throw new Error(`AI refinement failed (${res.status})`);
      const data = (await res.json()) as { refined: string };
      return data.refined;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { ideate, scoreAlice, draftClaims, refine, loading, error };
}
