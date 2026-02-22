"use client";

import { create } from "zustand";
import type { Idea, IdeaStatus, Sprint, SprintMemberRecord, Team, User, BusinessGoal, Organization, OrgMember, OrgRole, VoltEdgeTeam, AIProvider, PromptPreferences, ChatHistory, ChatContextType, Portfolio, PortfolioIdeaStatus } from "./types";
import { DEFAULT_PROMPT_PREFERENCES } from "./types";
import * as api from "./api";
import { createBlankIdea } from "./utils";
import {
  getOrganization,
  listOrgMembers,
  updateOrgMemberRole as updateOrgMemberRoleAction,
  removeOrgMember as removeOrgMemberAction,
  createOrgInvite as createOrgInviteAction,
} from "./actions/organizations";
import {
  listTeamsForUser as listVoltEdgeTeams,
  listTeamsForOrg,
} from "./actions/teams-management";

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

// ─── Team Store (Sprint Workspaces) — DEPRECATED, use useSprintStore ─

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

// ─── Sprint Store (Managerial Curation Layer) ──────────────────

interface SprintState {
  sprints: Sprint[];
  activeSprint: Sprint | null;
  sprintIdeas: Idea[];
  candidateIdeas: Idea[];
  members: SprintMemberRecord[];
  loading: boolean;

  loadSprints: (userId: string) => Promise<void>;
  loadSprintDetail: (sprintId: string) => Promise<void>;
  loadCandidates: (sprintId: string) => Promise<void>;

  createSprint: (data: {
    name: string;
    ownerId: string;
    teamId?: string;
    description?: string;
    theme?: string;
  }) => Promise<Sprint>;
  updateSprint: (id: string, updates: Partial<Pick<Sprint, "name" | "description" | "theme" | "status" | "sessionMode" | "phase" | "timerSecondsRemaining" | "timerRunning" | "startedAt">>) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;

  addIdeaToSprint: (ideaId: string, sprintId: string) => Promise<void>;
  removeIdeaFromSprint: (ideaId: string) => Promise<void>;
  quickAddIdea: (title: string, sprintId: string, userId: string) => Promise<Idea>;

  addMember: (sprintId: string, userId: string, role?: string) => Promise<void>;
  removeMember: (sprintId: string, userId: string) => Promise<void>;
}

