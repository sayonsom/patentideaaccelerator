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
  compact?: boolean;
}

export function SprintTimer({ timer: rawTimer, sprintPhase, onUpdate, compact = false }: SprintTimerProps) {
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
  const totalBudget = timer.budgetSeconds || 259200;
  const pctUsed = Math.min(100, (spentSeconds / totalBudget) * 100);

  // Auto-pause when timer expires
  useEffect(() => {
    if (!timer.runningSinceMs) return;
    if (remainingSeconds > 0) return;
    onUpdate(pauseTimer(timer, { nowMs: now }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, now]);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Compact timer bar */}
        <div className="flex-1 flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : remainingSeconds === 0 && timer.startedAtMs ? "bg-red-500" : "bg-gray-400"}`} />
            <span className="text-xs font-mono font-semibold text-ink tabular-nums">{formatDuration(remainingSeconds)}</span>
          </div>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${100 - pctUsed}%`,
                background: remainingSeconds > 86400 ? "#10b981" : remainingSeconds > 21600 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <span className="text-[10px] text-text-muted tabular-nums">{formatDuration(spentSeconds)} used</span>
        </div>

        {/* Controls */}
        <div className="flex gap-1 shrink-0">
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
    );
  }

  // Full layout (kept for other potential uses)
  const startedStage = timer.startedStage
    ? SPRINT_PHASES.find((p) => p.key === timer.startedStage) || null
    : null;

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className={`bg-white rounded-lg p-3 text-center border-t-2 ${remainingSeconds > 0 ? "border-green-500" : "border-red-500"}`}>
          <div className="text-lg font-semibold font-mono text-ink">{formatDuration(remainingSeconds)}</div>
          <div className="text-[10px] text-text-muted font-normal">REMAINING</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border-t-2 border-blue-500">
          <div className="text-lg font-semibold font-mono text-ink">{formatDuration(spentSeconds)}</div>
          <div className="text-[10px] text-text-muted font-normal">SPENT</div>
        </div>
        <div className={`bg-white rounded-lg p-3 text-center border-t-2 ${isRunning ? "border-blue-ribbon" : remainingSeconds === 0 && timer.startedAtMs ? "border-red-500" : "border-gray-600"}`}>
          <div className={`text-xs font-normal ${isRunning ? "text-blue-ribbon" : remainingSeconds === 0 && timer.startedAtMs ? "text-red-400" : "text-neutral-dark"}`}>
            {isRunning ? "RUNNING" : remainingSeconds === 0 && timer.startedAtMs ? "EXPIRED" : timer.startedAtMs ? "PAUSED" : "NOT STARTED"}
          </div>
          <div className="text-[10px] text-text-muted font-normal mt-1">
            Stage: <span className="font-normal" style={{ color: currentStage.color }}>{currentStage.label}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-text-muted">
          {timer.startedAtMs ? (
            <>
              Started {startedStage ? `(${startedStage.label}) ` : ""}on{" "}
              <span className="text-neutral-dark font-normal">{new Date(timer.startedAtMs).toLocaleString()}</span>
            </>
          ) : (
            <>
              Click <strong className="text-blue-ribbon">Start</strong> when your team begins the{" "}
              <span className="font-normal" style={{ color: currentStage.color }}>{currentStage.label}</span> stage.
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
