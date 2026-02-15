"use client";

import type { Idea } from "@/lib/types";
import { SPRINT_PHASES, PATENT_MATRIX } from "@/lib/constants";
import { Card } from "@/components/ui";

interface SprintDashboardProps {
  ideas: Idea[];
}

export function SprintDashboard({ ideas }: SprintDashboardProps) {
  const phaseCounts = SPRINT_PHASES.map((p) => ({
    ...p,
    count: ideas.filter((i) => i.phase === p.key).length,
  }));

  const hasIdeas = phaseCounts.some((p) => p.count > 0);

  return (
    <Card className="bg-surface-deep">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        Patent Sprint Dashboard
      </h3>

      {/* Phase distribution bar */}
      {hasIdeas && (
        <div className="flex gap-0.5 h-8 rounded-lg overflow-hidden mb-4">
          {phaseCounts.filter((p) => p.count > 0).map((p) => (
            <div
              key={p.key}
              className="flex items-center justify-center text-xs font-bold"
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
              className="bg-surface-card rounded-lg p-3 text-center border-t-2"
              style={{ borderTopColor: p.color }}
            >
              <div className="text-xl font-bold font-mono text-text-primary">{count}</div>
              <div className="text-[11px] text-text-secondary font-semibold">{p.label}</div>
              <div className="text-[10px] text-text-muted">Target: {p.target}</div>
            </div>
          );
        })}
      </div>

      {/* Average scores */}
      <div className="grid grid-cols-3 gap-2">
        {PATENT_MATRIX.map((dim) => {
          const scored = ideas.filter((i) => i.score && i.score[dim.key as keyof typeof i.score] > 0);
          const avg = scored.length
            ? (scored.reduce((a, i) => a + (i.score?.[dim.key as keyof typeof i.score] ?? 0), 0) / scored.length).toFixed(1)
            : "\u2014";
          return (
            <div key={dim.key} className="bg-surface-card rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold font-mono text-text-primary">
                {avg}<span className="text-xs text-text-muted">/3</span>
              </div>
              <div className="text-[10px] text-text-muted font-semibold mt-0.5">Avg {dim.label}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
