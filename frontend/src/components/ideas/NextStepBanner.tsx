"use client";

import { useState } from "react";
import type { Idea } from "@/lib/types";
import { getIdeaProgress } from "@/lib/utils";
import { Button } from "@/components/ui";

interface NextStepBannerProps {
  idea: Idea;
  onNavigate: (tabId: string) => void;
  onAction?: (actionId: string) => void;
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

/** Human-readable next-step messages with CTA labels */
const STAGE_GUIDANCE: Record<string, { message: string; cta: string; actionId?: string }> = {
  problem: { message: "Describe the problem your invention solves", cta: "Write Problem" },
  framework: { message: "Choose an inventive framework to guide ideation", cta: "Pick Framework" },
  solution: { message: "Describe your proposed solution and technical approach", cta: "Write Solution" },
  scored: { message: "Score your idea on the 3x3 readiness matrix", cta: "Score Now" },
  alice: { message: "Run Alice/101 pre-screen to assess patent eligibility", cta: "Run Check", actionId: "alice" },
  "prior-art": { message: "Search for prior art to strengthen your application", cta: "Search" },
  claims: { message: "Generate patent claim skeletons with AI", cta: "Generate", actionId: "claims" },
  "inventive-step": { message: "Analyze your inventive step for filing preparation", cta: "Analyze", actionId: "inventive-step" },
  "market-needs": { message: "Analyze market needs and commercial potential", cta: "Analyze", actionId: "market-needs" },
  "red-team": { message: "Red team your idea to find weaknesses before filing", cta: "Red Team", actionId: "red-team" },
};

export function NextStepBanner({ idea, onNavigate, onAction }: NextStepBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { completed, total, stages } = getIdeaProgress(idea);

  if (dismissed) return null;

  const firstIncomplete = stages.find((s) => !s.done);

  // All complete
  if (!firstIncomplete || completed === total) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 mb-4">
        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-green-800 flex-1">
          <span className="font-medium">Ready to file.</span> All {total} readiness steps are complete.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-green-400 hover:text-green-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  const guidance = STAGE_GUIDANCE[firstIncomplete.stage.id];
  if (!guidance) return null;

  const tabId = STAGE_TO_TAB[firstIncomplete.stage.id] ?? "overview";

  function handleCTA() {
    if (guidance.actionId && onAction) {
      onAction(guidance.actionId);
    } else {
      onNavigate(tabId);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-accent-light border border-blue-ribbon/10 mb-4">
      <svg className="w-4 h-4 text-blue-ribbon shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
      <p className="text-sm text-ink flex-1">
        <span className="font-medium">Next:</span> {guidance.message}
      </p>
      <Button variant="accent" size="sm" onClick={handleCTA}>
        {guidance.cta}
      </Button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-text-muted hover:text-ink transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
