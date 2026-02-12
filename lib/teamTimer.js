export const DEFAULT_TEAM_TIME_BUDGET_SECONDS = 72 * 60 * 60;

export function ensureTimer(timer) {
  return {
    budgetSeconds: DEFAULT_TEAM_TIME_BUDGET_SECONDS,
    spentSeconds: 0,
    runningSinceMs: null,
    startedAtMs: null,
    startedStage: null,
    ...timer,
  };
}

export function getSpentSeconds(timer, nowMs = Date.now()) {
  const t = ensureTimer(timer);
  const base = Number.isFinite(t.spentSeconds) ? t.spentSeconds : 0;
  if (!t.runningSinceMs) return base;
  const delta = Math.floor((nowMs - t.runningSinceMs) / 1000);
  return base + Math.max(0, delta);
}

export function getRemainingSeconds(timer, nowMs = Date.now()) {
  const t = ensureTimer(timer);
  return Math.max(0, (t.budgetSeconds || DEFAULT_TEAM_TIME_BUDGET_SECONDS) - getSpentSeconds(t, nowMs));
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
}

export function startTimer(timer, { nowMs = Date.now(), stage = null } = {}) {
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

export function pauseTimer(timer, { nowMs = Date.now() } = {}) {
  const t = ensureTimer(timer);
  if (!t.runningSinceMs) return t;
  const deltaSeconds = Math.floor((nowMs - t.runningSinceMs) / 1000);
  const nextSpent = (Number.isFinite(t.spentSeconds) ? t.spentSeconds : 0) + Math.max(0, deltaSeconds);
  return {
    ...t,
    spentSeconds: Math.min(nextSpent, t.budgetSeconds || DEFAULT_TEAM_TIME_BUDGET_SECONDS),
    runningSinceMs: null,
  };
}

export function resetTimer(timer) {
  const t = ensureTimer(timer);
  return {
    ...t,
    spentSeconds: 0,
    runningSinceMs: null,
    startedAtMs: null,
    startedStage: null,
  };
}

