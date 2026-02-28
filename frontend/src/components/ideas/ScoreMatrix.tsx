"use client";

import { useState } from "react";
import type { IdeaScore } from "@/lib/types";
import { PATENT_MATRIX } from "@/lib/constants";

interface ScoreMatrixProps {
  score: IdeaScore | null;
  onChange: (score: IdeaScore) => void;
  readonly?: boolean;
  compact?: boolean;
}

export function ScoreMatrix({ score, onChange, readonly = false, compact = false }: ScoreMatrixProps) {
  const [expanded, setExpanded] = useState(false);
  const current: IdeaScore = score ?? { inventiveStep: 0, defensibility: 0, productFit: 0 };

  function setDimension(key: keyof IdeaScore, value: number) {
    if (readonly) return;
    onChange({ ...current, [key]: value });
  }

  const totalScore = current.inventiveStep + current.defensibility + current.productFit;

  if (compact && !expanded) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink">Patent Readiness</h3>
          {totalScore > 0 && (
            <span className="text-xs text-neutral-dark font-mono tabular-nums">{totalScore}/9</span>
          )}
        </div>

        <div className="space-y-2">
          {PATENT_MATRIX.map((dim) => {
            const val = current[dim.key];
            const activeLevel = dim.levels.find((l) => l.score === val);
            return (
              <div key={dim.key} className="flex items-center gap-3">
                <span className="text-xs text-neutral-dark w-24 truncate">{dim.label}</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((level) => (
                    <button
                      key={level}
                      type="button"
                      disabled={readonly}
                      onClick={() => setDimension(dim.key, level)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        val >= level
                          ? "bg-blue-ribbon"
                          : "bg-neutral-off-white border border-border hover:border-neutral-light"
                      } ${readonly ? "cursor-default" : "cursor-pointer"}`}
                      title={dim.levels[level - 1]?.label}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-text-muted ml-auto">
                  {activeLevel?.label ?? "---"}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[11px] text-blue-ribbon hover:text-accent-hover transition-colors"
        >
          Adjust Scores
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink">3 x 3 Patent Readiness Matrix</h3>
        {compact && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11px] text-text-muted hover:text-ink transition-colors"
          >
            Collapse
          </button>
        )}
      </div>
      {PATENT_MATRIX.map((dim) => (
        <div key={dim.key}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{dim.icon}</span>
            <span className="text-sm font-medium text-ink">{dim.label}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {dim.levels.map((level) => {
              const active = current[dim.key] === level.score;
              return (
                <button
                  key={level.score}
                  type="button"
                  disabled={readonly}
                  onClick={() => setDimension(dim.key, level.score)}
                  className={`rounded-lg border p-2 text-left transition-all ${
                    active
                      ? "border-blue-ribbon bg-accent-light"
                      : "border-border bg-neutral-off-white hover:border-neutral-light"
                  } ${readonly ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="text-xs font-medium text-ink">{level.label}</div>
                  <div className="text-[10px] text-neutral-dark mt-0.5">{level.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
