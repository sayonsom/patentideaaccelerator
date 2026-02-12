"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Btn, Card, SectionLabel } from "./ui";
import { SPRINT_PHASES } from "../lib/constants";
import {
  ensureTimer,
  formatDuration,
  getRemainingSeconds,
  getSpentSeconds,
} from "../lib/teamTimer";

function uniqById(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item?.id) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function mailtoHref({ to, subject, body }) {
  const toPart = (to || []).filter(Boolean).join(",");
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${toPart}${qs ? `?${qs}` : ""}`;
}

function deriveStageKey(team) {
  if (team?.sprintPhase) return team.sprintPhase;
  const ideas = team?.ideas || [];
  if (ideas.some((i) => i.phase === "filing")) return "filing";
  if (ideas.some((i) => i.phase === "validation")) return "validation";
  return "foundation";
}

function computeLastActivityAt(team) {
  const candidates = [];
  if (Number.isFinite(team?.lastActivityAt)) candidates.push(team.lastActivityAt);
  if (Number.isFinite(team?.timer?.startedAtMs)) candidates.push(team.timer.startedAtMs);
  for (const idea of team?.ideas || []) {
    if (Number.isFinite(idea?.updatedAt)) candidates.push(idea.updatedAt);
    if (Number.isFinite(idea?.createdAt)) candidates.push(idea.createdAt);
  }
  return candidates.length ? Math.max(...candidates) : null;
}

function fmtDate(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "—";
  }
}

export default function AdminDashboard({ members, teams, onBack }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const allMembers = useMemo(() => {
    const fromMembers = members?.length ? members : [];
    const fromTeams = uniqById((teams || []).flatMap((t) => t.members || []));
    return uniqById([...fromMembers, ...fromTeams]);
  }, [members, teams]);

  const allIdeas = useMemo(
    () => (teams || []).flatMap((t) => t.ideas || []),
    [teams]
  );

  const summary = useMemo(() => {
    const totalIdeas = allIdeas.length;
    const byPhase = SPRINT_PHASES.reduce((acc, p) => {
      acc[p.key] = allIdeas.filter((i) => i.phase === p.key).length;
      return acc;
    }, {});

    const createdBy = {};
    const updatedBy = {};
    for (const idea of allIdeas) {
      if (idea?.createdBy) createdBy[idea.createdBy] = (createdBy[idea.createdBy] || 0) + 1;
      if (idea?.updatedBy) updatedBy[idea.updatedBy] = (updatedBy[idea.updatedBy] || 0) + 1;
    }

    return {
      totalMembers: allMembers.length,
      totalTeams: (teams || []).length,
      totalIdeas,
      ideasByPhase: byPhase,
      createdBy,
      updatedBy,
    };
  }, [allIdeas, allMembers.length, teams]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }} className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#f59e0b", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
            Admin View
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: 0, fontFamily: "var(--font-display)" }}>
            Progress Dashboard
          </h2>
          <p style={{ color: "#64748b", marginTop: 8, fontSize: 14 }}>
            Track output, stage, contributions, and remind teams via email.
          </p>
        </div>
        <Btn variant="secondary" onClick={onBack}>
          ← Back
        </Btn>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }} className="grid-responsive-3">
        {[
          { label: "Members", value: summary.totalMembers, color: "#8b5cf6" },
          { label: "Teams", value: summary.totalTeams, color: "#3b82f6" },
          { label: "Total Ideas", value: summary.totalIdeas, color: "#10b981" },
        ].map((c) => (
          <Card key={c.label} style={{ background: "#0b1120", borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>
              {c.value}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>
              {c.label}
            </div>
          </Card>
        ))}
      </div>

      {/* Pipeline */}
      <Card style={{ background: "#0b1120", marginBottom: 18 }}>
        <SectionLabel>Idea Pipeline (All Teams)</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="grid-responsive-3">
          {SPRINT_PHASES.map((p) => (
            <div key={p.key} style={{ background: "#1e293b", borderRadius: 8, padding: "12px 14px", textAlign: "center", borderTop: `3px solid ${p.color}` }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>
                {summary.ideasByPhase[p.key] || 0}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>
                {p.icon} {p.label}
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                Target: {p.target}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Teams */}
      <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
        {(teams || []).map((t) => {
          const stageKey = deriveStageKey(t);
          const stage = SPRINT_PHASES.find((p) => p.key === stageKey) || SPRINT_PHASES[0];
          const timer = ensureTimer(t.timer);
          const remaining = getRemainingSeconds(timer, now);
          const spent = getSpentSeconds(timer, now);
          const isRunning = !!timer.runningSinceMs && remaining > 0;
          const lastActivityAt = computeLastActivityAt(t);

          const ideas = t.ideas || [];
          const phaseCounts = SPRINT_PHASES.map((p) => ({
            ...p,
            count: ideas.filter((i) => i.phase === p.key).length,
          }));

          const memberStats = (t.members || []).map((m) => {
            const created = ideas.filter((i) => i.createdBy === m.id).length;
            const updated = ideas.filter((i) => i.updatedBy === m.id).length;
            return { member: m, created, updated };
          });

          const teamEmails = (t.members || [])
            .map((m) => m.email?.trim())
            .filter(Boolean);

          const dm = t.members?.find((m) => m.id === t.dataMinister) || null;
          const dmEmail = dm?.email?.trim() || "";

          const subject = `SIMS reminder: ${t.name} — ${stage.label}`;
          const body = [
            `Hi ${t.name},`,
            "",
            "Quick reminder to continue your SIMS ideation session.",
            `Stage: ${stage.label}`,
            `Ideas so far: ${ideas.length}`,
            `Time remaining (72h budget): ${formatDuration(remaining)}`,
            "",
            "Please add new concepts, refine top ideas, and advance them through the pipeline.",
            "",
            "— Admin",
          ].join("\n");

          const emailTeamHref = mailtoHref({ to: teamEmails, subject, body });
          const emailDmHref = mailtoHref({ to: dmEmail ? [dmEmail] : [], subject, body });

          return (
            <Card key={t.id} style={{ background: "#0f172a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ color: "#f59e0b", fontSize: 18 }}>△</span>
                    <h3 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 800, margin: 0 }}>
                      {t.name}
                    </h3>
                    <Badge color={stage.color} active>
                      {stage.label}
                    </Badge>
                    {timer.startedAtMs && (
                      <span style={{
                        fontSize: 10,
                        color: isRunning ? "#f59e0b" : remaining === 0 ? "#ef4444" : "#94a3b8",
                        background: isRunning ? "#f59e0b20" : remaining === 0 ? "#ef444420" : "#334155",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                      }}>
                        {isRunning ? "RUNNING" : remaining === 0 ? "EXPIRED" : "PAUSED"}
                      </span>
                    )}
                  </div>

                  <div style={{ color: "#64748b", fontSize: 13, marginBottom: 10 }}>
                    {(t.members || []).map((m) => m.name).join(", ")}
                    {dm && <span> · 📊 DM: {dm.name}</span>}
                  </div>

                  {/* Team pipeline bar */}
                  {ideas.length > 0 && (
                    <div style={{ display: "flex", gap: 2, height: 8, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                      {phaseCounts.filter((p) => p.count > 0).map((p) => (
                        <div key={p.key} style={{ flex: p.count, background: p.color + "70" }} />
                      ))}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }} className="grid-responsive-3">
                    <div style={{ background: "#0b1120", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>
                        {ideas.length}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
                        Ideas
                      </div>
                    </div>
                    <div style={{ background: "#0b1120", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#f8fafc", fontFamily: "var(--font-mono)" }}>
                        {formatDuration(remaining)}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
                        Time Remaining
                      </div>
                    </div>
                    <div style={{ background: "#0b1120", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8" }}>
                        {fmtDate(lastActivityAt)}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 2 }}>
                        Last Activity
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ minWidth: 260, display: "grid", gap: 10 }}>
                  <div>
                    <SectionLabel>Contributions</SectionLabel>
                    <div style={{ display: "grid", gap: 6 }}>
                      {memberStats.map(({ member, created, updated }) => (
                        <div key={member.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#0b1120", border: "1px solid #1e293b", borderRadius: 10, padding: "8px 10px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>
                              {member.name}
                            </span>
                            <span style={{ color: "#64748b", fontSize: 11 }}>
                              {member.email || "—"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                              +{created}
                            </span>
                            <span style={{ fontSize: 11, color: "#475569" }}>·</span>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                              ✎{updated}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Reminders</SectionLabel>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Btn
                        variant="accent"
                        disabled={teamEmails.length === 0}
                        onClick={() => {
                          window.location.href = emailTeamHref;
                        }}
                      >
                        ✉️ Email Team
                      </Btn>
                      <Btn
                        variant="secondary"
                        disabled={!dmEmail}
                        onClick={() => {
                          window.location.href = emailDmHref;
                        }}
                      >
                        📩 Email DM
                      </Btn>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#475569" }}>
                      Opens your default email client (mailto:).
                    </div>
                    {teamEmails.length === 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
                        Missing email addresses for this team.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* People */}
      <Card style={{ background: "#0b1120" }}>
        <SectionLabel>People (All Teams)</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="grid-responsive-2">
          {allMembers.map((m) => {
            const created = summary.createdBy[m.id] || 0;
            const updated = summary.updatedBy[m.id] || 0;
            return (
              <div key={m.id} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 12px", border: "1px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: "#f8fafc", fontWeight: 800 }}>{m.name}</span>
                    <span style={{ color: "#64748b", fontSize: 12 }}>{m.email || "—"}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
                    +{created} · ✎{updated}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
