/**
 * API Abstraction Layer
 *
 * Currently uses localStorage. Designed to swap to HTTP calls
 * when the FastAPI backend is introduced — just replace the
 * function bodies in this single file.
 */

import type { Idea, Sprint, Team, User, IdeaStatus } from "./types";

const STORAGE_KEYS = {
  ideas: "voltedge:ideas",
  user: "voltedge:user",
  sprints: "voltedge:sprints",
  teams: "voltedge:teams",
  settings: "voltedge:settings",
} as const;

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

// ─── User ─────────────────────────────────────────────────────────

export function getUser(): User | null {
  return readJSON<User | null>(STORAGE_KEYS.user, null);
}

export function saveUser(user: User): void {
  writeJSON(STORAGE_KEYS.user, user);
}

// ─── Ideas ────────────────────────────────────────────────────────

export function listIdeas(): Idea[] {
  return readJSON<Idea[]>(STORAGE_KEYS.ideas, []);
}

export function getIdea(id: string): Idea | undefined {
  return listIdeas().find((i) => i.id === id);
}

export function createIdea(idea: Idea): Idea {
  const ideas = listIdeas();
  ideas.unshift(idea);
  writeJSON(STORAGE_KEYS.ideas, ideas);
  return idea;
}

export function updateIdea(id: string, updates: Partial<Idea>): Idea | undefined {
  const ideas = listIdeas();
  const idx = ideas.findIndex((i) => i.id === id);
  if (idx === -1) return undefined;
  ideas[idx] = { ...ideas[idx], ...updates, updatedAt: new Date().toISOString() };
  writeJSON(STORAGE_KEYS.ideas, ideas);
  return ideas[idx];
}

export function deleteIdea(id: string): boolean {
  const ideas = listIdeas();
  const filtered = ideas.filter((i) => i.id !== id);
  if (filtered.length === ideas.length) return false;
  writeJSON(STORAGE_KEYS.ideas, filtered);
  return true;
}

export function filterIdeas(opts: {
  status?: IdeaStatus;
  search?: string;
  sortBy?: "updatedAt" | "createdAt" | "title";
  sortDir?: "asc" | "desc";
}): Idea[] {
  let ideas = listIdeas();

  if (opts.status) {
    ideas = ideas.filter((i) => i.status === opts.status);
  }

  if (opts.search) {
    const q = opts.search.toLowerCase();
    ideas = ideas.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.problemStatement.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const sortBy = opts.sortBy ?? "updatedAt";
  const dir = opts.sortDir ?? "desc";
  ideas.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : 0;
    return dir === "desc" ? -cmp : cmp;
  });

  return ideas;
}

// ─── Sprints ──────────────────────────────────────────────────────

export function listSprints(): Sprint[] {
  return readJSON<Sprint[]>(STORAGE_KEYS.sprints, []);
}

export function getSprint(id: string): Sprint | undefined {
  return listSprints().find((s) => s.id === id);
}

export function createSprint(sprint: Sprint): Sprint {
  const sprints = listSprints();
  sprints.unshift(sprint);
  writeJSON(STORAGE_KEYS.sprints, sprints);
  return sprint;
}

export function updateSprint(id: string, updates: Partial<Sprint>): Sprint | undefined {
  const sprints = listSprints();
  const idx = sprints.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  sprints[idx] = { ...sprints[idx], ...updates, updatedAt: new Date().toISOString() };
  writeJSON(STORAGE_KEYS.sprints, sprints);
  return sprints[idx];
}

export function deleteSprint(id: string): boolean {
  const sprints = listSprints();
  const filtered = sprints.filter((s) => s.id !== id);
  if (filtered.length === sprints.length) return false;
  writeJSON(STORAGE_KEYS.sprints, filtered);
  return true;
}

// ─── Teams (Sprint Workspaces with full data) ────────────────────

export function listTeams(): Team[] {
  return readJSON<Team[]>(STORAGE_KEYS.teams, []);
}

export function getTeam(id: string): Team | undefined {
  return listTeams().find((t) => t.id === id);
}

export function createTeam(team: Team): Team {
  const teams = listTeams();
  teams.unshift(team);
  writeJSON(STORAGE_KEYS.teams, teams);
  return team;
}

export function updateTeam(id: string, updates: Partial<Team>): Team | undefined {
  const teams = listTeams();
  const idx = teams.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  teams[idx] = { ...teams[idx], ...updates };
  writeJSON(STORAGE_KEYS.teams, teams);
  return teams[idx];
}

export function deleteTeam(id: string): boolean {
  const teams = listTeams();
  const filtered = teams.filter((t) => t.id !== id);
  if (filtered.length === teams.length) return false;
  writeJSON(STORAGE_KEYS.teams, filtered);
  return true;
}

// ─── Settings ────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  return readJSON<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  writeJSON(STORAGE_KEYS.settings, settings);
}
