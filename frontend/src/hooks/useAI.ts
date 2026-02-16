"use client";

import { useState, useCallback } from "react";
import { useSettingsStore } from "@/lib/store";
import type {
  IdeateRequest,
  IdeateResponse,
  AliceScoreRequest,
  AliceScore,
  ClaimDraftRequest,
  ClaimDraft,
  RedTeamResult,
} from "@/lib/types";

/** Build headers including optional API key passthrough */
function buildHeaders(apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  return headers;
}

/**
 * Hook for AI-powered features (ideation, Alice scoring, claim drafting, refine, red team).
 * Calls Next.js API routes which proxy to Claude.
 * Passes the user's API key from Settings as x-api-key header when available.
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = useSettingsStore((s) => s.apiKey);

  const ideate = useCallback(async (req: IdeateRequest): Promise<IdeateResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/ideate", {
        method: "POST",
        headers: buildHeaders(apiKey),
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
  }, [apiKey]);

  const scoreAlice = useCallback(async (req: AliceScoreRequest): Promise<AliceScore | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/alice-score", {
        method: "POST",
        headers: buildHeaders(apiKey),
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
  }, [apiKey]);

  const draftClaims = useCallback(async (req: ClaimDraftRequest): Promise<ClaimDraft | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/claim-draft", {
        method: "POST",
        headers: buildHeaders(apiKey),
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
  }, [apiKey]);

  const refine = useCallback(async (field: string, value: string, context: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: buildHeaders(apiKey),
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
  }, [apiKey]);

  const redTeam = useCallback(
    async (req: {
      title: string;
      problemStatement: string;
      proposedSolution: string;
      technicalApproach: string;
      aliceScoreSummary?: string;
    }): Promise<RedTeamResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/red-team", {
          method: "POST",
          headers: buildHeaders(apiKey),
          body: JSON.stringify(req),
        });
        if (!res.ok) throw new Error(`Red team analysis failed (${res.status})`);
        return (await res.json()) as RedTeamResult;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiKey]
  );

  return { ideate, scoreAlice, draftClaims, refine, redTeam, loading, error };
}
