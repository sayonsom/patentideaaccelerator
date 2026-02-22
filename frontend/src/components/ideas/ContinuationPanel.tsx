"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { ContinuationResult, ContinuationDirection, Idea } from "@/lib/types";
import { useSettingsStore } from "@/lib/store";
import {
  listContinuationsAction,
  saveContinuationsAction,
  promoteContinuationAction,
} from "@/lib/actions/continuations";

interface ContinuationPanelProps {
  idea: Idea;
}

const DIRECTION_LABELS: Record<ContinuationDirection, { label: string; color: string; icon: string }> = {
  "continuation-in-part": { label: "Continuation-in-Part", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "+" },
  "divisional": { label: "Divisional", color: "bg-purple-50 text-purple-700 border-purple-200", icon: "÷" },
  "design-around": { label: "Design Around", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "↻" },
  "improvement": { label: "Improvement", color: "bg-green-50 text-green-700 border-green-200", icon: "↑" },
};

export function ContinuationPanel({ idea }: ContinuationPanelProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const provider = useSettingsStore((s) => s.provider);
  const getActiveKey = useSettingsStore((s) => s.getActiveKey);

  const [continuations, setContinuations] = useState<ContinuationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    loadContinuations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea.id]);

  const loadContinuations = async () => {
    setLoading(true);
    const results = await listContinuationsAction(idea.id);
    setContinuations(results);
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const key = getActiveKey();
      const res = await fetch("/api/ai/continuations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(key ? { "x-api-key": key, "x-ai-provider": provider } : {}),
        },
        body: JSON.stringify({
          title: idea.title,
          problemStatement: idea.problemStatement,
          proposedSolution: idea.proposedSolution,
          technicalApproach: idea.technicalApproach,
          techStack: idea.techStack,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate continuations");
      }

      const data = await res.json();
      const directions = data.directions;

      // Save to database
      const saved = await saveContinuationsAction(idea.id, directions);
      setContinuations(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handlePromote = async (contId: string) => {
    if (!session?.user?.id) return;
    setPromoting(contId);
    try {
      const result = await promoteContinuationAction(contId, session.user.id);
      if (result) {
        // Update the continuation in local state
        setContinuations((prev) =>
          prev.map((c) => (c.id === contId ? result.continuation : c))
        );
        // Navigate to the new idea
        router.push(`/ideas/${result.idea.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote");
    } finally {
      setPromoting(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-text-secondary">Loading continuations...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-ink">Continuation Directions</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            AI-generated continuation strategies for this filed idea.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-3 py-1.5 text-xs bg-blue-ribbon text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {generating
            ? "Generating..."
            : continuations.length > 0
            ? "Regenerate"
            : "Generate Continuations"}
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-danger">
          {error}
        </div>
      )}

      {continuations.length === 0 && !generating && (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <p className="text-sm text-text-secondary mb-2">No continuation directions yet.</p>
          <p className="text-xs text-text-secondary">
            Click &quot;Generate Continuations&quot; to get AI-suggested continuation strategies.
          </p>
        </div>
      )}

      {/* Continuation cards */}
      <div className="grid gap-3">
        {continuations.map((cont) => {
          const dir = DIRECTION_LABELS[cont.directionType] || DIRECTION_LABELS["improvement"];
          return (
            <div key={cont.id} className="border border-border rounded-lg p-4 hover:border-neutral-400 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${dir.color}`}
                    >
                      {dir.icon} {dir.label}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-ink mb-1">{cont.title}</h4>
                  <p className="text-xs text-text-secondary mb-2">{cont.description}</p>
                  {cont.technicalDelta && (
                    <div className="px-2 py-1.5 bg-neutral-off-white rounded text-xs text-ink">
                      <span className="font-medium">Technical Delta:</span>{" "}
                      {cont.technicalDelta}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {cont.promotedIdeaId ? (
                    <button
                      onClick={() => router.push(`/ideas/${cont.promotedIdeaId}`)}
                      className="px-2 py-1 text-[10px] text-blue-ribbon border border-blue-ribbon rounded hover:bg-blue-50 transition-colors"
                    >
                      View Idea →
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePromote(cont.id)}
                      disabled={promoting === cont.id}
                      className="px-2 py-1 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      {promoting === cont.id ? "Creating..." : "Promote to Idea"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
