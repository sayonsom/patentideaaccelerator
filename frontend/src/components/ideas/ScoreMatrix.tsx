"use client";

import type { IdeaScore } from "@/lib/types";
import { PATENT_MATRIX } from "@/lib/constants";

interface ScoreMatrixProps {
  score: IdeaScore | null;
  onChange: (score: IdeaScore) => void;
  readonly?: boolean;
}

export function ScoreMatrix({ score, onChange, readonly = false }: ScoreMatrixProps) {
  const current: IdeaScore = score ?? { inventiveStep: 0, defensibility: 0, productFit: 0 };

  function setDimension(key: keyof IdeaScore, value: number) {
    if (readonly) return;
    onChange({ ...current, [key]: value });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-ink">3 x 3 Patent Readiness Matrix</h3>
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
