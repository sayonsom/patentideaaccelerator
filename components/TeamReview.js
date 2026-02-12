"use client";

import { useState, useMemo } from "react";
import { Badge, Card, Btn, SectionLabel } from "./ui";
import { INTEREST_CATEGORIES } from "../lib/constants";
import { autoFormTeams, getTeamCategoryBreakdown } from "../lib/teamFormation";

export default function TeamReview({ members, teams, setTeams, onNext, onBack }) {
  const [swapSource, setSwapSource] = useState(null); // { teamIdx, memberIdx }

  const stats = useMemo(() => {
    if (teams.length === 0) return null;
    const scores = teams.map((t) => getTeamCategoryBreakdown(t));
    const total = scores.reduce((a, s) => a + s.count, 0);
    const max = teams.length * Object.keys(INTEREST_CATEGORIES).length;
    return {
      teamBreakdowns: scores,
      totalDiversity: total,
      maxPossible: max,
      avgDiversity: (total / teams.length).toFixed(1),
      coveragePercent: Math.round((total / max) * 100),
    };
  }, [teams]);

  const regenerate = () => {
    const result = autoFormTeams(members, 3);
    setTeams(result.teams);
    setSwapSource(null);
  };

  const handleMemberClick = (teamIdx, memberIdx) => {
    if (!swapSource) {
      setSwapSource({ teamIdx, memberIdx });
      return;
    }

    if (swapSource.teamIdx === teamIdx && swapSource.memberIdx === memberIdx) {
      setSwapSource(null);
      return;
    }

    // Perform swap
    const newTeams = teams.map((t) => ({
      ...t,
      members: [...t.members],
    }));

    const temp = newTeams[swapSource.teamIdx].members[swapSource.memberIdx];
    newTeams[swapSource.teamIdx].members[swapSource.memberIdx] =
      newTeams[teamIdx].members[memberIdx];
    newTeams[teamIdx].members[memberIdx] = temp;

    setTeams(newTeams);
    setSwapSource(null);
  };

  const setDataMinister = (teamId, memberId) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, dataMinister: memberId } : t
      )
    );
  };

  const renameTeam = (teamId, name) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, name } : t))
    );
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }} className="fade-in">
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 4,
            color: "#3b82f6",
            fontWeight: 700,
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Phase 2 · Auto-Formed Triangles
        </div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#f8fafc",
            margin: 0,
            fontFamily: "var(--font-display)",
          }}
        >
          Review Your Innovation Triangles
        </h2>
        <p style={{ color: "#64748b", marginTop: 8, fontSize: 14 }}>
          Teams were formed to maximize interest diversity. Click any two
          members to swap them between teams.
        </p>
      </div>

      {/* Global diversity stats */}
      {stats && (
        <div
          style={{
            background: "#0b1120",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: 18,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <SectionLabel>Diversity Score</SectionLabel>
            <Btn variant="secondary" onClick={regenerate} style={{ fontSize: 12 }}>
              ↻ Regenerate Teams
            </Btn>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              marginBottom: 14,
            }}
            className="grid-responsive-3"
          >
            <div
              style={{
                background: "#1e293b",
                borderRadius: 8,
                padding: "14px 16px",
                textAlign: "center",
                borderTop: "3px solid #f59e0b",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#f8fafc",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {stats.coveragePercent}%
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                Overall Coverage
              </div>
            </div>
            <div
              style={{
                background: "#1e293b",
                borderRadius: 8,
                padding: "14px 16px",
                textAlign: "center",
                borderTop: "3px solid #3b82f6",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#f8fafc",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {stats.avgDiversity}
                <span style={{ fontSize: 14, color: "#475569" }}>
                  /{Object.keys(INTEREST_CATEGORIES).length}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                Avg Categories/Team
              </div>
            </div>
            <div
              style={{
                background: "#1e293b",
                borderRadius: 8,
                padding: "14px 16px",
                textAlign: "center",
                borderTop: "3px solid #10b981",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#f8fafc",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {teams.length}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                Triangles Formed
              </div>
            </div>
          </div>

          {swapSource && (
            <div
              style={{
                background: "#f59e0b15",
                border: "1px solid #f59e0b40",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                color: "#f59e0b",
                fontWeight: 600,
              }}
            >
              ⚡ Swap mode: Click another member to swap with{" "}
              <strong>
                {teams[swapSource.teamIdx]?.members[swapSource.memberIdx]?.name}
              </strong>{" "}
              ·{" "}
              <span
                onClick={() => setSwapSource(null)}
                style={{ cursor: "pointer", textDecoration: "underline" }}
              >
                Cancel
              </span>
            </div>
          )}
        </div>
      )}

      {/* Team cards */}
      <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
        {teams.map((team, teamIdx) => {
          const breakdown = stats?.teamBreakdowns[teamIdx];
          return (
            <Card key={team.id} style={{ padding: "18px 22px" }}>
              {/* Team header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#f59e0b", fontSize: 20 }}>△</span>
                  <input
                    value={team.name}
                    onChange={(e) => renameTeam(team.id, e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid transparent",
                      color: "#f8fafc",
                      fontSize: 18,
                      fontWeight: 700,
                      outline: "none",
                      padding: "2px 0",
                      width: 200,
                      fontFamily: "var(--font-body)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderBottomColor = "#f59e0b")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderBottomColor = "transparent")
                    }
                  />
                  {breakdown && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          breakdown.count >= 6
                            ? "#10b981"
                            : breakdown.count >= 4
                            ? "#f59e0b"
                            : "#ef4444",
                        background:
                          breakdown.count >= 6
                            ? "#10b98115"
                            : breakdown.count >= 4
                            ? "#f59e0b15"
                            : "#ef444415",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {breakdown.count}/{breakdown.total} categories
                    </span>
                  )}
                </div>
              </div>

              {/* Members */}
              <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                {team.members.map((m, memberIdx) => {
                  const isSwapSource =
                    swapSource?.teamIdx === teamIdx &&
                    swapSource?.memberIdx === memberIdx;
                  const isSwapTarget =
                    swapSource && !isSwapSource;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleMemberClick(teamIdx, memberIdx)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        cursor: "pointer",
                        background: isSwapSource
                          ? "#f59e0b15"
                          : isSwapTarget
                          ? "#1e293b"
                          : "#0b1120",
                        border: `1px solid ${
                          isSwapSource
                            ? "#f59e0b"
                            : isSwapTarget
                            ? "#334155"
                            : "#1e293b"
                        }`,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "all 0.15s",
                      }}
                    >
                      {/* DM selector */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setDataMinister(
                            team.id,
                            team.dataMinister === m.id ? null : m.id
                          );
                        }}
                        title={
                          team.dataMinister === m.id
                            ? "Data Minister (click to remove)"
                            : "Set as Data Minister"
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background:
                            team.dataMinister === m.id
                              ? "#f59e0b20"
                              : "#1e293b",
                          border: `1px solid ${
                            team.dataMinister === m.id
                              ? "#f59e0b"
                              : "#334155"
                          }`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        {team.dataMinister === m.id ? "📊" : "·"}
                      </div>

                      <span
                        style={{
                          color: "#e2e8f0",
                          fontWeight: 600,
                          fontSize: 14,
                          minWidth: 100,
                        }}
                      >
                        {m.name}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          marginLeft: "auto",
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        {m.interests.slice(0, 5).map((tag) => {
                          const cats = Object.entries(INTEREST_CATEGORIES);
                          const cat = cats.find(([, { tags }]) =>
                            tags.includes(tag)
                          );
                          return (
                            <Badge
                              key={tag}
                              color={cat ? cat[1].color : "#64748b"}
                            >
                              {tag}
                            </Badge>
                          );
                        })}
                        {m.interests.length > 5 && (
                          <Badge color="#475569">
                            +{m.interests.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Category coverage bar */}
              {breakdown && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 3,
                      flexWrap: "wrap",
                      marginBottom: 6,
                    }}
                  >
                    {breakdown.details.map((d) => (
                      <Badge key={d.category} color={d.color} active>
                        {d.category}
                      </Badge>
                    ))}
                    {breakdown.missing.map((cat) => (
                      <Badge
                        key={cat}
                        color="#334155"
                        style={{ opacity: 0.4 }}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Triangle tip */}
      <div
        style={{
          background: "#0b1120",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 24,
          fontSize: 13,
          color: "#94a3b8",
          display: "flex",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>💡</span>
        <div>
          <strong style={{ color: "#f59e0b" }}>Tips:</strong> Click any member
          to enter swap mode, then click another to swap. Click 📊 to set a Data
          Minister. Click team names to rename. Hit "Regenerate" for a fresh
          arrangement.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="secondary" onClick={onBack}>
          ← Back
        </Btn>
        <Btn
          onClick={onNext}
          variant="accent"
          style={{ padding: "12px 40px", fontSize: 15 }}
        >
          Launch Accelerator →
        </Btn>
      </div>
    </div>
  );
}
