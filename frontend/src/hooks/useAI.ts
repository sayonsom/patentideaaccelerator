"use client";

import { useState, useCallback } from "react";
import { useSettingsStore } from "@/lib/store";
import type {
  AIProvider,
  IdeateRequest,
  IdeateResponse,
  AliceScoreRequest,
  AliceScore,
  ClaimDraftRequest,
  ClaimDraft,
  RedTeamResult,
  InventiveStepAnalysis,
  MarketNeedsAnalysis,
  PatentReport,
} from "@/lib/types";

/** Build headers including API key and provider passthrough */
function buildHeaders(provider: AIProvider, apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  headers["x-ai-provider"] = provider;
  return headers;
}

/**
 * Hook for AI-powered features (ideation, Alice scoring, claim drafting, refine, red team).
 * Calls Next.js API routes which proxy to the configured AI provider.
 * Passes the user's API key and provider from Settings as headers.
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const provider = useSettingsStore((s) => s.provider);
  const getActiveKey = useSettingsStore((s) => s.getActiveKey);

  const ideate = useCallback(async (req: IdeateRequest): Promise<IdeateResponse | null> => {
    const apiKey = getActiveKey();
    if (!apiKey) {
      setError(`No API key configured for ${provider}. Add one in Settings.`);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/ideate", {
        method: "POST",
        headers: buildHeaders(provider, apiKey),
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
  }, [provider, getActiveKey]);

  const scoreAlice = useCallback(async (req: AliceScoreRequest): Promise<AliceScore | null> => {
    const apiKey = getActiveKey();
    if (!apiKey) {
      setError(`No API key configured for ${provider}. Add one in Settings.`);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/alice-score", {
        method: "POST",
        headers: buildHeaders(provider, apiKey),
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
  }, [provider, getActiveKey]);

  const draftClaims = useCallback(async (req: ClaimDraftRequest): Promise<ClaimDraft | null> => {
    const apiKey = getActiveKey();
    if (!apiKey) {
      setError(`No API key configured for ${provider}. Add one in Settings.`);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/claim-draft", {
        method: "POST",
        headers: buildHeaders(provider, apiKey),
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
  }, [provider, getActiveKey]);

  const refine = useCallback(async (field: string, value: string, context: string): Promise<string | null> => {
    const apiKey = getActiveKey();
    if (!apiKey) {
      setError(`No API key configured for ${provider}. Add one in Settings.`);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: buildHeaders(provider, apiKey),
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
  }, [provider, getActiveKey]);

  const redTeam = useCallback(
    async (req: {
      title: string;
      problemStatement: string;
      proposedSolution: string;
      technicalApproach: string;
      aliceScoreSummary?: string;
    }): Promise<RedTeamResult | null> => {
      const apiKey = getActiveKey();
      if (!apiKey) {
        setError(`No API key configured for ${provider}. Add one in Settings.`);
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/red-team", {
          method: "POST",
          headers: buildHeaders(provider, apiKey),
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
    [provider, getActiveKey]
  );

  const analyzeInventiveStep = useCallback(async (req: {
    title: string;
    problemStatement: string;
    proposedSolution: string;
    technicalApproach: string;
    existingApproach: string;
  }): Promise<InventiveStepAnalysis | null> => {
    const apiKey = getActiveKey();
    if (!apiKey) {
      setError(`No API key configured for ${provider}. Add one in Settings.`);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/inventive-step", {
        method: "POST",
        headers: buildHeaders(provider, apiKey),
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`Inventive step analysis failed (${res.status})`);
      return (await res.json()) as InventiveStepAnalysis;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider, getActiveKey]);

  const analyzeMarketNeeds = useCallback(async (req: {
    title: string;
    problemStatement: string;
    proposedSolution: string;
    technicalApproach: string;
    techStack: string[];
  }): Promise<MarketNeedsAnalysis | null> => {
    const apiKey = getActiveKey();
    if (!apiKey) {
      setError(`No API key configured for ${provider}. Add one in Settings.`);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/market-needs", {
        method: "POST",
        headers: buildHeaders(provider, apiKey),
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`Market needs analysis failed (${res.status})`);
      return (await res.json()) as MarketNeedsAnalysis;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider, getActiveKey]);

  const generatePatentReport = useCallback(async (ideaData: Record<string, unknown>): Promise<PatentReport | null> => {
    const apiKey = getActiveKey();
    if (!apiKey) {
      setError(`No API key configured for ${provider}. Add one in Settings.`);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/patent-report", {
        method: "POST",
        headers: buildHeaders(provider, apiKey),
        body: JSON.stringify(ideaData),
      });
      if (!res.ok) throw new Error(`Patent report generation failed (${res.status})`);
      return (await res.json()) as PatentReport;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider, getActiveKey]);

  return {
    ideate,
    scoreAlice,
    draftClaims,
    refine,
    redTeam,
    analyzeInventiveStep,
    analyzeMarketNeeds,
    generatePatentReport,
    loading,
    error,
  };
}
