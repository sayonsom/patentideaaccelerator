"use client";

import { useEffect, useState } from "react";
import type { TeamTimer, SprintPhase } from "@/lib/types";
import { SPRINT_PHASES } from "@/lib/constants";
import { Button } from "@/components/ui";
import {
  ensureTimer,
  formatDuration,
  getRemainingSeconds,
  getSpentSeconds,
  startTimer,
  pauseTimer,
  resetTimer,
} from "@/lib/team-timer";

interface SprintTimerProps {
  timer: Partial<TeamTimer>;
  sprintPhase: SprintPhase;
  onUpdate: (timer: TeamTimer) => void;
}

export function SprintTimer({ timer: rawTimer, sprintPhase, onUpdate }: SprintTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const timer = ensureTimer(rawTimer);
  const remainingSeconds = getRemainingSeconds(timer, now);
  const spentSeconds = getSpentSeconds(timer, now);
  const isRunning = !!timer.runningSinceMs && remainingSeconds > 0;
  const currentStage = SPRINT_PHASES.find((p) => p.key === sprintPhase) || SPRINT_PHASES[0];
  const startedStage = timer.startedStage
    ? SPRINT_PHASES.find((p) => p.key === timer.startedStage) || null
    : null;

  // Auto-pause when timer expires
  useEffect(() => {
    if (!timer.runningSinceMs) return;
    if (remainingSeconds > 0) return;
    onUpdate(pauseTimer(timer, { nowMs: now }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, now]);

  return (
    <div className="bg-surface-deep rounded-lg border border-border-default p-4">
      {/* Timer displays */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className={`bg-surface-card rounded-lg p-3 text-center border-t-2 ${remainingSeconds > 0 ? "border-green-500" : "border-red-500"}`}>
          <div className="text-lg font-bold font-mono text-text-primary">{formatDuration(remainingSeconds)}</div>
          <div className="text-[10px] text-text-muted font-semibold">REMAINING</div>
        </div>
        <div className="bg-surface-card rounded-lg p-3 text-center border-t-2 border-blue-500">
          <div className="text-lg font-bold font-mono text-text-primary">{formatDuration(spentSeconds)}</div>
          <div className="text-[10px] text-text-muted font-semibold">SPENT</div>
        </div>
        <div className={`bg-surface-card rounded-lg p-3 text-center border-t-2 ${isRunning ? "border-accent-gold" : remainingSeconds === 0 && timer.startedAtMs ? "border-red-500" : "border-gray-600"}`}>
          <div className={`text-xs font-bold ${isRunning ? "text-accent-gold" : remainingSeconds === 0 && timer.startedAtMs ? "text-red-400" : "text-text-secondary"}`}>
            {isRunning ? "RUNNING" : remainingSeconds === 0 && timer.startedAtMs ? "EXPIRED" : timer.startedAtMs ? "PAUSED" : "NOT STARTED"}
          </div>
          <div className="text-[10px] text-text-muted font-semibold mt-1">
            Stage: <span className="font-bold" style={{ color: currentStage.color }}>{currentStage.label}</span>
          </div>
        </div>
      </div>

      {/* Info + controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-text-muted">
          {timer.startedAtMs ? (
            <>
              Started {startedStage ? `(${startedStage.label}) ` : ""}on{" "}
              <span className="text-text-secondary font-semibold">{new Date(timer.startedAtMs).toLocaleString()}</span>
            </>
          ) : (
            <>
              Click <strong className="text-accent-gold">Start</strong> when your team begins the{" "}
              <span className="font-bold" style={{ color: currentStage.color }}>{currentStage.label}</span> stage.
            </>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {!isRunning ? (
            <Button
              variant="accent"
              size="sm"
              disabled={remainingSeconds === 0}
              onClick={() => onUpdate(startTimer(timer, { stage: sprintPhase }))}
            >
              Start
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUpdate(pauseTimer(timer))}
            >
              Pause
            </Button>
          )}
          {timer.startedAtMs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!window.confirm("Reset this team's timer back to 72 hours?")) return;
                onUpdate(resetTimer(timer));
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
