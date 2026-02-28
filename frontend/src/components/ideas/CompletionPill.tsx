"use client";

import { useState, useRef, useEffect } from "react";
import type { Idea } from "@/lib/types";
import { getIdeaProgress } from "@/lib/utils";

interface CompletionPillProps {
  idea: Idea;
  onStageClick?: (tabId: string) => void;
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
  "inventive-step": "patent-filing",
  "market-needs": "patent-filing",
  "red-team": "red-team",
};

/** Human-readable next-step messages */
const STAGE_ACTIONS: Record<string, string> = {
  problem: "Describe the problem you solved",
  framework: "Choose an inventive framework",
  solution: "Describe your proposed solution",
  scored: "Score on the 3x3 readiness matrix",
  alice: "Run Alice/101 pre-screen",
  "prior-art": "Search for prior art",
  claims: "Generate claim skeletons",
  "inventive-step": "Analyze inventive step",
  "market-needs": "Analyze market needs",
  "red-team": "Red team your idea",
};

export function CompletionPill({ idea, onStageClick }: CompletionPillProps) {
  const { completed, total, stages } = getIdeaProgress(idea);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const firstIncomplete = stages.find((s) => !s.done);

  function handleMouseEnter() {
    clearTimeout(timeoutRef.current);
    setPopoverOpen(true);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setPopoverOpen(false), 150);
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  function handleStageClick(stageId: string) {
    const tabId = STAGE_TO_TAB[stageId] ?? "overview";
    onStageClick?.(tabId);
    setPopoverOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-off-white transition-colors"
      >
        <div className="flex items-center gap-px">
          {stages.map(({ stage, done }) => (
            <div
              key={stage.id}
              className={`w-1 h-3 rounded-[1px] transition-colors ${
                done ? "bg-blue-ribbon" : "bg-border"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-neutral-dark font-mono tabular-nums">
          {completed}/{total}
        </span>
      </button>

      {/* Hover popover */}
      {popoverOpen && (
        <div
          className="absolute left-0 top-full mt-1 z-50 w-72 bg-white border border-border rounded-lg shadow-lg animate-fade-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <h4 className="text-xs font-medium text-ink">Patent Readiness</h4>
            <span className="text-xs text-neutral-dark font-mono tabular-nums">
              {completed}/{total}
            </span>
          </div>

          <div className="border-t border-border">
            {stages.map(({ stage, done }) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageClick(stage.id)}
                className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left hover:bg-neutral-off-white transition-colors group"
              >
                {done ? (
                  <svg
                    className="w-3.5 h-3.5 text-blue-ribbon shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                )}
                <span
                  className={`text-xs flex-1 ${
                    done ? "text-neutral-dark" : "text-ink font-medium"
                  }`}
                >
                  {stage.label}
                </span>
                <svg
                  className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          {firstIncomplete && (
            <div className="border-t border-border px-3 py-2.5">
              <button
                type="button"
                onClick={() => handleStageClick(firstIncomplete.stage.id)}
                className="flex items-center gap-1.5 text-xs text-blue-ribbon hover:text-accent-hover transition-colors"
              >
                <span className="font-medium">Next:</span>
                <span>{STAGE_ACTIONS[firstIncomplete.stage.id]}</span>
                <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
