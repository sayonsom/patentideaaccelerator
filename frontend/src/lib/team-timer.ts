import type { TeamTimer } from "./types";

export const DEFAULT_TEAM_TIME_BUDGET_SECONDS = 72 * 60 * 60; // 72 hours

export function ensureTimer(timer: Partial<TeamTimer> | undefined): TeamTimer {
  return {
    budgetSeconds: DEFAULT_TEAM_TIME_BUDGET_SECONDS,
    spentSeconds: 0,
    runningSinceMs: null,
    startedAtMs: null,
    startedStage: null,
    ...timer,
  };
}

export function getSpentSeconds(timer: Partial<TeamTimer>, nowMs = Date.now()): number {
  const t = ensureTimer(timer);
  const base = Number.isFinite(t.spentSeconds) ? t.spentSeconds : 0;
  if (!t.runningSinceMs) return base;
  const delta = Math.floor((nowMs - t.runningSinceMs) / 1000);
  return base + Math.max(0, delta);
}

export function getRemainingSeconds(timer: Partial<TeamTimer>, nowMs = Date.now()): number {
  const t = ensureTimer(timer);
  return Math.max(
    0,
    (t.budgetSeconds || DEFAULT_TEAM_TIME_BUDGET_SECONDS) - getSpentSeconds(t, nowMs)
  );
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
}

export function startTimer(
  timer: Partial<TeamTimer>,
  options: { nowMs?: number; stage?: string | null } = {}
): TeamTimer {
  const { nowMs = Date.now(), stage = null } = options;
  const t = ensureTimer(timer);
  if (getRemainingSeconds(t, nowMs) <= 0) return t;
  if (t.runningSinceMs) return t;
  return {
    ...t,
    runningSinceMs: nowMs,
    startedAtMs: t.startedAtMs || nowMs,
    startedStage: t.startedStage || stage,
  };
}

export function pauseTimer(
  timer: Partial<TeamTimer>,
  options: { nowMs?: number } = {}
): TeamTimer {
  const { nowMs = Date.now() } = options;
  const t = ensureTimer(timer);
  if (!t.runningSinceMs) return t;
  const deltaSeconds = Math.floor((nowMs - t.runningSinceMs) / 1000);
  const nextSpent =
    (Number.isFinite(t.spentSeconds) ? t.spentSeconds : 0) + Math.max(0, deltaSeconds);
  return {
    ...t,
    spentSeconds: Math.min(
      nextSpent,
      t.budgetSeconds || DEFAULT_TEAM_TIME_BUDGET_SECONDS
    ),
    runningSinceMs: null,
  };
}

export function resetTimer(timer: Partial<TeamTimer>): TeamTimer {
  const t = ensureTimer(timer);
  return {
    ...t,
    spentSeconds: 0,
    runningSinceMs: null,
    startedAtMs: null,
    startedStage: null,
  };
}
