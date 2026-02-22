"use client";

import { useState, useCallback } from "react";
import { useSettingsStore } from "@/lib/store";
import type { AIProvider, BusinessGoal, AlignmentScore } from "@/lib/types";
import { batchScoreAlignmentAction } from "@/lib/actions/goals";

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
 * Hook for AI-powered business alignment scoring.
 * Calls the alignment-score API route, then batch-upserts results via server action.
 */
export function useAlignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const provider = useSettingsStore((s) => s.provider);
  const getActiveKey = useSettingsStore((s) => s.getActiveKey);

  const scoreAlignment = useCallback(
    async (
      ideaId: string,
      idea: {
        title: string;
        problemStatement: string;
        proposedSolution: string;
        technicalApproach: string;
      },
      goals: BusinessGoal[]
    ): Promise<AlignmentScore[] | null> => {
      if (goals.length === 0) return null;

      const apiKey = getActiveKey();
      if (!apiKey) {
        setError(`No API key configured for ${provider}. Add one in Settings.`);
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/alignment-score", {
          method: "POST",
          headers: buildHeaders(provider, apiKey),
          body: JSON.stringify({
            title: idea.title,
            problemStatement: idea.problemStatement,
            proposedSolution: idea.proposedSolution,
            technicalApproach: idea.technicalApproach,
            goals: goals.map((g) => ({
              id: g.id,
              title: g.title,
              description: g.description,
            })),
          }),
        });

        if (!res.ok) throw new Error(`Alignment scoring failed (${res.status})`);

        const data = (await res.json()) as {
          scores: { goalId: string; score: number; rationale: string }[];
        };

        // Batch upsert scores via server action
        const saved = await batchScoreAlignmentAction(ideaId, data.scores);
        return saved;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [provider, getActiveKey]
  );

  return { scoreAlignment, loading, error };
}
