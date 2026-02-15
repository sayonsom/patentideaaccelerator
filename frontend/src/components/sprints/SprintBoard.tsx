"use client";

import { useState, useCallback } from "react";
import type { Team, Idea, TeamTimer, SessionMode, SprintPhase } from "@/lib/types";
import { SPRINT_PHASES, SESSION_MODES } from "@/lib/constants";
import { uid, getTotalScore, getScoreVerdict, timeAgo } from "@/lib/utils";
import { Button, Badge, Card, Input } from "@/components/ui";
import { SprintTimer } from "./SprintTimer";
import { TeamPanel } from "./TeamPanel";
import { SprintDashboard } from "./SprintDashboard";
import { getTeamCategoryBreakdown } from "@/lib/team-formation";

interface SprintBoardProps {
  team: Team;
  onUpdateTeam: (team: Team) => void;
  onBack: () => void;
}

export function SprintBoard({ team, onUpdateTeam, onBack }: SprintBoardProps) {
  const [newTitle, setNewTitle] = useState("");
  const [activePhase, setActivePhase] = useState<SprintPhase | "all">("all");
  const [sortBy, setSortBy] = useState<"created" | "score">("created");
  const [activeMemberId, setActiveMemberId] = useState<string | null>(
    team.dataMinister || team.members?.[0]?.id || null
  );

  const breakdown = getTeamCategoryBreakdown(team);

  const updateTeam = useCallback(
    (updates: Partial<Team>) => {
      onUpdateTeam({ ...team, ...updates, lastActivityAt: Date.now() });
    },
    [team, onUpdateTeam]
  );

  // ─── Idea CRUD ────────────────────────────────────────────────
  const addIdea = () => {
    if (!newTitle.trim()) return;
    const nowMs = Date.now();
    const newIdea: Idea = {
      id: uid(),
      userId: activeMemberId ?? "anonymous",
      sprintId: team.id,
      title: newTitle.trim(),
      problemStatement: "",
      existingApproach: "",
      proposedSolution: "",
      technicalApproach: "",
      contradictionResolved: "",
      priorArtNotes: "",
      redTeamNotes: "",
      status: "draft",
      phase: "foundation",
      score: null,
      aliceScore: null,
      frameworkUsed: "none",
      frameworkData: {},
      claimDraft: null,
      tags: [],
      techStack: [],
      createdAt: new Date(nowMs).toISOString(),
      updatedAt: new Date(nowMs).toISOString(),
    };
    updateTeam({ ideas: [...team.ideas, newIdea] });
    setNewTitle("");
  };

  const updateIdea = (id: string, updates: Partial<Idea>) => {
    updateTeam({
      ideas: team.ideas.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
      ),
    });
  };

  const deleteIdea = (id: string) => {
    updateTeam({ ideas: team.ideas.filter((i) => i.id !== id) });
  };

  const advanceIdea = (id: string) => {
    updateTeam({
      ideas: team.ideas.map((i) => {
        if (i.id !== id) return i;
        const idx = SPRINT_PHASES.findIndex((p) => p.key === i.phase);
        if (idx >= SPRINT_PHASES.length - 1) return i;
        return { ...i, phase: SPRINT_PHASES[idx + 1].key, updatedAt: new Date().toISOString() };
      }),
    });
  };

  const retreatIdea = (id: string) => {
    updateTeam({
      ideas: team.ideas.map((i) => {
        if (i.id !== id) return i;
        const idx = SPRINT_PHASES.findIndex((p) => p.key === i.phase);
        if (idx <= 0) return i;
        return { ...i, phase: SPRINT_PHASES[idx - 1].key, updatedAt: new Date().toISOString() };
      }),
    });
  };

  // ─── Session mode ─────────────────────────────────────────────
  const currentMode = SESSION_MODES.find((m) => m.key === team.sessionMode) || SESSION_MODES[0];

  // ─── Filter + Sort ────────────────────────────────────────────
  const phaseCounts = SPRINT_PHASES.map((p) => ({
    ...p,
    count: team.ideas.filter((i) => i.phase === p.key).length,
  }));

  const filtered = activePhase === "all"
    ? team.ideas
    : team.ideas.filter((i) => i.phase === activePhase);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") {
      const sa = getTotalScore(a.score);
      const sb = getTotalScore(b.score);
      return sb - sa;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-accent-gold text-lg">&#9651;</span>
            <h2 className="text-xl font-display font-bold text-text-primary">{team.name}</h2>
            <span className="text-xs font-mono font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
              {breakdown.count}/{breakdown.total} categories
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {team.members.map((m) => m.name).join(", ")}
            {" \u00B7 "}{team.ideas.length} concept{team.ideas.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Timer */}
          <SprintTimer
            timer={team.timer}
            sprintPhase={team.sprintPhase}
            onUpdate={(timer: TeamTimer) => updateTeam({ timer })}
          />

          {/* Sprint phase selector */}
          <div className="bg-surface-deep rounded-lg border border-border-default p-3">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Sprint Phase</div>
            <div className="flex gap-1 flex-wrap">
              {SPRINT_PHASES.map((p) => (
                <button
                  key={p.key}
                  onClick={() => updateTeam({ sprintPhase: p.key })}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                  style={{
                    background: team.sprintPhase === p.key ? p.color + "20" : "var(--color-surface-card)",
                    border: `1px solid ${team.sprintPhase === p.key ? p.color + "60" : "var(--color-border-default)"}`,
                    color: team.sprintPhase === p.key ? p.color : "var(--color-text-secondary)",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Session mode */}
          <div
            className="bg-surface-deep rounded-lg border p-3"
            style={{ borderColor: currentMode.color + "30" }}
          >
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Session Mode</div>
              <div className="flex gap-1">
                {SESSION_MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => updateTeam({ sessionMode: m.key as SessionMode })}
                    className="px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                    style={{
                      background: team.sessionMode === m.key ? m.color + "20" : "var(--color-surface-card)",
                      border: `1px solid ${team.sessionMode === m.key ? m.color + "60" : "var(--color-border-default)"}`,
                      color: team.sessionMode === m.key ? m.color : "var(--color-text-secondary)",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs font-semibold mb-1" style={{ color: currentMode.color }}>
              {currentMode.label} Mode &middot; Target: {currentMode.target}
            </p>
            <div className="flex flex-wrap gap-1">
              {currentMode.rules.map((r, i) => (
                <span key={i} className="text-[11px] text-text-secondary bg-surface-card rounded px-2 py-0.5">
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Phase filter tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setActivePhase("all")}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-colors ${
                activePhase === "all"
                  ? "bg-surface-card border border-gray-500 text-text-primary"
                  : "bg-surface-deep border border-border-default text-text-muted"
              }`}
            >
              All ({team.ideas.length})
            </button>
            {phaseCounts.map((p) => (
              <button
                key={p.key}
                onClick={() => setActivePhase(p.key)}
                className="px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold flex items-center gap-1.5 transition-colors"
                style={{
                  background: activePhase === p.key ? p.color + "20" : "var(--color-surface-deep)",
                  border: `1px solid ${activePhase === p.key ? p.color + "60" : "var(--color-border-default)"}`,
                  color: activePhase === p.key ? p.color : "var(--color-text-muted)",
                }}
              >
                {p.label}
                {p.count > 0 && (
                  <span
                    className="rounded-full px-1.5 text-[10px] font-bold"
                    style={{ background: p.color + "30", color: p.color }}
                  >
                    {p.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Add idea */}
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New concept title..."
              onKeyDown={(e) => e.key === "Enter" && addIdea()}
              className="flex-1"
            />
            <Button variant="accent" size="sm" disabled={!newTitle.trim()} onClick={addIdea}>
              Add Concept
            </Button>
          </div>

          {/* Sort */}
          {team.ideas.length > 1 && (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-text-muted">Sort:</span>
              {([["created", "Newest"], ["score", "3x3 Score"]] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setSortBy(k)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    sortBy === k ? "bg-surface-card text-text-primary" : "text-text-muted"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Ideas list */}
          {sorted.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              <div className="text-3xl mb-2">{"\u25C8"}</div>
              <p className="text-sm">
                {team.ideas.length === 0
                  ? "No concepts yet. Start your brainstorm above!"
                  : "No concepts in this phase."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((idea) => (
                <SprintIdeaCard
                  key={idea.id}
                  idea={idea}
                  onUpdate={(updates) => updateIdea(idea.id, updates)}
                  onDelete={() => deleteIdea(idea.id)}
                  onAdvance={() => advanceIdea(idea.id)}
                  onRetreat={() => retreatIdea(idea.id)}
                />
              ))}
            </div>
          )}

          {/* Dashboard */}
          {team.ideas.length > 0 && (
            <SprintDashboard ideas={team.ideas} />
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <TeamPanel
            members={team.members}
            dataMinisterId={team.dataMinister}
            activeMemberId={activeMemberId}
            onActiveMemberChange={setActiveMemberId}
            onDataMinisterChange={(id) => updateTeam({ dataMinister: id })}
            categoryBreakdown={breakdown}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sprint Idea Card ─────────────────────────────────────────────

interface SprintIdeaCardProps {
  idea: Idea;
  onUpdate: (updates: Partial<Idea>) => void;
  onDelete: () => void;
  onAdvance: () => void;
  onRetreat: () => void;
}

function SprintIdeaCard({ idea, onUpdate, onDelete, onAdvance, onRetreat }: SprintIdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const phase = SPRINT_PHASES.find((p) => p.key === idea.phase) || SPRINT_PHASES[0];
  const total = getTotalScore(idea.score);
  const phaseIdx = SPRINT_PHASES.findIndex((p) => p.key === idea.phase);
  const verdict = getScoreVerdict(total);

  return (
    <Card borderColor={phase.color}>
      {/* Collapsed header */}
      <div className="flex justify-between items-start">
        <div className="flex-1 cursor-pointer min-w-0" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-text-primary font-semibold text-sm">{idea.title || "Untitled"}</span>
            <Badge variant="outline" color={phase.color}>
              {phase.label}
            </Badge>
            {total > 0 && (
              <span
                className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full"
                style={{ backgroundColor: verdict.color + "20", color: verdict.color }}
              >
                {total}/9
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted line-clamp-2">
            {idea.problemStatement || idea.proposedSolution || "No description yet."}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-text-primary ml-2 text-sm"
        >
          {expanded ? "\u25BE" : "\u25B8"}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border-default space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Title</label>
            <Input value={idea.title} onChange={(e) => onUpdate({ title: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Problem Statement</label>
            <textarea
              value={idea.problemStatement}
              onChange={(e) => onUpdate({ problemStatement: e.target.value })}
              placeholder="What contradiction or gap does this solve?"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-surface-deep border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/40 resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Proposed Solution</label>
            <textarea
              value={idea.proposedSolution}
              onChange={(e) => onUpdate({ proposedSolution: e.target.value })}
              placeholder="What's the proposed approach?"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-surface-deep border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/40 resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Red Team Notes</label>
            <textarea
              value={idea.redTeamNotes}
              onChange={(e) => onUpdate({ redTeamNotes: e.target.value })}
              placeholder={'"This will fail because..." — capture weaknesses here'}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-surface-deep border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/40 resize-none"
            />
          </div>

          {/* Phase navigation + delete */}
          <div className="flex justify-between items-center pt-2 border-t border-border-default">
            <div className="flex gap-1.5">
              {phaseIdx > 0 && (
                <Button variant="secondary" size="sm" onClick={onRetreat}>
                  &larr; {SPRINT_PHASES[phaseIdx - 1].label}
                </Button>
              )}
              {phaseIdx < SPRINT_PHASES.length - 1 && (
                <Button variant="accent" size="sm" onClick={onAdvance}>
                  Advance &rarr; {SPRINT_PHASES[phaseIdx + 1].label}
                </Button>
              )}
            </div>
            <Button variant="danger" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>

          <div className="text-[10px] text-text-muted">
            Updated {timeAgo(idea.updatedAt)}
          </div>
        </div>
      )}
    </Card>
  );
}
