"use client";

import type { Idea, SprintMemberRecord } from "@/lib/types";
import { SPRINT_PHASES, PATENT_MATRIX } from "@/lib/constants";
import { Card } from "@/components/ui";

interface SprintDashboardProps {
  ideas: Idea[];
  members?: SprintMemberRecord[];
}

export function SprintDashboard({ ideas, members }: SprintDashboardProps) {
  const phaseCounts = SPRINT_PHASES.map((p) => ({
    ...p,
    count: ideas.filter((i) => i.phase === p.key).length,
  }));

  const hasIdeas = phaseCounts.some((p) => p.count > 0);

  // Contributor breakdown
  const contributorCounts = new Map<string, number>();
  for (const idea of ideas) {
    contributorCounts.set(idea.userId, (contributorCounts.get(idea.userId) ?? 0) + 1);
  }

  const getMemberName = (uid: string) => {
    const m = members?.find((mem) => mem.userId === uid);
    return m?.user?.name ?? "Unknown";
  };

  return (
    <Card className="bg-white">
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
        Sprint Dashboard
      </h3>

      {/* Phase distribution bar */}
      {hasIdeas && (
        <div className="flex gap-0.5 h-8 rounded-lg overflow-hidden mb-4">
          {phaseCounts.filter((p) => p.count > 0).map((p) => (
            <div
              key={p.key}
              className="flex items-center justify-center text-xs font-normal"
              style={{
                flex: p.count,
                backgroundColor: p.color + "40",
                color: p.color,
              }}
            >
              {p.count}
            </div>
          ))}
        </div>
      )}

      {/* Phase counts */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {SPRINT_PHASES.map((p) => {
          const count = ideas.filter((i) => i.phase === p.key).length;
          return (
            <div
              key={p.key}
              className="bg-white rounded-lg p-3 text-center border-t-2"
              style={{ borderTopColor: p.color }}
            >
              <div className="text-xl font-semibold font-mono text-ink">{count}</div>
              <div className="text-[11px] text-neutral-dark font-normal">{p.label}</div>
              <div className="text-[10px] text-text-muted">Target: {p.target}</div>
            </div>
          );
        })}
      </div>

      {/* Average scores */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {PATENT_MATRIX.map((dim) => {
          const scored = ideas.filter((i) => i.score && i.score[dim.key as keyof typeof i.score] > 0);
          const avg = scored.length
            ? (scored.reduce((a, i) => a + (i.score?.[dim.key as keyof typeof i.score] ?? 0), 0) / scored.length).toFixed(1)
            : "\u2014";
          return (
            <div key={dim.key} className="bg-white rounded-lg p-2.5 text-center">
              <div className="text-lg font-semibold font-mono text-ink">
                {avg}<span className="text-xs text-text-muted">/3</span>
              </div>
              <div className="text-[10px] text-text-muted font-normal mt-0.5">Avg {dim.label}</div>
            </div>
          );
        })}
      </div>

      {/* Contributor breakdown */}
      {contributorCounts.size > 1 && members && members.length > 0 && (
        <div>
          <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">
            Contributions
          </div>
          <div className="space-y-1.5">
            {Array.from(contributorCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([uid, count]) => (
                <div key={uid} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center text-[10px] font-normal text-neutral-dark">
                    {getMemberName(uid).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-ink flex-1">{getMemberName(uid)}</span>
                  <span className="text-xs font-mono text-text-muted">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}
