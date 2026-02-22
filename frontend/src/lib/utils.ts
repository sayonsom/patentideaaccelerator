/** Generate a short random ID */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Format a Date or ISO string to a human-readable relative time */
export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(then).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format ISO string to readable date */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Truncate text to a max length with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

/** Get the total score from a 3x3 matrix */
export function getTotalScore(score: { inventiveStep: number; defensibility: number; productFit: number } | null): number {
  if (!score) return 0;
  return score.inventiveStep + score.defensibility + score.productFit;
}

/** Get verdict from total score */
export function getScoreVerdict(totalScore: number): { label: string; color: string } {
  if (totalScore >= 7) return { label: "File immediately", color: "#10b981" };
  if (totalScore >= 5) return { label: "Refine further", color: "#f59e0b" };
  return { label: "Rethink", color: "#ef4444" };
}

/** Get Alice risk color */
export function getAliceRiskColor(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "low": return "#10b981";
    case "medium": return "#f59e0b";
    case "high": return "#ef4444";
  }
}

/** Create a new blank idea */
export function createBlankIdea(userId: string): {
  id: string;
  userId: string;
  sprintId: null;
  teamId: null;
  title: string;
  problemStatement: string;
  existingApproach: string;
  proposedSolution: string;
  technicalApproach: string;
  contradictionResolved: string;
  priorArtNotes: string;
  status: "draft";
  phase: "foundation";
  techStack: string[];
  tags: string[];
  score: null;
  aliceScore: null;
  frameworkUsed: "none";
  frameworkData: Record<string, never>;
  claimDraft: null;
  inventiveStepAnalysis: null;
  marketNeedsAnalysis: null;
  patentReport: null;
  redTeamNotes: string;
  alignmentScores: never[];
  createdAt: string;
  updatedAt: string;
} {
  const now = new Date().toISOString();
  return {
    id: uid(),
    userId,
    sprintId: null,
    teamId: null,
    title: "",
    problemStatement: "",
    existingApproach: "",
    proposedSolution: "",
    technicalApproach: "",
    contradictionResolved: "",
    priorArtNotes: "",
    status: "draft",
    phase: "foundation",
    techStack: [],
    tags: [],
    score: null,
    aliceScore: null,
    frameworkUsed: "none",
    frameworkData: {},
    claimDraft: null,
    inventiveStepAnalysis: null,
    marketNeedsAnalysis: null,
    patentReport: null,
    redTeamNotes: "",
    alignmentScores: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Solo Pipeline Progress ───────────────────────────────────────

import type { Idea } from "./types";

export interface PipelineStage {
  id: string;
  label: string;
  complete: (idea: Idea) => boolean;
}

export const SOLO_PIPELINE_STAGES: PipelineStage[] = [
  { id: "problem", label: "Problem Defined", complete: (i) => !!i.problemStatement && i.problemStatement.length > 20 },
  { id: "framework", label: "Framework Applied", complete: (i) => i.frameworkUsed !== "none" },
  { id: "solution", label: "Solution Described", complete: (i) => !!i.proposedSolution && !!i.technicalApproach },
  { id: "scored", label: "Scored (3\u00D73)", complete: (i) => i.score !== null && getTotalScore(i.score) > 0 },
  { id: "alice", label: "Alice Screened", complete: (i) => i.aliceScore !== null },
  { id: "prior-art", label: "Prior Art Checked", complete: (i) => !!i.priorArtNotes && i.priorArtNotes.length > 10 },
  { id: "claims", label: "Claims Drafted", complete: (i) => i.claimDraft !== null },
  { id: "inventive-step", label: "Inventive Step Analyzed", complete: (i) => i.inventiveStepAnalysis !== null },
  { id: "market-needs", label: "Market Analyzed", complete: (i) => i.marketNeedsAnalysis !== null },
  { id: "red-team", label: "Red Team Reviewed", complete: (i) => !!i.redTeamNotes && i.redTeamNotes.length > 20 },
];

export function getIdeaProgress(idea: Idea): { completed: number; total: number; percent: number; stages: { stage: PipelineStage; done: boolean }[] } {
  const stages = SOLO_PIPELINE_STAGES.map((stage) => ({ stage, done: stage.complete(idea) }));
  const completed = stages.filter((s) => s.done).length;
  const total = stages.length;
  return { completed, total, percent: Math.round((completed / total) * 100), stages };
}

/** Classify a string into a status badge color */
export function getStatusColor(status: string): string {
  switch (status) {
    case "draft": return "#6B7280";
    case "developing": return "#3b82f6";
    case "scored": return "#f59e0b";
    case "filed": return "#10b981";
    case "archived": return "#475569";
    default: return "#6B7280";
  }
}
