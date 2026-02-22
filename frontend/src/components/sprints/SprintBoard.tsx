"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Sprint, Idea, SprintMemberRecord, SessionMode, SprintPhase, TeamTimer } from "@/lib/types";
import { SPRINT_PHASES, SESSION_MODES } from "@/lib/constants";
import { getTotalScore, getScoreVerdict, getIdeaProgress } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import { SprintTimer } from "./SprintTimer";
import { useSprintStore } from "@/lib/store";
import * as api from "@/lib/api";

interface SprintBoardProps {
  sprint: Sprint;
  ideas: Idea[];
  candidates: Idea[];
  members: SprintMemberRecord[];
  onBack: () => void;
}

export function SprintBoard({ sprint, ideas, candidates, members, onBack }: SprintBoardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    updateSprint,
    addIdeaToSprint,
    removeIdeaFromSprint,
    quickAddIdea,
    loadSprintDetail,
  } = useSprintStore();

  const [newTitle, setNewTitle] = useState("");
  const [activePhase, setActivePhase] = useState<SprintPhase | "all">("all");
  const [sortBy, setSortBy] = useState<"created" | "score" | "alice">("created");
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");

  const userId = session?.user?.id ?? "";

  // ─── Sprint updates ─────────────────────────────────────────────
  const handleSprintUpdate = useCallback(
    (updates: Partial<Pick<Sprint, "name" | "description" | "theme" | "status" | "sessionMode" | "phase" | "timerSecondsRemaining" | "timerRunning" | "startedAt">>) => {
      updateSprint(sprint.id, updates);
    },
    [sprint.id, updateSprint]
  );

  // ─── Quick-add idea ─────────────────────────────────────────────
  const handleQuickAdd = async () => {
    if (!newTitle.trim() || !userId) return;
    await quickAddIdea(newTitle.trim(), sprint.id, userId);
    setNewTitle("");
  };

  // ─── Idea phase management ──────────────────────────────────────
  const updateIdeaPhase = async (ideaId: string, newPhase: SprintPhase) => {
    await api.updateIdea(ideaId, { phase: newPhase });
    loadSprintDetail(sprint.id);
  };

  // ─── Session mode ─────────────────────────────────────────────
  const currentMode = SESSION_MODES.find((m) => m.key === sprint.sessionMode) || SESSION_MODES[0];

  // ─── Filter + Sort ────────────────────────────────────────────
  const phaseCounts = SPRINT_PHASES.map((p) => ({
    ...p,
    count: ideas.filter((i) => i.phase === p.key).length,
  }));

  const filtered = activePhase === "all"
    ? ideas
    : ideas.filter((i) => i.phase === activePhase);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") {
      return getTotalScore(b.score) - getTotalScore(a.score);
    }
    if (sortBy === "alice") {
      return (b.aliceScore?.overallScore ?? 0) - (a.aliceScore?.overallScore ?? 0);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // ─── Candidate filtering ──────────────────────────────────────
  const filteredCandidates = candidateSearch
    ? candidates.filter((i) =>
        i.title.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        i.problemStatement.toLowerCase().includes(candidateSearch.toLowerCase())
      )
    : candidates;

  // ─── Member name lookup ───────────────────────────────────────
  const getMemberName = (uid: string) => {
    const m = members.find((mem) => mem.userId === uid);
    return m?.user?.name ?? "Unknown";
  };

  // ─── Sprint health metrics ─────────────────────────────────────
  const modeTarget = currentMode.key === "quantity" ? 50 : currentMode.key === "quality" ? 10 : 5;
  const progressPct = Math.min(100, Math.round((ideas.length / modeTarget) * 100));
  const scoredIdeas = ideas.filter((i) => i.score && getTotalScore(i.score) > 0);
  const avgScore = scoredIdeas.length
    ? (scoredIdeas.reduce((a, i) => a + getTotalScore(i.score), 0) / scoredIdeas.length).toFixed(1)
    : null;
  const aliceScoredIdeas = ideas.filter((i) => i.aliceScore);
  const avgAlice = aliceScoredIdeas.length
    ? Math.round(aliceScoredIdeas.reduce((a, i) => a + (i.aliceScore?.overallScore ?? 0), 0) / aliceScoredIdeas.length)
    : null;

  // Contributor counts
  const contributorCounts = new Map<string, number>();
  for (const idea of ideas) {
    contributorCounts.set(idea.userId, (contributorCounts.get(idea.userId) ?? 0) + 1);
  }

  return (
    <div>
      {/* ─── Compact Header ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-text-muted hover:text-ink transition-colors p-1 -ml-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-serif font-bold text-ink truncate">{sprint.name}</h2>
          {sprint.theme && (
            <p className="text-xs text-blue-ribbon/80 truncate">{sprint.theme}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Phase pill */}
          {SPRINT_PHASES.map((p) => (
            <button
              key={p.key}
              onClick={() => handleSprintUpdate({ phase: p.key })}
              className="px-2 py-1 rounded text-[11px] font-medium transition-colors"
              style={{
                background: sprint.phase === p.key ? p.color + "18" : "transparent",
                color: sprint.phase === p.key ? p.color : "var(--color-text-muted)",
                border: `1px solid ${sprint.phase === p.key ? p.color + "50" : "transparent"}`,
              }}
            >
              {p.label}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          {/* Session mode pills */}
          {SESSION_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => handleSprintUpdate({ sessionMode: m.key as SessionMode })}
              className="px-2 py-1 rounded text-[11px] font-medium transition-colors"
              style={{
                background: sprint.sessionMode === m.key ? m.color + "18" : "transparent",
                color: sprint.sessionMode === m.key ? m.color : "var(--color-text-muted)",
                border: `1px solid ${sprint.sessionMode === m.key ? m.color + "50" : "transparent"}`,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Timer Bar (compact, single line) ──────────────────────── */}
      <div className="bg-white rounded-lg border border-border px-3 py-2 mb-4">
        <SprintTimer
          compact
          timer={{
            budgetSeconds: 259200,
            spentSeconds: 259200 - sprint.timerSecondsRemaining,
            runningSinceMs: sprint.timerRunning ? Date.now() : null,
            startedAtMs: sprint.startedAt ? new Date(sprint.startedAt).getTime() : null,
            startedStage: sprint.phase,
          }}
          sprintPhase={sprint.phase as SprintPhase}
          onUpdate={(timer: TeamTimer) => {
            handleSprintUpdate({
              timerSecondsRemaining: timer.budgetSeconds - timer.spentSeconds,
              timerRunning: timer.runningSinceMs !== null,
              startedAt: timer.startedAtMs ? new Date(timer.startedAtMs).toISOString() : null,
            });
          }}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* ─── Left: Main content ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Quick-add bar — prominent hero */}
          <div className="bg-white rounded-lg border border-blue-ribbon/20 p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    sprint.sessionMode === "quantity"
                      ? "Brainstorm: type an idea and hit Enter..."
                      : "Add an idea to this sprint..."
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                  className="pr-16"
                />
              </div>
              <Button variant="accent" size="sm" disabled={!newTitle.trim()} onClick={handleQuickAdd}>
                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/ideas/new?sprintId=${sprint.id}`)}
              >
                Full Wizard
              </Button>
            </div>
            {sprint.sessionMode === "quantity" && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPct}%`,
                      background: progressPct >= 100 ? "#10b981" : progressPct >= 50 ? "#3b82f6" : "#9CA3AF",
                    }}
                  />
                </div>
                <span className="text-[10px] text-text-muted shrink-0 tabular-nums">
                  {ideas.length}/{modeTarget} ideas
                </span>
              </div>
            )}
          </div>

          {/* Phase filter + Sort — compact row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1 overflow-x-auto">
              <button
                onClick={() => setActivePhase("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activePhase === "all"
                    ? "bg-ink text-white"
                    : "text-text-muted hover:text-ink"
                }`}
              >
                All ({ideas.length})
              </button>
              {phaseCounts.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActivePhase(p.key)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                  style={{
                    background: activePhase === p.key ? p.color + "18" : "transparent",
                    color: activePhase === p.key ? p.color : "var(--color-text-muted)",
                  }}
                >
                  {p.label}
                  {p.count > 0 && (
                    <span
                      className="rounded-full px-1 text-[10px]"
                      style={{ background: p.color + "25", color: p.color }}
                    >
                      {p.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {ideas.length > 1 && (
              <div className="flex gap-0.5 shrink-0">
                {([["created", "New"], ["score", "Score"], ["alice", "Alice"]] as const).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setSortBy(k)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      sortBy === k ? "bg-gray-100 text-ink" : "text-text-muted hover:text-ink"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Ideas list ──────────────────────────────────────────── */}
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <p className="text-sm">
                {ideas.length === 0
                  ? "No ideas yet. Start brainstorming above!"
                  : "No ideas in this phase."}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sorted.map((idea) => (
                <SprintIdeaCard
                  key={idea.id}
                  idea={idea}
                  creatorName={getMemberName(idea.userId)}
                  onAdvance={() => {
                    const idx = SPRINT_PHASES.findIndex((p) => p.key === idea.phase);
                    if (idx < SPRINT_PHASES.length - 1) {
                      updateIdeaPhase(idea.id, SPRINT_PHASES[idx + 1].key);
                    }
                  }}
                  onRetreat={() => {
                    const idx = SPRINT_PHASES.findIndex((p) => p.key === idea.phase);
                    if (idx > 0) {
                      updateIdeaPhase(idea.id, SPRINT_PHASES[idx - 1].key);
                    }
                  }}
                  onRemove={() => removeIdeaFromSprint(idea.id)}
                />
              ))}
            </div>
          )}

          {/* ─── Candidate Ideas Panel ────────────────────────────────── */}
          <div className="bg-white rounded-lg border border-border">
            <button
              onClick={() => setShowCandidates(!showCandidates)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Ideas from Sprint Members
                </span>
                {candidates.length > 0 && (
                  <span className="text-[10px] bg-blue-ribbon/10 text-blue-ribbon px-2 py-0.5 rounded-full font-medium">
                    {candidates.length}
                  </span>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-text-muted transition-transform ${showCandidates ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showCandidates && (
              <div className="border-t border-border p-3 space-y-2">
                {candidates.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">
                    No unlinked ideas from sprint members.
                  </p>
                ) : (
                  <>
                    <Input
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder="Search candidates..."
                      className="text-xs"
                    />
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                      {filteredCandidates.map((idea) => (
                        <CandidateIdeaCard
                          key={idea.id}
                          idea={idea}
                          creatorName={getMemberName(idea.userId)}
                          onAdd={() => addIdeaToSprint(idea.id, sprint.id)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right sidebar ──────────────────────────────────────────── */}
        <div className="w-full lg:w-72 shrink-0 space-y-3">
          {/* Sprint Health — the key metric card */}
          <div className="bg-white rounded-lg border border-border p-3">
            <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Sprint Health</div>

            {/* Target progress */}
            <div className="mb-3">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-semibold font-mono text-ink">{ideas.length}</span>
                <span className="text-xs text-text-muted">/ {modeTarget} {currentMode.label} target</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: progressPct >= 100 ? "#10b981" : progressPct >= 60 ? currentMode.color : "#9CA3AF",
                  }}
                />
              </div>
            </div>

            {/* Phase distribution mini-bar */}
            {ideas.length > 0 && (
              <div className="flex gap-px h-5 rounded overflow-hidden mb-3">
                {phaseCounts.filter((p) => p.count > 0).map((p) => (
                  <div
                    key={p.key}
                    className="flex items-center justify-center text-[10px] font-medium"
                    style={{
                      flex: p.count,
                      backgroundColor: p.color + "30",
                      color: p.color,
                    }}
                    title={`${p.label}: ${p.count}`}
                  >
                    {p.count}
                  </div>
                ))}
              </div>
            )}

            {/* Scores row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="text-sm font-semibold font-mono text-ink">{avgScore ?? "—"}</div>
                <div className="text-[10px] text-text-muted">Avg 3x3</div>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="text-sm font-semibold font-mono text-ink">{avgAlice ?? "—"}</div>
                <div className="text-[10px] text-text-muted">Avg Alice</div>
              </div>
            </div>
          </div>

          {/* Members — compact avatar row */}
          <div className="bg-white rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Team</div>
              <span className="text-[10px] text-text-muted">{members.length}</span>
            </div>

            {members.length > 0 ? (
              <div className="space-y-1.5">
                {members.map((m) => {
                  const count = contributorCounts.get(m.userId) ?? 0;
                  return (
                    <div key={m.userId} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-neutral-dark shrink-0">
                        {(m.user?.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-ink flex-1 truncate">{m.user?.name ?? m.userId}</span>
                      {m.userId === sprint.ownerId && (
                        <span className="text-[9px] text-blue-ribbon bg-blue-ribbon/10 px-1.5 py-0.5 rounded font-medium">Lead</span>
                      )}
                      {m.role === "data_minister" && (
                        <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">DM</span>
                      )}
                      <span className="text-[10px] font-mono text-text-muted tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No members yet.</p>
            )}
          </div>

          {/* Mode guidance — compact */}
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: currentMode.color + "30", background: currentMode.color + "06" }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: currentMode.color }}>
              {currentMode.label} Mode
            </div>
            <div className="flex flex-wrap gap-1">
              {currentMode.rules.map((r, i) => (
                <span
                  key={i}
                  className="text-[10px] text-neutral-dark bg-white/80 rounded px-1.5 py-0.5"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-border p-3">
            <div className="space-y-1.5">
              <button
                onClick={() => router.push(`/ideas/new?sprintId=${sprint.id}`)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-ink hover:bg-gray-50 transition-colors text-left"
              >
                <svg className="w-3.5 h-3.5 text-blue-ribbon shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Full Idea
              </button>
              <button
                onClick={() => setShowCandidates(!showCandidates)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-ink hover:bg-gray-50 transition-colors text-left"
              >
                <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
                Browse Candidates ({candidates.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sprint Idea Card (Redesigned) ──────────────────────────────────

interface SprintIdeaCardProps {
  idea: Idea;
  creatorName: string;
  onAdvance: () => void;
  onRetreat: () => void;
  onRemove: () => void;
}

function SprintIdeaCard({ idea, creatorName, onAdvance, onRetreat, onRemove }: SprintIdeaCardProps) {
  const [hovered, setHovered] = useState(false);
  const phase = SPRINT_PHASES.find((p) => p.key === idea.phase) || SPRINT_PHASES[0];
  const phaseIdx = SPRINT_PHASES.findIndex((p) => p.key === idea.phase);
  const total = getTotalScore(idea.score);
  const verdict = getScoreVerdict(total);
  const progress = getIdeaProgress(idea);
  const isDraft = idea.status === "draft" && !idea.problemStatement && !idea.proposedSolution;

  return (
    <div
      className="group bg-white rounded-lg border border-border hover:border-blue-ribbon/30 transition-all px-3 py-2.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Left: phase color indicator */}
        <div
          className="w-1 self-stretch rounded-full shrink-0 mt-0.5"
          style={{ backgroundColor: phase.color }}
        />

        {/* Center: content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Link
              href={`/ideas/${idea.id}`}
              className="text-sm font-medium text-ink hover:text-blue-ribbon transition-colors truncate"
            >
              {idea.title || "Untitled"}
            </Link>
            {isDraft && (
              <Link
                href={`/ideas/${idea.id}`}
                className="text-[10px] text-blue-ribbon hover:underline shrink-0"
              >
                Enrich &rarr;
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <span>{creatorName}</span>
            {idea.frameworkUsed !== "none" && (
              <>
                <span className="text-border">&middot;</span>
                <span>{idea.frameworkUsed.toUpperCase()}</span>
              </>
            )}
            {idea.problemStatement && !isDraft && (
              <>
                <span className="text-border">&middot;</span>
                <span className="truncate">{idea.problemStatement.slice(0, 60)}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: scores + pipeline */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pipeline progress dots */}
          {progress.completed > 0 && (
            <div className="flex gap-px" title={`${progress.completed}/${progress.total} stages`}>
              {Array.from({ length: progress.total }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-2.5 rounded-sm ${
                    i < progress.completed ? "bg-blue-ribbon" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Score badge */}
          {total > 0 && (
            <span
              className="text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: verdict.color + "15", color: verdict.color }}
            >
              {total}/9
            </span>
          )}

          {/* Alice badge */}
          {idea.aliceScore && (
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                idea.aliceScore.abstractIdeaRisk === "low"
                  ? "bg-green-50 text-green-700"
                  : idea.aliceScore.abstractIdeaRisk === "medium"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {idea.aliceScore.overallScore}
            </span>
          )}

          {/* Phase advance/retreat — show on hover */}
          <div className={`flex gap-0.5 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}>
            {phaseIdx > 0 && (
              <button
                onClick={onRetreat}
                className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:bg-gray-100 hover:text-ink transition-colors"
                title={`Move to ${SPRINT_PHASES[phaseIdx - 1].label}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            {phaseIdx < SPRINT_PHASES.length - 1 && (
              <button
                onClick={onAdvance}
                className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:bg-gray-100 hover:text-ink transition-colors"
                title={`Move to ${SPRINT_PHASES[phaseIdx + 1].label}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
            <button
              onClick={onRemove}
              className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Remove from sprint"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Candidate Idea Card ──────────────────────────────────────────

interface CandidateIdeaCardProps {
  idea: Idea;
  creatorName: string;
  onAdd: () => void;
}

function CandidateIdeaCard({ idea, creatorName, onAdd }: CandidateIdeaCardProps) {
  const total = getTotalScore(idea.score);
  const verdict = getScoreVerdict(total);

  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-gray-50 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/ideas/${idea.id}`}
            className="text-xs font-medium text-ink hover:text-blue-ribbon truncate"
          >
            {idea.title}
          </Link>
          {total > 0 && (
            <span
              className="text-[10px] font-mono px-1 py-0.5 rounded shrink-0"
              style={{ backgroundColor: verdict.color + "15", color: verdict.color }}
            >
              {total}/9
            </span>
          )}
        </div>
        <p className="text-[10px] text-text-muted truncate">{creatorName}</p>
      </div>
      <button
        onClick={onAdd}
        className="text-[11px] font-medium text-blue-ribbon hover:text-blue-ribbon/80 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        + Add
      </button>
    </div>
  );
}
