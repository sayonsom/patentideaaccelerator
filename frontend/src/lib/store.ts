"use client";

import { create } from "zustand";
import type { Idea, IdeaStatus, Team, User, BusinessGoal } from "./types";
import * as api from "./api";
import { createBlankIdea } from "./utils";

// ─── Auth Store ───────────────────────────────────────────────────
// User data now comes from NextAuth session, not localStorage.
// The store holds it in memory for easy access in client components.

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

// ─── Idea Store ───────────────────────────────────────────────────

interface IdeaState {
  ideas: Idea[];
  loading: boolean;
  filterStatus: IdeaStatus | null;
  searchQuery: string;
  sortBy: "updatedAt" | "createdAt" | "title";
  sortDir: "asc" | "desc";

  // Actions (now async — backed by Prisma)
  loadIdeas: (userId: string) => Promise<void>;
  addIdea: (partial?: Partial<Idea>, userId?: string) => Promise<Idea>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>;
  removeIdea: (id: string) => Promise<void>;
  setFilterStatus: (status: IdeaStatus | null) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (field: "updatedAt" | "createdAt" | "title") => void;
  toggleSortDir: () => void;
  getIdea: (id: string) => Idea | undefined;
  filteredIdeas: () => Idea[];
}

export const useIdeaStore = create<IdeaState>((set, get) => ({
  ideas: [],
  loading: false,
  filterStatus: null,
  searchQuery: "",
  sortBy: "updatedAt",
  sortDir: "desc",

  loadIdeas: async (userId: string) => {
    set({ loading: true });
    try {
      const ideas = await api.listIdeas(userId);
      set({ ideas, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addIdea: async (partial, userId) => {
    const uid = userId ?? useAuthStore.getState().user?.id ?? "anonymous";
    const blank = createBlankIdea(uid);
    const idea: Idea = { ...blank, ...partial };
    const created = await api.createIdea(idea);
    set((s) => ({ ideas: [created, ...s.ideas] }));
    return created;
  },

  updateIdea: async (id, updates) => {
    const updated = await api.updateIdea(id, updates);
    if (!updated) return;
    set((s) => ({
      ideas: s.ideas.map((i) => (i.id === id ? updated : i)),
    }));
  },

  removeIdea: async (id) => {
    await api.deleteIdea(id);
    set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) }));
  },

  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortBy: (field) => set({ sortBy: field }),
  toggleSortDir: () => set((s) => ({ sortDir: s.sortDir === "asc" ? "desc" : "asc" })),

  getIdea: (id) => get().ideas.find((i) => i.id === id),

  filteredIdeas: () => {
    const { ideas, filterStatus, searchQuery, sortBy, sortDir } = get();
    let filtered = [...ideas];

    if (filterStatus) {
      filtered = filtered.filter((i) => i.status === filterStatus);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.problemStatement.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : 0;
      return sortDir === "desc" ? -cmp : cmp;
    });

    return filtered;
  },
}));

// ─── UI Store ─────────────────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  wizardStep: number;

  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  setWizardStep: (step: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeModal: null,
  wizardStep: 0,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  setWizardStep: (step) => set({ wizardStep: step }),
}));

// ─── Team Store (Sprint Workspaces) ──────────────────────────────

interface TeamState {
  teams: Team[];
  loading: boolean;

  loadTeams: (userId: string) => Promise<void>;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<void>;
  removeTeam: (id: string) => void;
  getTeam: (id: string) => Team | undefined;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  loading: false,

  loadTeams: async (userId: string) => {
    set({ loading: true });
    try {
      const teams = await api.listTeams(userId);
      set({ teams, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addTeam: (team) => {
    set((s) => ({ teams: [team, ...s.teams] }));
  },

  updateTeam: async (id, updates) => {
    const updated = await api.updateTeam(id, updates);
    if (!updated) return;
    set((s) => ({
      teams: s.teams.map((t) => (t.id === id ? updated : t)),
    }));
  },

  removeTeam: (id) => {
    set((s) => ({ teams: s.teams.filter((t) => t.id !== id) }));
  },

  getTeam: (id) => get().teams.find((t) => t.id === id),
}));

// ─── Goal Store (Business Alignment) ────────────────────────────

interface GoalState {
  goals: BusinessGoal[];
  loading: boolean;

  loadGoals: (userId: string) => Promise<void>;
  addGoal: (data: { userId: string; title: string; description?: string; color?: string }) => Promise<BusinessGoal>;
  updateGoal: (id: string, updates: Partial<Pick<BusinessGoal, "title" | "description" | "color" | "sortOrder">>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  loading: false,

  loadGoals: async (userId: string) => {
    set({ loading: true });
    try {
      const goals = await api.listGoals(userId);
      set({ goals, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addGoal: async (data) => {
    const created = await api.createGoal(data);
    set((s) => ({ goals: [...s.goals, created] }));
    return created;
  },

  updateGoal: async (id, updates) => {
    const updated = await api.updateGoal(id, updates);
    if (!updated) return;
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? updated : g)),
    }));
  },

  removeGoal: async (id) => {
    await api.deleteGoal(id);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },
}));

// ─── Settings Store ──────────────────────────────────────────────
// Settings stay in localStorage — per-device, sensitive (API key).

interface SettingsState {
  apiKey: string | null;
  init: () => void;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: null,

  init: () => {
    const settings = api.getSettings();
    set({ apiKey: settings.anthropicApiKey || null });
  },

  setApiKey: (key) => {
    const settings = api.getSettings();
    api.saveSettings({ ...settings, anthropicApiKey: key });
    set({ apiKey: key });
  },

  clearApiKey: () => {
    const settings = api.getSettings();
    api.saveSettings({ ...settings, anthropicApiKey: "" });
    set({ apiKey: null });
  },
}));
