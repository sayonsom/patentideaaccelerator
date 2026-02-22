"use client";

import type { Idea } from "@/lib/types";
import { getIdeaProgress } from "@/lib/utils";

interface PipelineProgressProps {
  idea: Idea;
  onStageClick?: (stageId: string) => void;
}

/** Maps pipeline stage IDs to detail tab IDs */
const STAGE_TO_TAB: Record<string, string> = {
  problem: "overview",
  framework: "framework",
  solution: "overview",
  scored: "overview",
  alice: "overview",
  "prior-art": "prior-art",
  claims: "claims",
  "red-team": "red-team",
};

export function PipelineProgress({ idea, onStageClick }: PipelineProgressProps) {
  const { completed, total, percent, stages } = getIdeaProgress(idea);

  return (
    <div className="mb-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-normal text-neutral-dark">
          {completed} of {total} steps complete
        </span>
        <span className="text-xs font-mono text-neutral-light">{percent}%</span>
      </div>
      <div className="h-1.5 bg-neutral-off-white rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: percent >= 87 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#6B7280",
          }}
        />
      </div>

      {/* Stage circles */}
      <div className="flex items-center gap-0">
        {stages.map(({ stage, done }, i) => (
          <div key={stage.id} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <button
              onClick={() => onStageClick?.(STAGE_TO_TAB[stage.id] ?? "overview")}
              title={stage.label}
              className={`
                relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-normal shrink-0
                transition-all duration-200 hover:scale-110
                ${done
                  ? "bg-blue-ribbon text-white"
                  : "bg-neutral-off-white border border-border text-neutral-light"
                }
              `}
            >
              {done ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </button>

            {/* Connector line */}
            {i < stages.length - 1 && (
              <div className={`flex-1 h-px mx-0.5 ${done ? "bg-blue-ribbon/40" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Stage labels (visible on md+) */}
      <div className="hidden md:flex items-start gap-0 mt-1">
        {stages.map(({ stage, done }, i) => (
          <div key={stage.id} className={`flex-1 last:flex-none ${i < stages.length - 1 ? "" : ""}`}>
            <p className={`text-[9px] leading-tight w-7 text-center ${done ? "text-blue-ribbon" : "text-neutral-light"}`}>
              {stage.label.split(" ")[0]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
