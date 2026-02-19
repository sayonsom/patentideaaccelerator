"use client";

import { useState, useCallback } from "react";
import { useSettingsStore } from "@/lib/store";
import type { BusinessGoal, AlignmentScore } from "@/lib/types";
import { batchScoreAlignmentAction } from "@/lib/actions/goals";

/** Build headers including optional API key passthrough */
function buildHeaders(apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  return headers;
}

/**
 * Hook for AI-powered business alignment scoring.
 * Calls the alignment-score API route, then batch-upserts results via server action.
 */
export function useAlignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = useSettingsStore((s) => s.apiKey);

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

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/alignment-score", {
          method: "POST",
          headers: buildHeaders(apiKey),
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
    [apiKey]
  );

  return { scoreAlignment, loading, error };
}
