"use client";

import { useState } from "react";
import { Badge, Card, Btn, Input, SectionLabel } from "./ui";
import { INTEREST_CATEGORIES, ALL_INTERESTS } from "../lib/constants";

export default function MemberSetup({ members, setMembers, onNext }) {
  const [name, setName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [expandedCat, setExpandedCat] = useState(null);
  const [search, setSearch] = useState("");

  const addMember = () => {
    if (!name.trim() || selectedInterests.length === 0) return;
    const uid = Math.random().toString(36).slice(2, 10);
    setMembers((prev) => [
      ...prev,
      { id: uid, name: name.trim(), interests: [...selectedInterests] },
    ]);
    setName("");
    setSelectedInterests([]);
    setSearch("");
  };

  const toggleInterest = (tag) =>
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );

  const filtered = search.trim()
    ? ALL_INTERESTS.filter((i) =>
        i.tag.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_INTERESTS;

  const groupedFiltered = {};
  filtered.forEach((i) => {
    if (!groupedFiltered[i.category]) groupedFiltered[i.category] = [];
    groupedFiltered[i.category].push(i);
  });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }} className="fade-in">
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 4,
            color: "#f59e0b",
            fontWeight: 700,
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Phase 1 · Onboarding
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
          Register Your Innovators
        </h2>
        <p style={{ color: "#64748b", marginTop: 8, fontSize: 14 }}>
          Add everyone who'll participate. Tag their interests — we'll
          auto-form diverse triangles.
        </p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <Input
            value={name}
            onChange={setName}
            placeholder="Full name"
            onKeyDown={(e) => e.key === "Enter" && addMember()}
            style={{ flex: 1 }}
          />
          <Btn
            onClick={addMember}
            disabled={!name.trim() || selectedInterests.length === 0}
          >
            + Add
          </Btn>
        </div>

        {/* Selected preview */}
        {selectedInterests.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 14,
              padding: "10px 12px",
              background: "#020617",
              borderRadius: 8,
              border: "1px solid #1e293b",
            }}
          >
            {selectedInterests.map((tag) => {
              const info = ALL_INTERESTS.find((i) => i.tag === tag);
              return (
                <Badge
                  key={tag}
                  color={info?.color || "#64748b"}
                  onClick={() => toggleInterest(tag)}
                  removable
                  active
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        )}

        <Input
          value={search}
          onChange={setSearch}
          placeholder="Search interests… (e.g. federated, quantum, edge, encryption)"
          style={{ marginBottom: 14, fontSize: 13 }}
        />

        {/* Category groups */}
        <div style={{ display: "grid", gap: 6 }}>
          {Object.entries(groupedFiltered).map(([cat, interests]) => (
            <div key={cat}>
              <div
                onClick={() =>
                  setExpandedCat(expandedCat === cat ? null : cat)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#0b1120",
                  border: `1px solid ${INTEREST_CATEGORIES[cat]?.color}20`,
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: INTEREST_CATEGORIES[cat]?.color,
                  }}
                />
                <span
                  style={{
                    color: "#e2e8f0",
                    fontSize: 13,
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  {cat}
                </span>
                <span style={{ color: "#475569", fontSize: 11 }}>
                  {interests.length} tags
                </span>
                <span style={{ color: "#475569", fontSize: 14 }}>
                  {expandedCat === cat ? "▾" : "▸"}
                </span>
              </div>
              {(expandedCat === cat || search.trim()) && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    padding: "8px 12px 4px",
                  }}
                >
                  {interests.map(({ tag, color }) => (
                    <Badge
                      key={tag}
                      color={color}
                      onClick={() => toggleInterest(tag)}
                      active={selectedInterests.includes(tag)}
                    >
                      {selectedInterests.includes(tag) ? "✓ " : ""}
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Registered members */}
      {members.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>
            {members.length} Innovator{members.length !== 1 ? "s" : ""}{" "}
            Registered
          </SectionLabel>
          <div style={{ display: "grid", gap: 8 }}>
            {members.map((m) => (
              <Card
                key={m.id}
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      color: "#f8fafc",
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  >
                    {m.name}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      marginTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {m.interests.map((tag) => {
                      const info = ALL_INTERESTS.find((i) => i.tag === tag);
                      return (
                        <Badge key={tag} color={info?.color}>
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <Btn
                  variant="ghost"
                  onClick={() =>
                    setMembers((prev) => prev.filter((x) => x.id !== m.id))
                  }
                  style={{ fontSize: 18, padding: "4px 10px" }}
                >
                  ×
                </Btn>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <Btn
          onClick={onNext}
          disabled={members.length < 3}
          variant="accent"
          style={{ padding: "12px 40px", fontSize: 15 }}
        >
          Auto-Form Triangles →
        </Btn>
        {members.length < 3 && (
          <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
            Need at least 3 members to form a triangle
          </p>
        )}
      </div>
    </div>
  );
}
