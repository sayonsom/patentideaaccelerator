"use client";

import { useState, useCallback } from "react";
import type { PatentResult } from "@/lib/types";

/**
 * Hook for prior art / patent search.
 * Calls the Next.js API route which proxies to Google Patents.
 */
export function usePriorArt() {
  const [results, setResults] = useState<PatentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, cpcFilter?: string[]): Promise<PatentResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query });
      if (cpcFilter && cpcFilter.length > 0) {
        params.set("cpc", cpcFilter.join(","));
      }
      const res = await fetch(`/api/patents/search?${params.toString()}`);
      if (!res.ok) throw new Error(`Patent search failed (${res.status})`);
      const data = (await res.json()) as { results: PatentResult[] };
      setResults(data.results);
      return data.results;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, search, clearResults, loading, error };
}
