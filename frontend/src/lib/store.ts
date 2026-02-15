"use client";

import { create } from "zustand";
import type { Idea, IdeaStatus, Team, User } from "./types";
import * as api from "./api";
import { createBlankIdea, uid } from "./utils";

// ─── Auth Store ───────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  init: () => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  init: () => {
    const user = api.getUser();
    if (user) {
      set({ user });
    } else {
      // Create a default local user for the localStorage-first approach
      const defaultUser: User = {
        id: uid(),
        email: "",
        name: "Local User",
        interests: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      api.saveUser(defaultUser);
      set({ user: defaultUser });
    }
  },
  setUser: (user) => {
    api.saveUser(user);
    set({ user });
  },
  logout: () => {
    set({ user: null });
  },
}));

// ─── Idea Store ───────────────────────────────────────────────────

interface IdeaState {
  ideas: Idea[];
  loading: boolean;
  filterStatus: IdeaStatus | null;
  searchQuery: string;
  sortBy: "updatedAt" | "createdAt" | "title";
  sortDir: "asc" | "desc";

  // Actions
  loadIdeas: () => void;
  addIdea: (idea?: Partial<Idea>) => Idea;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  removeIdea: (id: string) => void;
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

  loadIdeas: () => {
    set({ loading: true });
    const ideas = api.listIdeas();
    set({ ideas, loading: false });
  },

  addIdea: (partial) => {
    const user = useAuthStore.getState().user;
    const blank = createBlankIdea(user?.id ?? "anonymous");
    const idea: Idea = { ...blank, ...partial };
    api.createIdea(idea);
    set((s) => ({ ideas: [idea, ...s.ideas] }));
    return idea;
  },

  updateIdea: (id, updates) => {
    const updated = api.updateIdea(id, updates);
    if (!updated) return;
    set((s) => ({
      ideas: s.ideas.map((i) => (i.id === id ? updated : i)),
    }));
  },

  removeIdea: (id) => {
    api.deleteIdea(id);
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

  loadTeams: () => void;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  removeTeam: (id: string) => void;
  getTeam: (id: string) => Team | undefined;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  loading: false,

  loadTeams: () => {
    set({ loading: true });
    const teams = api.listTeams();
    set({ teams, loading: false });
  },

  addTeam: (team) => {
    api.createTeam(team);
    set((s) => ({ teams: [team, ...s.teams] }));
  },

  updateTeam: (id, updates) => {
    const updated = api.updateTeam(id, updates);
    if (!updated) return;
    set((s) => ({
      teams: s.teams.map((t) => (t.id === id ? updated : t)),
    }));
  },

  removeTeam: (id) => {
    api.deleteTeam(id);
    set((s) => ({ teams: s.teams.filter((t) => t.id !== id) }));
  },

  getTeam: (id) => get().teams.find((t) => t.id === id),
}));
