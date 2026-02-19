/**
 * API Abstraction Layer
 *
 * Ideas, users, sprints, and teams now delegate to Prisma server actions.
 * Settings remain in localStorage (per-device, sensitive).
 */

import type { Idea, Sprint, Team, User, IdeaStatus, BusinessGoal, AlignmentScore } from "./types";
import {
  listIdeasAction,
  getIdeaAction,
  createIdeaAction,
  updateIdeaAction,
  deleteIdeaAction,
  filterIdeasAction,
} from "./actions/ideas";
import {
  getUserById,
  updateDbUser,
} from "./actions/users";
import {
  listSprintsAction,
  getSprintAction,
  createSprintAction,
  updateSprintAction,
  deleteSprintAction,
} from "./actions/sprints";
import {
  getTeamForSprint,
  updateTeamAction,
  listTeamsForUser,
} from "./actions/teams";
import {
  listGoalsAction,
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
  scoreIdeaAlignmentAction,
  batchScoreAlignmentAction,
} from "./actions/goals";

// ─── Settings (localStorage — per device) ───────────────────────

const SETTINGS_KEY = "voltedge:settings";

export interface AppSettings {
  anthropicApiKey: string;
}

const DEFAULT_SETTINGS: AppSettings = { anthropicApiKey: "" };

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSettings(): AppSettings {
  return readJSON<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  writeJSON(SETTINGS_KEY, settings);
}

// ─── User (Prisma) ──────────────────────────────────────────────

export async function getUser(id: string): Promise<User | null> {
  return getUserById(id);
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, "name" | "email" | "interests">>
): Promise<User | null> {
  return updateDbUser(id, updates);
}

// ─── Ideas (Prisma) ─────────────────────────────────────────────

export async function listIdeas(userId: string): Promise<Idea[]> {
  return listIdeasAction(userId);
}

export async function getIdea(id: string): Promise<Idea | null> {
  return getIdeaAction(id);
}

export async function createIdea(idea: Idea): Promise<Idea> {
  return createIdeaAction(idea);
}

export async function updateIdea(id: string, updates: Partial<Idea>): Promise<Idea | null> {
  return updateIdeaAction(id, updates);
}

export async function deleteIdea(id: string): Promise<boolean> {
  return deleteIdeaAction(id);
}

export async function filterIdeas(
  userId: string,
  opts: {
    status?: IdeaStatus;
    search?: string;
    sortBy?: "updatedAt" | "createdAt" | "title";
    sortDir?: "asc" | "desc";
  }
): Promise<Idea[]> {
  return filterIdeasAction(userId, opts);
}

// ─── Sprints (Prisma) ───────────────────────────────────────────

export async function listSprints(ownerId: string): Promise<Sprint[]> {
  return listSprintsAction(ownerId);
}

export async function getSprint(id: string): Promise<Sprint | null> {
  return getSprintAction(id);
}

export async function createSprint(data: {
  id?: string;
  name: string;
  ownerId: string;
}): Promise<Sprint> {
  return createSprintAction(data);
}

export async function updateSprint(
  id: string,
  updates: Partial<Pick<Sprint, "name" | "status" | "sessionMode" | "phase" | "timerSecondsRemaining" | "timerRunning" | "startedAt">>
): Promise<Sprint | null> {
  return updateSprintAction(id, updates);
}

export async function deleteSprint(id: string): Promise<boolean> {
  return deleteSprintAction(id);
}

// ─── Teams (Prisma — reconstructed from Sprint + Members + Ideas) ─

export async function listTeams(userId: string): Promise<Team[]> {
  return listTeamsForUser(userId);
}

export async function getTeam(sprintId: string): Promise<Team | null> {
  return getTeamForSprint(sprintId);
}

export async function updateTeam(
  sprintId: string,
  updates: Partial<Pick<Team, "name" | "sessionMode" | "sprintPhase" | "dataMinister">>
): Promise<Team | null> {
  return updateTeamAction(sprintId, updates);
}

// ─── Business Goals (Prisma) ───────────────────────────────────

export async function listGoals(userId: string): Promise<BusinessGoal[]> {
  return listGoalsAction(userId);
}

export async function createGoal(data: {
  userId: string;
  title: string;
  description?: string;
  color?: string;
}): Promise<BusinessGoal> {
  return createGoalAction(data);
}

export async function updateGoal(
  id: string,
  updates: Partial<Pick<BusinessGoal, "title" | "description" | "color" | "sortOrder">>
): Promise<BusinessGoal | null> {
  return updateGoalAction(id, updates);
}

export async function deleteGoal(id: string): Promise<boolean> {
  return deleteGoalAction(id);
}

// ─── Alignment Scoring (Prisma) ────────────────────────────────

export async function scoreAlignment(
  ideaId: string,
  goalId: string,
  score: number,
  rationale: string
): Promise<AlignmentScore> {
  return scoreIdeaAlignmentAction(ideaId, goalId, score, rationale);
}

export async function batchScoreAlignment(
  ideaId: string,
  scores: { goalId: string; score: number; rationale: string }[]
): Promise<AlignmentScore[]> {
  return batchScoreAlignmentAction(ideaId, scores);
}
