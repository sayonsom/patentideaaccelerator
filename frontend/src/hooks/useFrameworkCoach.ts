"use client";

import { useState, useCallback } from "react";
import { useSettingsStore } from "@/lib/store";
import type { AIProvider, CoachingRequest, CoachingResponse } from "@/lib/types";

/** Build headers including API key and provider passthrough */
function buildHeaders(provider: AIProvider, apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  headers["x-ai-provider"] = provider;
  return headers;
}

/**
 * Hook for AI-guided brainstorming within framework worksheets.
 * Returns coaching responses (probing questions, suggestions, angles)
 * that help the user think deeper — never writes for them.
 */
export function useFrameworkCoach() {
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const provider = useSettingsStore((s) => s.provider);
  const getActiveKey = useSettingsStore((s) => s.getActiveKey);

  const coach = useCallback(
    async (req: CoachingRequest): Promise<CoachingResponse | null> => {
      const apiKey = getActiveKey();
      if (!apiKey) {
        setError(`No API key configured for ${provider}. Add one in Settings.`);
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/framework-coach", {
          method: "POST",
          headers: buildHeaders(provider, apiKey),
          body: JSON.stringify(req),
        });
        if (!res.ok) throw new Error(`AI coaching failed (${res.status})`);
        const data = (await res.json()) as CoachingResponse;
        setCoaching(data);
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [provider, getActiveKey]
  );

  const clearCoaching = useCallback(() => {
    setCoaching(null);
    setError(null);
  }, []);

  return { coach, coaching, loading, error, clearCoaching };
}