export const useSprintStore = create<SprintState>((set) => ({
  sprints: [],
  activeSprint: null,
  sprintIdeas: [],
  candidateIdeas: [],
  members: [],
  loading: false,

  loadSprints: async (userId: string) => {
    set({ loading: true });
    try {
      const sprints = await api.listAccessibleSprints(userId);
      set({ sprints, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  loadSprintDetail: async (sprintId: string) => {
    set({ loading: true });
    try {
      const [sprint, ideas, members] = await Promise.all([
        api.getSprint(sprintId),
        api.listSprintIdeas(sprintId),
        api.listSprintMembers(sprintId),
      ]);
      set({
        activeSprint: sprint,
        sprintIdeas: ideas,
        members,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  loadCandidates: async (sprintId: string) => {
    try {
      const candidates = await api.listCandidateIdeas(sprintId);
      set({ candidateIdeas: candidates });
    } catch {
      // silent
    }
  },

  createSprint: async (data) => {
    const created = await api.createSprint(data);
    // Auto-add owner as a sprint member with "lead" role
    await api.addMemberToSprint(created.id, data.ownerId, "lead");
    set((s) => ({ sprints: [created, ...s.sprints] }));
    return created;
  },

  updateSprint: async (id, updates) => {
    const updated = await api.updateSprint(id, updates);
    if (!updated) return;
    set((s) => ({
      sprints: s.sprints.map((sp) => (sp.id === id ? updated : sp)),
      activeSprint: s.activeSprint?.id === id ? updated : s.activeSprint,
    }));
  },

  deleteSprint: async (id) => {
    await api.deleteSprint(id);
    set((s) => ({
      sprints: s.sprints.filter((sp) => sp.id !== id),
      activeSprint: s.activeSprint?.id === id ? null : s.activeSprint,
    }));
  },

  addIdeaToSprint: async (ideaId, sprintId) => {
    const linked = await api.linkToSprint(ideaId, sprintId);
    if (!linked) return;
    set((s) => ({
      sprintIdeas: [linked, ...s.sprintIdeas],
      candidateIdeas: s.candidateIdeas.filter((i) => i.id !== ideaId),
    }));
  },

  removeIdeaFromSprint: async (ideaId) => {
    const unlinked = await api.unlinkFromSprint(ideaId);
    if (!unlinked) return;
    set((s) => ({
      sprintIdeas: s.sprintIdeas.filter((i) => i.id !== ideaId),
      candidateIdeas: [unlinked, ...s.candidateIdeas],
    }));
  },

  quickAddIdea: async (title, sprintId, userId) => {
    const blank = createBlankIdea(userId);
    const idea: Idea = {
      ...blank,
      title,
      sprintId,
      status: "draft",
      phase: "foundation",
    };
    const created = await api.createIdea(idea);
    set((s) => ({ sprintIdeas: [created, ...s.sprintIdeas] }));
    return created;
  },

  addMember: async (sprintId, userId, role) => {
    await api.addMemberToSprint(sprintId, userId, role);
    const members = await api.listSprintMembers(sprintId);
    set({ members });
  },

  removeMember: async (sprintId, userId) => {
    await api.removeMemberFromSprint(sprintId, userId);
    set((s) => ({
      members: s.members.filter((m) => m.userId !== userId),
    }));
  },
}));

// ─── Org Store (Organization/Business) ──────────────────────────

interface OrgState {
  org: Organization | null;
  members: OrgMember[];
  voltEdgeTeams: VoltEdgeTeam[];
  loading: boolean;

  loadOrg: (orgId: string) => Promise<void>;
  loadMembers: (orgId: string) => Promise<void>;
  loadOrgTeams: (orgId: string) => Promise<void>;
  updateMemberRole: (orgId: string, userId: string, role: OrgRole) => Promise<void>;
  removeMember: (orgId: string, userId: string) => Promise<void>;
  createInvite: (orgId: string, email?: string, role?: OrgRole) => Promise<string | null>;
  reset: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  org: null,
  members: [],
  voltEdgeTeams: [],
  loading: false,

  loadOrg: async (orgId: string) => {
    set({ loading: true });
    try {
      const org = await getOrganization(orgId);
      set({ org, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  loadMembers: async (orgId: string) => {
    try {
      const members = await listOrgMembers(orgId);
      set({ members });
    } catch {
      // silent
    }
  },

  loadOrgTeams: async (orgId: string) => {
    try {
      const voltEdgeTeams = await listTeamsForOrg(orgId);
      set({ voltEdgeTeams });
    } catch {
      // silent
    }
  },

  updateMemberRole: async (orgId, userId, role) => {
    const updated = await updateOrgMemberRoleAction(orgId, userId, role);
    set((s) => ({
      members: s.members.map((m) => (m.userId === userId ? updated : m)),
    }));
  },

  removeMember: async (orgId, userId) => {
    await removeOrgMemberAction(orgId, userId);
    set((s) => ({
      members: s.members.filter((m) => m.userId !== userId),
    }));
  },

  createInvite: async (orgId, email, role = "member") => {
    try {
      const invite = await createOrgInviteAction(orgId, email, role);
      return invite.code;
    } catch {
      return null;
    }
  },

  reset: () => set({ org: null, members: [], voltEdgeTeams: [], loading: false }),
}));

// ─── VoltEdge Team Store (RBAC Team Management) ─────────────────

interface VoltEdgeTeamState {
  teams: VoltEdgeTeam[];
  activeTeamId: string | null;
  loading: boolean;

  loadMyTeams: (userId: string) => Promise<void>;
  setActiveTeam: (teamId: string | null) => void;
  getActiveTeam: () => VoltEdgeTeam | undefined;
}

export const useVoltEdgeTeamStore = create<VoltEdgeTeamState>((set, get) => ({
  teams: [],
  activeTeamId: null,
  loading: false,

  loadMyTeams: async (userId: string) => {
    set({ loading: true });
    try {
      const teams = await listVoltEdgeTeams(userId);
      set({ teams, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setActiveTeam: (teamId) => set({ activeTeamId: teamId }),

  getActiveTeam: () => {
    const { teams, activeTeamId } = get();
    return activeTeamId ? teams.find((t) => t.id === activeTeamId) : undefined;
  },
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
// Keys are saved to the database (encrypted) and cached locally.

interface KeyMeta {
  keyPrefix: string;
  keySuffix: string;
}

interface SettingsState {
  provider: AIProvider;
  keys: Record<AIProvider, string | null>;
  keyMeta: Record<AIProvider, KeyMeta | null>;
  dbLoaded: boolean;
  init: (userId?: string) => Promise<void>;
  setProvider: (provider: AIProvider) => void;
  setKey: (provider: AIProvider, key: string, userId?: string) => Promise<void>;
  clearKey: (provider: AIProvider, userId?: string) => Promise<void>;
  getActiveKey: () => string | null;
  hasAnyKey: () => boolean;
  // Prompt Preferences
  promptPrefs: PromptPreferences;
  promptPrefsLoaded: boolean;
  initPromptPrefs: () => Promise<void>;
  updatePromptPrefs: (updates: Partial<PromptPreferences>) => void;
  savePromptPrefs: () => Promise<void>;
  resetPromptPrefs: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  provider: "anthropic",
  keys: { anthropic: null, openai: null, google: null },
  keyMeta: { anthropic: null, openai: null, google: null },
  dbLoaded: false,

  init: async (userId?: string) => {
    // 1. Load from localStorage first (instant)
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("voltedge:settings");
        if (raw) {
          const parsed = JSON.parse(raw);
          // Migration from old format (single anthropicApiKey)
          if (parsed.anthropicApiKey && !parsed.keys) {
            const migrated = {
              provider: "anthropic" as AIProvider,
              keys: { anthropic: parsed.anthropicApiKey, openai: null, google: null },
            };
            localStorage.setItem("voltedge:settings", JSON.stringify(migrated));
            set({ ...migrated, keyMeta: { anthropic: null, openai: null, google: null } });
          } else if (parsed.keys) {
            set({
              provider: parsed.provider || "anthropic",
              keys: {
                anthropic: parsed.keys.anthropic || null,
                openai: parsed.keys.openai || null,
                google: parsed.keys.google || null,
              },
            });
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. Load from DB (async) -- brings keys from server
    if (userId) {
      try {
        const res = await fetch("/api/settings/keys");
        if (res.ok) {
          const data = await res.json();
          const dbKeys = data.keys as Array<{
            provider: AIProvider;
            keyPrefix: string;
            keySuffix: string;
            isActive: boolean;
          }>;

          const newMeta: Record<AIProvider, KeyMeta | null> = {
            anthropic: null,
            openai: null,
            google: null,
          };

          // For each DB key, if the local cache doesn't have a key, fetch the decrypted version
          for (const dbKey of dbKeys) {
            if (dbKey.isActive) {
              newMeta[dbKey.provider] = {
                keyPrefix: dbKey.keyPrefix,
                keySuffix: dbKey.keySuffix,
              };

              // If local cache is empty for this provider, fetch decrypted key
              const currentKeys = get().keys;
              if (!currentKeys[dbKey.provider]) {
                const decryptRes = await fetch(
                  `/api/settings/keys/decrypt?provider=${dbKey.provider}`
                );
                if (decryptRes.ok) {
                  const { key: decryptedKey } = await decryptRes.json();
                  if (decryptedKey) {
                    set((s) => ({
                      keys: { ...s.keys, [dbKey.provider]: decryptedKey },
                    }));
                    // Also cache locally
                    const state = get();
                    if (typeof window !== "undefined") {
                      localStorage.setItem(
                        "voltedge:settings",
                        JSON.stringify({ provider: state.provider, keys: state.keys })
                      );
                    }
                  }
                }
              }
            }
          }

          set({ keyMeta: newMeta, dbLoaded: true });
        }
      } catch {
        // DB unavailable -- continue with localStorage keys
        set({ dbLoaded: true });
      }
    }
  },

  setProvider: (provider) => {
    set({ provider });
    const state = get();
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "voltedge:settings",
        JSON.stringify({ provider, keys: state.keys })
      );
    }
  },

  setKey: async (provider, key, userId) => {
    // Update local state + localStorage immediately
    set((s) => {
      const keys = { ...s.keys, [provider]: key };
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "voltedge:settings",
          JSON.stringify({ provider: s.provider, keys })
        );
      }
      return { keys };
    });

    // Persist to database
    if (userId) {
      try {
        await fetch("/api/settings/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, key }),
        });
        // Update meta
        set((s) => ({
          keyMeta: {
            ...s.keyMeta,
            [provider]: { keyPrefix: key.slice(0, 7), keySuffix: key.slice(-4) },
          },
        }));
      } catch {
        // DB save failed -- key still in localStorage
      }
    }
  },

  clearKey: async (provider, userId) => {
    set((s) => {
      const keys = { ...s.keys, [provider]: null };
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "voltedge:settings",
          JSON.stringify({ provider: s.provider, keys })
        );
      }
      return {
        keys,
        keyMeta: { ...s.keyMeta, [provider]: null },
      };
    });

    // Delete from database
    if (userId) {
      try {
        await fetch(`/api/settings/keys?provider=${provider}&hard=true`, {
          method: "DELETE",
        });
      } catch {
        // silent
      }
    }
  },

  getActiveKey: () => {
    const { provider, keys } = get();
    return keys[provider] || null;
  },

  hasAnyKey: () => {
    const { keys } = get();
    return Object.values(keys).some((k) => k !== null && k !== "");
  },

  // ─── Prompt Preferences ──────────────────────────────────────────

  promptPrefs: { ...DEFAULT_PROMPT_PREFERENCES },
  promptPrefsLoaded: false,

  initPromptPrefs: async () => {
    try {
      const res = await fetch("/api/settings/prompt-preferences");
      if (res.ok) {
        const { preferences } = await res.json();
        set({
          promptPrefs: { ...DEFAULT_PROMPT_PREFERENCES, ...preferences },
          promptPrefsLoaded: true,
        });
      } else {
        set({ promptPrefsLoaded: true });
      }
    } catch {
      set({ promptPrefsLoaded: true });
    }
  },

  updatePromptPrefs: (updates) => {
    set((s) => ({
      promptPrefs: { ...s.promptPrefs, ...updates },
    }));
  },

  savePromptPrefs: async () => {
    const prefs = get().promptPrefs;
    try {
      await fetch("/api/settings/prompt-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
    } catch {
      // silent — preferences still work locally
    }
  },

  resetPromptPrefs: () => {
    set({ promptPrefs: { ...DEFAULT_PROMPT_PREFERENCES } });
    get().savePromptPrefs();
  },
}));

// ─── Chat Store (Chat-with-Context) ─────────────────────────────

import {
  listChatHistoriesAction,
  deleteChatHistoryAction,
} from "./actions/chat";

interface ChatState {
  panelOpen: boolean;
  activeHistoryId: string | null;
  histories: ChatHistory[];
  loading: boolean;

  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setActiveHistory: (id: string | null) => void;
  loadHistories: (userId: string, contextType?: ChatContextType, contextId?: string) => Promise<void>;
  addHistory: (history: ChatHistory) => void;
  updateHistory: (history: ChatHistory) => void;
  removeHistory: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useChatStore = create<ChatState>((set, get) => ({
  panelOpen: false,
  activeHistoryId: null,
  histories: [],
  loading: false,

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  setActiveHistory: (id) => set({ activeHistoryId: id }),

  loadHistories: async (userId, contextType, contextId) => {
    set({ loading: true });
    try {
      const histories = await listChatHistoriesAction(userId, contextType, contextId);
      set({ histories, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addHistory: (history) => {
    set((s) => ({ histories: [history, ...s.histories] }));
  },

  updateHistory: (history) => {
    set((s) => ({
      histories: s.histories.map((h) => (h.id === history.id ? history : h)),
    }));
  },

  removeHistory: async (id) => {
    await deleteChatHistoryAction(id);
    set((s) => ({
      histories: s.histories.filter((h) => h.id !== id),
      activeHistoryId: s.activeHistoryId === id ? null : s.activeHistoryId,
    }));
  },
}));

// ─── Portfolio Store (Appendix A.1) ─────────────────────────────

import {
  listPortfoliosAction,
  getPortfolioAction,
  createPortfolioAction,
  updatePortfolioAction,
  deletePortfolioAction,
  addPortfolioIdeaAction,
  updatePortfolioIdeaAction,
  removePortfolioIdeaAction,
} from "./actions/portfolios";

interface PortfolioState {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  loading: boolean;

  loadPortfolios: (userId: string) => Promise<void>;
  setActivePortfolio: (id: string | null) => void;
  createPortfolio: (userId: string, name: string, description?: string) => Promise<Portfolio>;
  updatePortfolio: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  addEntry: (portfolioId: string, data: {
    ideaId?: string;
    externalPatentNo?: string;
    externalTitle?: string;
    filingDate?: string;
    grantDate?: string;
    status?: PortfolioIdeaStatus;
    notes?: string;
    cpcClasses?: string[];
  }) => Promise<void>;
  updateEntry: (id: string, updates: {
    externalPatentNo?: string;
    externalTitle?: string;
    filingDate?: string | null;
    grantDate?: string | null;
    status?: PortfolioIdeaStatus;
    notes?: string;
    cpcClasses?: string[];
  }) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  activePortfolio: null,
  loading: false,

  loadPortfolios: async (userId: string) => {
    set({ loading: true });
    try {
      const portfolios = await listPortfoliosAction(userId);
      const current = get().activePortfolio;
      const active = current
        ? portfolios.find((p) => p.id === current.id) ?? portfolios[0] ?? null
        : portfolios[0] ?? null;
      set({ portfolios, activePortfolio: active, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setActivePortfolio: (id) => {
    const p = id ? get().portfolios.find((p) => p.id === id) ?? null : null;
    set({ activePortfolio: p });
  },

  createPortfolio: async (userId, name, description = "") => {
    const created = await createPortfolioAction(userId, name, description);
    set((s) => ({
      portfolios: [created, ...s.portfolios],
      activePortfolio: created,
    }));
    return created;
  },

  updatePortfolio: async (id, updates) => {
    const updated = await updatePortfolioAction(id, updates);
    if (!updated) return;
    set((s) => ({
      portfolios: s.portfolios.map((p) => (p.id === id ? updated : p)),
      activePortfolio: s.activePortfolio?.id === id ? updated : s.activePortfolio,
    }));
  },

  deletePortfolio: async (id) => {
    await deletePortfolioAction(id);
    set((s) => {
      const remaining = s.portfolios.filter((p) => p.id !== id);
      return {
        portfolios: remaining,
        activePortfolio: s.activePortfolio?.id === id ? remaining[0] ?? null : s.activePortfolio,
      };
    });
  },

  addEntry: async (portfolioId, data) => {
    await addPortfolioIdeaAction(portfolioId, data);
    // Reload to get fresh data
    const updated = await getPortfolioAction(portfolioId);
    if (updated) {
      set((s) => ({
        portfolios: s.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
        activePortfolio: s.activePortfolio?.id === portfolioId ? updated : s.activePortfolio,
      }));
    }
  },

  updateEntry: async (id, updates) => {
    const entry = await updatePortfolioIdeaAction(id, updates);
    if (!entry) return;
    // Find which portfolio this entry belongs to and refresh
    const portfolioId = entry.portfolioId;
    const updated = await getPortfolioAction(portfolioId);
    if (updated) {
      set((s) => ({
        portfolios: s.portfolios.map((p) => (p.id === portfolioId ? updated : p)),
        activePortfolio: s.activePortfolio?.id === portfolioId ? updated : s.activePortfolio,
      }));
    }
  },

  removeEntry: async (id) => {
    // Find the portfolio this entry belongs to before removing
    const allEntries = get().portfolios.flatMap((p) => p.ideas ?? []);
    const entry = allEntries.find((e) => e.id === id);
    await removePortfolioIdeaAction(id);
    if (entry) {
      const updated = await getPortfolioAction(entry.portfolioId);
      if (updated) {
        set((s) => ({
          portfolios: s.portfolios.map((p) => (p.id === entry.portfolioId ? updated : p)),
          activePortfolio: s.activePortfolio?.id === entry.portfolioId ? updated : s.activePortfolio,
        }));
      }
    }
  },
}));
