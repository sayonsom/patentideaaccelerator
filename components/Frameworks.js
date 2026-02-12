"use client";

import { Badge, Input, TextArea, SectionLabel } from "./ui";
import { TRIZ_PRINCIPLES, SIT_TEMPLATES, CK_PROMPTS, PATENT_MATRIX } from "../lib/constants";

// ═══════════════════════════════════════════════════════════════════
// TRIZ Panel
// ═══════════════════════════════════════════════════════════════════
export function TRIZPanel({ idea, onUpdate }) {
  return (
    <div style={{ background: "#0b1120", borderRadius: 10, padding: 16, border: "1px solid #1e293b", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ background: "#f59e0b20", color: "#f59e0b", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>TRIZ</span>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>Contradiction Resolution · 2M+ patent patterns</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }} className="grid-responsive-2">
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>IMPROVING PARAMETER</div>
          <Input value={idea.triz_improving || ""} onChange={(v) => onUpdate({ ...idea, triz_improving: v })} placeholder="e.g. Energy Efficiency, Speed, Accuracy" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>WORSENING PARAMETER</div>
          <Input value={idea.triz_worsening || ""} onChange={(v) => onUpdate({ ...idea, triz_worsening: v })} placeholder="e.g. User Comfort, Battery Life, Latency" />
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>APPLICABLE PRINCIPLES (click to toggle)</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {TRIZ_PRINCIPLES.map((p) => {
          const active = idea.triz_principles?.includes(p.id);
          return (
            <div
              key={p.id}
              onClick={() => {
                const current = idea.triz_principles || [];
                const next = active ? current.filter((x) => x !== p.id) : [...current, p.id];
                onUpdate({ ...idea, triz_principles: next });
              }}
              title={p.hint}
              style={{
                padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12,
                background: active ? "#f59e0b20" : "#1e293b",
                border: `1px solid ${active ? "#f59e0b" : "#334155"}`,
                color: active ? "#f59e0b" : "#94a3b8",
                fontWeight: active ? 700 : 400,
                transition: "all 0.15s",
              }}
            >
              #{p.id} {p.name}
            </div>
          );
        })}
      </div>

      {/* Show selected principle hints */}
      {idea.triz_principles?.length > 0 && (
        <div style={{ marginBottom: 10, padding: "8px 12px", background: "#020617", borderRadius: 8, border: "1px solid #1e293b" }}>
          {idea.triz_principles.map((id) => {
            const p = TRIZ_PRINCIPLES.find((x) => x.id === id);
            if (!p) return null;
            return (
              <div key={id} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4, lineHeight: 1.4 }}>
                <strong style={{ color: "#f59e0b" }}>#{p.id} {p.name}:</strong> {p.hint}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>RESOLUTION NOTES</div>
      <TextArea value={idea.triz_resolution || ""} onChange={(v) => onUpdate({ ...idea, triz_resolution: v })}
        placeholder="How do the selected principles resolve the contradiction? What technical mechanism bridges improving vs. worsening?" rows={3} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SIT Panel
// ═══════════════════════════════════════════════════════════════════
export function SITPanel({ idea, onUpdate }) {
  return (
    <div style={{ background: "#0b1120", borderRadius: 10, padding: 16, border: "1px solid #1e293b", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ background: "#3b82f620", color: "#3b82f6", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>SIT</span>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>5-Template Rapid Ideation · Closed World</span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {SIT_TEMPLATES.map((t) => {
          const val = idea.sit?.[t.id] || "";
          return (
            <div key={t.id} style={{ background: "#1e293b", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span>{t.icon}</span>
                <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{t.name}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontStyle: "italic" }}>{t.prompt}</div>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>Example: {t.example}</div>
              <TextArea value={val} onChange={(v) => onUpdate({ ...idea, sit: { ...idea.sit, [t.id]: v } })}
                placeholder={`Your ${t.name.toLowerCase()} idea…`} rows={2} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// C-K Theory Panel
// ═══════════════════════════════════════════════════════════════════
export function CKPanel({ idea, onUpdate }) {
  return (
    <div style={{ background: "#0b1120", borderRadius: 10, padding: 16, border: "1px solid #1e293b", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ background: "#ec489920", color: "#ec4899", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>C-K</span>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>Concept-Knowledge Expansion</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }} className="grid-responsive-2">
        <div>
          <div style={{ fontSize: 11, color: "#ec4899", fontWeight: 600, marginBottom: 4 }}>CONCEPT SPACE (C)</div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{CK_PROMPTS.concept}</div>
          <TextArea value={idea.ck_concepts || ""} onChange={(v) => onUpdate({ ...idea, ck_concepts: v })}
            placeholder="Ideas we cannot yet prove true or false…" rows={4} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, marginBottom: 4 }}>KNOWLEDGE SPACE (K)</div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{CK_PROMPTS.knowledge}</div>
          <TextArea value={idea.ck_knowledge || ""} onChange={(v) => onUpdate({ ...idea, ck_knowledge: v })}
            placeholder={"✅ Proven: …\n🟡 Emerging: …\n❌ Gap: …"} rows={4} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>PATENT OPPORTUNITY (C↔K boundary)</div>
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{CK_PROMPTS.expansion}</div>
      <TextArea value={idea.ck_opportunity || ""} onChange={(v) => onUpdate({ ...idea, ck_opportunity: v })}
        placeholder="Knowledge gaps that, if filled, create novel IP…" rows={2} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Patent 3×3 Readiness Matrix
// ═══════════════════════════════════════════════════════════════════
export function PatentMatrix({ scores, onChange }) {
  const total = (scores?.inventive_step || 0) + (scores?.defensibility || 0) + (scores?.product_fit || 0);
  const verdict = total >= 7 ? { label: "File immediately", color: "#10b981" } :
    total >= 5 ? { label: "Refine concept", color: "#f59e0b" } :
    { label: "Rethink approach", color: "#ef4444" };

  return (
    <div>
      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        {PATENT_MATRIX.map((dim) => (
          <div key={dim.key}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>{dim.icon} {dim.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }} className="grid-responsive-3">
              {dim.levels.map((lvl) => {
                const active = scores?.[dim.key] === lvl.score;
                return (
                  <div key={lvl.score}
                    onClick={() => onChange({ ...scores, [dim.key]: lvl.score })}
                    style={{
                      padding: "8px 10px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                      background: active ? (lvl.score === 3 ? "#064e3b" : lvl.score === 2 ? "#78350f" : "#7f1d1d") : "#1e293b",
                      border: `1px solid ${active ? (lvl.score === 3 ? "#10b981" : lvl.score === 2 ? "#f59e0b" : "#ef4444") : "#334155"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#fff" : "#94a3b8" }}>{lvl.label}</div>
                    <div style={{ fontSize: 10, color: active ? "#cbd5e1" : "#475569", marginTop: 2, lineHeight: 1.3 }}>{lvl.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#0b1120", borderRadius: 8, padding: "10px 16px", border: `1px solid ${verdict.color}30`,
        }}>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            Score: <strong style={{ color: "#f8fafc", fontFamily: "var(--font-mono)" }}>{total}/9</strong>
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: verdict.color }}>→ {verdict.label}</span>
        </div>
      )}
    </div>
  );
}
