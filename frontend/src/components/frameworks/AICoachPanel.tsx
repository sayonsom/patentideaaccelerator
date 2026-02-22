"use client";

import { Button, Card, Spinner } from "@/components/ui";
import type { CoachingResponse } from "@/lib/types";

interface AICoachPanelProps {
  coaching: CoachingResponse | null;
  loading: boolean;
  error: string | null;
  onCoach: () => void;
  onClear: () => void;
  /** Label text for the trigger button (default: "AI Coach") */
  buttonLabel?: string;
  /** Compact mode for embedding inside cards */
  compact?: boolean;
}

export function AICoachPanel({
  coaching,
  loading,
  error,
  onCoach,
  onClear,
  buttonLabel = "AI Coach",
  compact = false,
}: AICoachPanelProps) {
  // ─── Trigger button only (no coaching yet) ──────────────────
  if (!coaching && !loading && !error) {
    return (
      <Button
        variant="ghost"
        size={compact ? "sm" : "md"}
        onClick={onCoach}
        disabled={loading}
      >
        <span className="mr-1.5">&#x2728;</span>
        {buttonLabel}
      </Button>
    );
  }

  // ─── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <Card borderColor="#2251FF">
        <div className="flex items-center gap-3 py-4 justify-center">
          <Spinner size="sm" />
          <span className="text-sm text-neutral-dark">Thinking about your worksheet...</span>
        </div>
      </Card>
    );
  }

  // ─── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <Card borderColor="#dc2626">
        <div className="flex items-center justify-between">
          <p className="text-sm text-danger">{error}</p>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Dismiss
          </Button>
        </div>
      </Card>
    );
  }

  // ─── Coaching response ──────────────────────────────────────
  if (!coaching) return null;

  return (
    <Card borderColor="#2251FF">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-ink flex items-center gap-1.5">
            <span>&#x2728;</span> AI Coach
          </h4>
          <button
            onClick={onClear}
            className="text-xs text-neutral-light hover:text-ink transition-colors"
          >
            Close
          </button>
        </div>

        {/* Questions */}
        {coaching.questions.length > 0 && (
          <Section icon="&#x1F4AD;" title="Questions to Consider">
            {coaching.questions.map((q, i) => (
              <li key={i} className="text-sm text-neutral-dark leading-relaxed">
                {q}
              </li>
            ))}
          </Section>
        )}

        {/* Suggestions */}
        {coaching.suggestions.length > 0 && (
          <Section icon="&#x1F4A1;" title="Suggested Angles">
            {coaching.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-neutral-dark leading-relaxed">
                {s}
              </li>
            ))}
          </Section>
        )}

        {/* Angles */}
        {coaching.angles.length > 0 && (
          <Section icon="&#x1F50D;" title="Explore Further">
            {coaching.angles.map((a, i) => (
              <li key={i} className="text-sm text-neutral-dark leading-relaxed">
                {a}
              </li>
            ))}
          </Section>
        )}

        {/* Framework Tip */}
        {coaching.frameworkTip && (
          <div className="p-3 rounded-lg bg-accent-light border border-blue-ribbon/10">
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">&#x1F4DD;</span>
              <p className="text-sm text-ink italic leading-relaxed">
                {coaching.frameworkTip}
              </p>
            </div>
          </div>
        )}

        {/* Coach again button */}
        <div className="pt-1">
          <Button variant="ghost" size="sm" onClick={onCoach}>
            <span className="mr-1.5">&#x2728;</span> Coach Me Again
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Helper ────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h5 className="text-xs font-medium text-ink uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </h5>
      <ul className="space-y-1.5 pl-5 list-disc marker:text-blue-ribbon">{children}</ul>
    </div>
  );
}
