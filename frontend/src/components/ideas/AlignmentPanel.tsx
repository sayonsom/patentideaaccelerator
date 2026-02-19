"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Idea, AlignmentScore } from "@/lib/types";
import { useGoalStore, useIdeaStore } from "@/lib/store";
import { useAlignment } from "@/hooks/useAlignment";
import { scoreIdeaAlignmentAction } from "@/lib/actions/goals";
import { Button, Card, Spinner } from "@/components/ui";

interface AlignmentPanelProps {
  idea: Idea;
}

function getScoreColor(score: number): string {
  if (score >= 8) return "#10b981"; // green
  if (score >= 5) return "#f59e0b"; // amber
  if (score >= 3) return "#f97316"; // orange
  return "#6B7280"; // gray
}

function getAggregateScore(scores: AlignmentScore[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

export function AlignmentPanel({ idea }: AlignmentPanelProps) {
  const { data: session } = useSession();
  const { goals, loadGoals } = useGoalStore();
  const updateIdea = useIdeaStore((s) => s.updateIdea);
  const { scoreAlignment, loading: aiLoading } = useAlignment();
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadGoals(session.user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  if (goals.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Business Alignment</h3>
        <p className="text-xs text-text-secondary">
          No business goals defined yet.
        </p>
        <a href="/alignment" className="text-xs text-accent-gold hover:underline mt-1 inline-block">
          Set up goals
        </a>
      </Card>
    );
  }

  const aggregate = getAggregateScore(idea.alignmentScores);

  async function handleAIScore() {
    const result = await scoreAlignment(
      idea.id,
      {
        title: idea.title,
        problemStatement: idea.problemStatement,
        proposedSolution: idea.proposedSolution,
        technicalApproach: idea.technicalApproach,
      },
      goals
    );
    if (result) {
      // Update the idea in the store with new alignment scores
      await updateIdea(idea.id, {});
      // Force reload by re-fetching — the server action returns fresh data
      window.location.reload();
    }
  }

  async function handleManualScore(goalId: string, score: number) {
    const existing = idea.alignmentScores.find((s) => s.goalId === goalId);
    await scoreIdeaAlignmentAction(idea.id, goalId, score, existing?.rationale ?? "");
    // Optimistic update
    const newScores = idea.alignmentScores.filter((s) => s.goalId !== goalId);
    newScores.push({
      id: existing?.id ?? "",
      ideaId: idea.id,
      goalId,
      score,
      rationale: existing?.rationale ?? "",
    });
    await updateIdea(idea.id, {});
    window.location.reload();
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Business Alignment</h3>
        {aggregate !== null && (
          <span
            className="text-sm font-bold"
            style={{ color: getScoreColor(aggregate) }}
          >
            {aggregate}/10
          </span>
        )}
      </div>

      {/* Goal scores */}
      <div className="space-y-2">
        {goals.map((goal) => {
          const scoreEntry = idea.alignmentScores.find((s) => s.goalId === goal.id);
          const score = scoreEntry?.score ?? null;
          const expanded = expandedGoal === goal.id;

          return (
            <div key={goal.id} className="rounded-lg bg-surface-deep p-2">
              <button
                onClick={() => setExpandedGoal(expanded ? null : goal.id)}
                className="flex items-center gap-2 w-full text-left"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: goal.color }}
                />
                <span className="text-xs font-medium text-text-primary truncate flex-1">
                  {goal.title}
                </span>
                {score !== null ? (
                  <span
                    className="text-xs font-bold shrink-0"
                    style={{ color: getScoreColor(score) }}
                  >
                    {score}
                  </span>
                ) : (
                  <span className="text-[10px] text-text-muted shrink-0">--</span>
                )}
              </button>

              {expanded && (
                <div className="mt-2 pt-2 border-t border-border-subtle">
                  {/* Score slider */}
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={score ?? 0}
                      onChange={(e) => handleManualScore(goal.id, Number(e.target.value))}
                      className="flex-1 h-1 accent-accent-gold"
                    />
                    <span className="text-xs font-mono text-text-secondary w-5 text-right">
                      {score ?? 0}
                    </span>
                  </div>
                  {scoreEntry?.rationale && (
                    <p className="text-[10px] text-text-muted mt-1">{scoreEntry.rationale}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Score button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAIScore}
        disabled={aiLoading || !idea.problemStatement}
        className="w-full mt-3"
      >
        {aiLoading ? (
          <>
            <Spinner size="sm" /> Scoring...
          </>
        ) : (
          "AI Score All Goals"
        )}
      </Button>
    </Card>
  );
}
