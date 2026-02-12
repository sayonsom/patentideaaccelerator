"use client";

import { useEffect, useState } from "react";
import { Badge, Card, Btn, Input, TextArea, SectionLabel } from "./ui";
import { TRIZPanel, SITPanel, CKPanel, PatentMatrix } from "./Frameworks";
import { SPRINT_PHASES, SESSION_MODES, PATENT_MATRIX } from "../lib/constants";
import { getTeamCategoryBreakdown } from "../lib/teamFormation";
import {
  ensureTimer,
  formatDuration,
  getRemainingSeconds,
  getSpentSeconds,
  pauseTimer,
  resetTimer,
  startTimer,
} from "../lib/teamTimer";

const uid = () => Math.random().toString(36).slice(2, 10);

// ═══════════════════════════════════════════════════════════════════
// Idea Card
// ═══════════════════════════════════════════════════════════════════
function IdeaCard({ idea, onUpdate, onDelete, onAdvance, onRetreat }) {
  const [expanded, setExpanded] = useState(false);
  const [activeFramework, setActiveFramework] = useState(null);
  const phase = SPRINT_PHASES.find((p) => p.key === idea.phase) || SPRINT_PHASES[0];
  const matrixTotal = (idea.matrix?.inventive_step || 0) + (idea.matrix?.defensibility || 0) + (idea.matrix?.product_fit || 0);
  const phaseIdx = SPRINT_PHASES.findIndex((p) => p.key === idea.phase);

  return (
    <Card style={{ borderLeft: `3px solid ${phase.color}`, marginBottom: 10 }}>
      {/* Collapsed header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ color: phase.color, fontSize: 14 }}>{phase.icon}</span>
            <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: 15 }}>{idea.title}</span>
            <Badge color={phase.color} active>{phase.label}</Badge>
            {matrixTotal > 0 && (
              <span style={{
                background: matrixTotal >= 7 ? "#064e3b" : matrixTotal >= 5 ? "#78350f" : "#7f1d1d",
                color: matrixTotal >= 7 ? "#6ee7b7" : matrixTotal >= 5 ? "#fcd34d" : "#fca5a5",
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                fontFamily: "var(--font-mono)",
              }}>{matrixTotal}/9</span>
            )}
            {idea.redTeamNotes && <span title="Red Team reviewed">💀</span>}
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {idea.summary?.slice(0, expanded ? undefined : 120)}
            {!expanded && idea.summary?.length > 120 ? "…" : ""}
          </p>
        </div>
        <Btn variant="ghost" onClick={() => setExpanded(!expanded)} style={{ fontSize: 16, padding: "2px 8px" }}>
          {expanded ? "▾" : "▸"}
        </Btn>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 16, borderTop: "1px solid #1e293b", paddingTop: 16 }} className="slide-up">
          {/* Core fields */}
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            <div>
              <SectionLabel>Title</SectionLabel>
              <Input value={idea.title} onChange={(v) => onUpdate({ ...idea, title: v })} />
            </div>
            <div>
              <SectionLabel>One-line Summary</SectionLabel>
              <TextArea value={idea.summary || ""} onChange={(v) => onUpdate({ ...idea, summary: v })} placeholder="The elevator pitch…" rows={2} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="grid-responsive-2">
              <div>
                <SectionLabel>Problem Statement</SectionLabel>
                <TextArea value={idea.problem || ""} onChange={(v) => onUpdate({ ...idea, problem: v })} placeholder="What contradiction or gap does this solve?" rows={2} />
              </div>
              <div>
                <SectionLabel>Target User / Market</SectionLabel>
                <TextArea value={idea.target || ""} onChange={(v) => onUpdate({ ...idea, target: v })} placeholder="Who benefits?" rows={2} />
              </div>
            </div>
            <div>
              <SectionLabel>Key Differentiator</SectionLabel>
              <TextArea value={idea.differentiator || ""} onChange={(v) => onUpdate({ ...idea, differentiator: v })} placeholder="What's novel? What prior art exists and how is this different?" rows={2} />
            </div>
          </div>

          {/* Framework panels */}
          <SectionLabel>Innovation Framework Worksheets</SectionLabel>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[
              { key: "triz", label: "TRIZ", color: "#f59e0b" },
              { key: "sit", label: "SIT", color: "#3b82f6" },
              { key: "ck", label: "C-K Theory", color: "#ec4899" },
            ].map((fw) => (
              <Btn key={fw.key}
                variant={activeFramework === fw.key ? "primary" : "secondary"}
                onClick={() => setActiveFramework(activeFramework === fw.key ? null : fw.key)}
                style={activeFramework === fw.key ? { background: fw.color } : {}}
              >{fw.label}</Btn>
            ))}
          </div>
          {activeFramework === "triz" && <TRIZPanel idea={idea} onUpdate={onUpdate} />}
          {activeFramework === "sit" && <SITPanel idea={idea} onUpdate={onUpdate} />}
          {activeFramework === "ck" && <CKPanel idea={idea} onUpdate={onUpdate} />}

          {/* Patent Claim */}
          <SectionLabel>Patent Claim Draft</SectionLabel>
          <div style={{ background: "#0b1120", borderRadius: 10, padding: 14, border: "1px solid #1e293b", marginBottom: 10, fontSize: 11, color: "#475569", fontStyle: "italic", lineHeight: 1.5 }}>
            Template: A [method/system/device] for [FUNCTION] comprising: [first element addressing contradiction]; [second element enabling solution]; wherein [contradiction is resolved by…]; characterized by [novel aspect not in prior art].
          </div>
          <TextArea value={idea.patentClaim || ""} onChange={(v) => onUpdate({ ...idea, patentClaim: v })} placeholder="Draft your patent claim here using the template above…" rows={4} />

          {/* 3×3 Matrix */}
          <div style={{ marginTop: 14 }}>
            <SectionLabel>3×3 Patent Readiness Matrix</SectionLabel>
            <PatentMatrix scores={idea.matrix} onChange={(m) => onUpdate({ ...idea, matrix: m })} />
          </div>

          {/* Red Team */}
          <div style={{ marginTop: 14 }}>
            <SectionLabel>💀 Red Team / Destroy Notes</SectionLabel>
            <TextArea value={idea.redTeamNotes || ""} onChange={(v) => onUpdate({ ...idea, redTeamNotes: v })}
              placeholder={'"This will fail because…" — capture all attacks and weaknesses here'} rows={3} />
          </div>

          {/* Notes */}
          <div style={{ marginTop: 14 }}>
            <SectionLabel>Free-form Notes & Prior Art</SectionLabel>
            <TextArea value={idea.notes || ""} onChange={(v) => onUpdate({ ...idea, notes: v })}
              placeholder="Links, references, market data, prior art search results…" rows={3} />
          </div>

          {/* Phase navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid #1e293b" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {phaseIdx > 0 && <Btn variant="secondary" onClick={() => onRetreat(idea.id)}>← {SPRINT_PHASES[phaseIdx - 1].label}</Btn>}
              {phaseIdx < SPRINT_PHASES.length - 1 && <Btn variant="green" onClick={() => onAdvance(idea.id)}>Advance → {SPRINT_PHASES[phaseIdx + 1].label}</Btn>}
            </div>
            <Btn variant="danger" onClick={() => onDelete(idea.id)} style={{ fontSize: 12, padding: "6px 14px" }}>Delete</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Team Workspace
// ═══════════════════════════════════════════════════════════════════
function TeamWorkspace({ team, onUpdateTeam, onBack }) {
  const [newTitle, setNewTitle] = useState("");
  const [activePhase, setActivePhase] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [now, setNow] = useState(Date.now());
  const [activeMemberId, setActiveMemberId] = useState(
    team.dataMinister || team.members?.[0]?.id || null
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const timer = ensureTimer(team.timer);
  const remainingSeconds = getRemainingSeconds(timer, now);
  const spentSeconds = getSpentSeconds(timer, now);
  const isRunning = !!timer.runningSinceMs && remainingSeconds > 0;
  const currentStage = SPRINT_PHASES.find((p) => p.key === team.sprintPhase) || SPRINT_PHASES[0];
  const startedStage = timer.startedStage
    ? SPRINT_PHASES.find((p) => p.key === timer.startedStage) || null
    : null;

  useEffect(() => {
    if (!timer.runningSinceMs) return;
    if (remainingSeconds > 0) return;
    onUpdateTeam({
      ...team,
      timer: pauseTimer(timer, { nowMs: now }),
      lastActivityAt: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, now]);

  const addIdea = () => {
    if (!newTitle.trim()) return;
    const nowMs = Date.now();
    onUpdateTeam({
      ...team,
      lastActivityAt: nowMs,
      ideas: [...team.ideas, {
        id: uid(), title: newTitle.trim(), phase: "foundation",
        summary: "", problem: "", target: "", differentiator: "", notes: "",
        patentClaim: "", redTeamNotes: "",
        matrix: {}, triz_principles: [], sit: {},
        ck_concepts: "", ck_knowledge: "", ck_opportunity: "",
        createdAt: nowMs,
        createdBy: activeMemberId,
        updatedAt: nowMs,
        updatedBy: activeMemberId,
      }],
    });
    setNewTitle("");
  };

  const updateIdea = (updated) => {
    const nowMs = Date.now();
    onUpdateTeam({
      ...team,
      lastActivityAt: nowMs,
      ideas: team.ideas.map((i) => {
        if (i.id !== updated.id) return i;
        return {
          ...i,
          ...updated,
          updatedAt: nowMs,
          updatedBy: activeMemberId ?? i.updatedBy ?? null,
          createdAt: i.createdAt ?? updated.createdAt ?? nowMs,
          createdBy: i.createdBy ?? updated.createdBy ?? activeMemberId ?? null,
        };
      }),
    });
  };
  const deleteIdea = (id) => {
    const nowMs = Date.now();
    onUpdateTeam({
      ...team,
      lastActivityAt: nowMs,
      ideas: team.ideas.filter((i) => i.id !== id),
    });
  };
  const advanceIdea = (id) => {
    const nowMs = Date.now();
    onUpdateTeam({
      ...team,
      lastActivityAt: nowMs,
      ideas: team.ideas.map((i) => {
        if (i.id !== id) return i;
        const idx = SPRINT_PHASES.findIndex((p) => p.key === i.phase);
        if (idx >= SPRINT_PHASES.length - 1) return i;
        return {
          ...i,
          phase: SPRINT_PHASES[idx + 1].key,
          updatedAt: nowMs,
          updatedBy: activeMemberId ?? i.updatedBy ?? null,
        };
      }),
    });
  };
  const retreatIdea = (id) => {
    const nowMs = Date.now();
    onUpdateTeam({
      ...team,
      lastActivityAt: nowMs,
      ideas: team.ideas.map((i) => {
        if (i.id !== id) return i;
        const idx = SPRINT_PHASES.findIndex((p) => p.key === i.phase);
        if (idx <= 0) return i;
        return {
          ...i,
          phase: SPRINT_PHASES[idx - 1].key,
          updatedAt: nowMs,
          updatedBy: activeMemberId ?? i.updatedBy ?? null,
        };
      }),
    });
  };

  const setSessionMode = (mode) =>
    onUpdateTeam({ ...team, sessionMode: mode, lastActivityAt: Date.now() });
  const currentMode = SESSION_MODES.find((m) => m.key === team.sessionMode) || SESSION_MODES[0];
  const dm = team.members.find((m) => m.id === team.dataMinister);

  const filtered = activePhase === "all" ? team.ideas : team.ideas.filter((i) => i.phase === activePhase);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") {
      const sa = (a.matrix?.inventive_step || 0) + (a.matrix?.defensibility || 0) + (a.matrix?.product_fit || 0);
      const sb = (b.matrix?.inventive_step || 0) + (b.matrix?.defensibility || 0) + (b.matrix?.product_fit || 0);
      return sb - sa;
    }
    return b.createdAt - a.createdAt;
  });

  const phaseCounts = SPRINT_PHASES.map((p) => ({ ...p, count: team.ideas.filter((i) => i.phase === p.key).length }));
  const breakdown = getTeamCategoryBreakdown(team);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <Btn variant="ghost" onClick={onBack} style={{ fontSize: 18, padding: "4px 10px" }}>←</Btn>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "#f59e0b", fontSize: 20 }}>△</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: 0, fontFamily: "var(--font-display)" }}>{team.name}</h2>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "#10b98115", padding: "2px 8px", borderRadius: 6, fontFamily: "var(--font-mono)" }}>
              {breakdown.count}/{breakdown.total} categories
            </span>
          </div>
          <p style={{ color: "#64748b", fontSize: 13, margin: "2px 0 0" }}>
            {team.members.map((m) => m.name).join(", ")}
            {dm && <span> · 📊 DM: {dm.name}</span>}
            {" · "}{team.ideas.length} concept{team.ideas.length !== 1 ? "s" : ""}
          </p>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Contributor
            </div>
            <select
              value={activeMemberId || ""}
              onChange={(e) => setActiveMemberId(e.target.value || null)}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#e2e8f0",
                fontSize: 13,
                outline: "none",
              }}
            >
              <option value="">Unassigned</option>
              {team.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: "#475569" }}>
              Attribution for new ideas/edits
            </span>
          </div>
        </div>
      </div>

      {/* Stage + timer */}
      <div style={{ background: "#0b1120", borderRadius: 10, padding: 14, border: "1px solid #1e293b", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <SectionLabel>Team Stage · 72h Timer</SectionLabel>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {SPRINT_PHASES.map((p) => (
              <div key={p.key} onClick={() => onUpdateTeam({ ...team, sprintPhase: p.key, lastActivityAt: Date.now() })} style={{
                padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: team.sprintPhase === p.key ? p.color + "20" : "#1e293b",
                border: `1px solid ${team.sprintPhase === p.key ? p.color : "#334155"}`,
                color: team.sprintPhase === p.key ? p.color : "#64748b",
                transition: "all 0.15s",
              }}>{p.icon} {p.label}</div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }} className="grid-responsive-3">
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 14px", textAlign: "center", borderTop: `3px solid ${remainingSeconds > 0 ? "#10b981" : "#ef4444"}` }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>{formatDuration(remainingSeconds)}</div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>REMAINING</div>
          </div>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 14px", textAlign: "center", borderTop: "3px solid #3b82f6" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>{formatDuration(spentSeconds)}</div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>SPENT</div>
          </div>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 14px", textAlign: "center", borderTop: `3px solid ${isRunning ? "#f59e0b" : remainingSeconds === 0 && timer.startedAtMs ? "#ef4444" : "#475569"}` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: isRunning ? "#f59e0b" : remainingSeconds === 0 && timer.startedAtMs ? "#ef4444" : "#94a3b8" }}>
              {isRunning ? "RUNNING" : remainingSeconds === 0 && timer.startedAtMs ? "EXPIRED" : timer.startedAtMs ? "PAUSED" : "NOT STARTED"}
            </div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 4 }}>
              Stage: <span style={{ color: currentStage.color, fontWeight: 800 }}>{currentStage.label}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {timer.startedAtMs ? (
              <>
                Started {startedStage ? `(${startedStage.label}) ` : ""}on{" "}
                <span style={{ color: "#94a3b8", fontWeight: 700 }}>{new Date(timer.startedAtMs).toLocaleString()}</span>
              </>
            ) : (
              <>Click <strong style={{ color: "#f59e0b" }}>Start</strong> when your team begins the{" "}
              <span style={{ color: currentStage.color, fontWeight: 800 }}>{currentStage.label}</span> stage.</>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {!isRunning ? (
              <Btn
                variant="green"
                disabled={remainingSeconds === 0}
                onClick={() =>
                  onUpdateTeam({
                    ...team,
                    timer: startTimer(timer, { stage: team.sprintPhase }),
                    lastActivityAt: Date.now(),
                  })
                }
              >
                ▶ Start
              </Btn>
            ) : (
              <Btn
                variant="secondary"
                onClick={() =>
                  onUpdateTeam({
                    ...team,
                    timer: pauseTimer(timer),
                    lastActivityAt: Date.now(),
                  })
                }
              >
                ❚❚ Pause
              </Btn>
            )}
            {timer.startedAtMs && (
              <Btn
                variant="ghost"
                onClick={() => {
                  if (!confirm("Reset this team's timer back to 72 hours?")) return;
                  onUpdateTeam({
                    ...team,
                    timer: resetTimer(timer),
                    lastActivityAt: Date.now(),
                  });
                }}
                style={{ fontSize: 12 }}
              >
                Reset
              </Btn>
            )}
          </div>
        </div>
      </div>

      {/* Session mode */}
      <div style={{ background: "#0b1120", borderRadius: 10, padding: 14, border: `1px solid ${currentMode.color}30`, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <SectionLabel>Session Mode</SectionLabel>
          <div style={{ display: "flex", gap: 4 }}>
            {SESSION_MODES.map((m) => (
              <div key={m.key} onClick={() => setSessionMode(m.key)} style={{
                padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: team.sessionMode === m.key ? m.color + "20" : "#1e293b",
                border: `1px solid ${team.sessionMode === m.key ? m.color : "#334155"}`,
                color: team.sessionMode === m.key ? m.color : "#64748b",
                transition: "all 0.15s",
              }}>{m.icon} {m.label}</div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: currentMode.color, fontWeight: 700, marginBottom: 4 }}>
          {currentMode.icon} {currentMode.label} Mode · Target: {currentMode.target}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {currentMode.rules.map((r, i) => (
            <span key={i} style={{ fontSize: 11, color: "#94a3b8", background: "#1e293b", borderRadius: 6, padding: "3px 8px" }}>{r}</span>
          ))}
        </div>
      </div>

      {/* Phase tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        <div onClick={() => setActivePhase("all")} style={{
          padding: "8px 16px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap",
          background: activePhase === "all" ? "#334155" : "#0f172a",
          border: `1px solid ${activePhase === "all" ? "#475569" : "#1e293b"}`,
          color: activePhase === "all" ? "#f8fafc" : "#64748b", fontSize: 13, fontWeight: 600,
        }}>All ({team.ideas.length})</div>
        {phaseCounts.map((p) => (
          <div key={p.key} onClick={() => setActivePhase(p.key)} style={{
            padding: "8px 16px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap",
            background: activePhase === p.key ? p.color + "20" : "#0f172a",
            border: `1px solid ${activePhase === p.key ? p.color + "60" : "#1e293b"}`,
            color: activePhase === p.key ? p.color : "#64748b", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>{p.icon}</span> {p.label}
            {p.count > 0 && <span style={{ background: p.color + "30", color: p.color, borderRadius: 10, padding: "0 7px", fontSize: 11, fontWeight: 700 }}>{p.count}</span>}
          </div>
        ))}
      </div>

      {/* Add idea */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Input value={newTitle} onChange={setNewTitle} placeholder="New concept title…" onKeyDown={(e) => e.key === "Enter" && addIdea()} style={{ flex: 1 }} />
        <Btn onClick={addIdea} disabled={!newTitle.trim()} variant="accent">◈ Add Concept</Btn>
      </div>

      {/* Sort */}
      {team.ideas.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#64748b", lineHeight: "28px" }}>Sort:</span>
          {[["created", "Newest"], ["score", "3×3 Score"]].map(([k, l]) => (
            <div key={k} onClick={() => setSortBy(k)} style={{
              padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: sortBy === k ? "#334155" : "transparent", color: sortBy === k ? "#e2e8f0" : "#64748b",
            }}>{l}</div>
          ))}
        </div>
      )}

      {/* Ideas list */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>◈</div>
          <p style={{ fontSize: 14, margin: 0 }}>
            {team.ideas.length === 0 ? "No concepts yet. Start your brainstorm above!" : "No concepts in this phase."}
          </p>
        </div>
      ) : (
        sorted.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} onUpdate={updateIdea} onDelete={deleteIdea} onAdvance={advanceIdea} onRetreat={retreatIdea} />
        ))
      )}

      {/* Sprint dashboard */}
      {team.ideas.length > 0 && (
        <Card style={{ marginTop: 20, background: "#0b1120" }}>
          <SectionLabel>Patent Sprint Dashboard</SectionLabel>
          <div style={{ display: "flex", gap: 2, height: 32, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
            {phaseCounts.filter((p) => p.count > 0).map((p) => (
              <div key={p.key} style={{
                flex: p.count, background: p.color + "40", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, fontWeight: 700, color: p.color,
              }}>{p.icon} {p.count}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }} className="grid-responsive-3">
            {SPRINT_PHASES.map((p) => {
              const count = team.ideas.filter((i) => i.phase === p.key).length;
              return (
                <div key={p.key} style={{ background: "#1e293b", borderRadius: 8, padding: "12px 14px", textAlign: "center", borderTop: `3px solid ${p.color}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>{count}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>Target: {p.target}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }} className="grid-responsive-3">
            {PATENT_MATRIX.map((dim) => {
              const scored = team.ideas.filter((i) => i.matrix?.[dim.key] > 0);
              const avg = scored.length ? (scored.reduce((a, i) => a + i.matrix[dim.key], 0) / scored.length).toFixed(1) : "—";
              return (
                <div key={dim.key} style={{ background: "#1e293b", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>{avg}<span style={{ fontSize: 11, color: "#475569" }}>/3</span></div>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{dim.icon} Avg {dim.label}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Workspace Hub (team selector → team workspace)
// ═══════════════════════════════════════════════════════════════════
export default function Workspace({ teams, setTeams, onBack }) {
  const [activeTeamId, setActiveTeamId] = useState(null);
  const activeTeam = teams.find((t) => t.id === activeTeamId);

  if (activeTeam) {
    return (
      <TeamWorkspace
        team={activeTeam}
        onUpdateTeam={(updated) => setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
        onBack={() => setActiveTeamId(null)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }} className="fade-in">
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#10b981", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>Phase 3 · Accelerator</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: 0, fontFamily: "var(--font-display)" }}>Innovation Workspace</h2>
        <p style={{ color: "#64748b", marginTop: 8, fontSize: 14 }}>Select a triangle to open their patent ideation pipeline.</p>
      </div>

      {/* Process overview */}
      <div style={{ background: "#0b1120", border: "1px solid #1e293b", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700, marginBottom: 8 }}>📋 THE PROCESS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 12 }} className="grid-responsive-3">
          {SESSION_MODES.map((m) => (
            <div key={m.key} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ color: m.color, fontWeight: 700 }}>{m.label}</div>
              <div style={{ color: "#64748b" }}>{m.target}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team list */}
      <div style={{ display: "grid", gap: 12 }}>
        {teams.map((t) => {
          const counts = SPRINT_PHASES.map((p) => ({ ...p, count: t.ideas.filter((i) => i.phase === p.key).length }));
          const dm = t.members.find((m) => m.id === t.dataMinister);
          const breakdown = getTeamCategoryBreakdown(t);
          return (
            <Card key={t.id} hover onClick={() => setActiveTeamId(t.id)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#f59e0b", fontSize: 18 }}>△</span>
                    <h3 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700, margin: 0 }}>{t.name}</h3>
                    <span style={{ fontSize: 10, color: "#10b981", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {breakdown.count}/{breakdown.total}
                    </span>
                  </div>
                  <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
                    {t.members.map((m) => m.name).join(", ")}
                    {dm && <span> · 📊 {dm.name}</span>}
                  </p>
                </div>
                <div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>{t.ideas.length}</div>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>CONCEPTS</div>
                </div>
              </div>
              {t.ideas.length > 0 && (
                <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 3, overflow: "hidden" }}>
                  {counts.filter((p) => p.count > 0).map((p) => (
                    <div key={p.key} style={{ flex: p.count, background: p.color + "60", borderRadius: 3 }} />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div style={{ marginTop: 30, textAlign: "center" }}>
        <Btn variant="secondary" onClick={onBack}>← Back to Teams</Btn>
      </div>
    </div>
  );
}
