"use client";

import { useState, useCallback } from "react";

interface ColorScheme {
  bg: string; panel: string; grid: string; axis: string;
  text1: string; text2: string;
  series: string[];
}

const LIGHT: ColorScheme = {
  bg: "#FFFFFF", panel: "#F5F7FA", grid: "#E5E7EB", axis: "#D1D5DB",
  text1: "#111827", text2: "#4B5563",
  series: ["#003A8F","#1F4CEB","#5B7FA6","#2F7F9D","#2E6F4E","#C69214","#7A2E2E","#6B7280"],
};
const DARK: ColorScheme = {
  bg: "#0B1220", panel: "#111827", grid: "#1F2933", axis: "#374151",
  text1: "#E5E7EB", text2: "#9CA3AF",
  series: ["#4F83CC","#1F4CEB","#5B7FA6","#2F7F9D","#4CAF84","#E0B84C","#C26D6D","#9CA3AF"],
};

const PARAMS = [
  "Latency","Throughput","Memory Usage","Storage","Scalability","Consistency",
  "Availability","Security","Accuracy","Debuggability","Infra Cost","Complexity",
  "Reliability","Maintainability","Real-time Perf","Data Freshness",
];

const LAYER_META = [
  {
    num: 1,
    title: "The Obvious Description",
    subtitle: "How you'd describe it in a standup",
    prompt: "Describe what your system does in one plain sentence. Use generic terms. This is the 'everyone does this' version.",
    placeholder: "e.g. We use caching to reduce latency for our API responses.",
    tag: "NOT PATENTABLE",
    tagColor: "#7A2E2E",
    guidance: "If a junior engineer would say 'yeah obviously' — you're at Layer 1. Good. This is your starting point, not your endpoint.",
    test: "Would a recruiter understand this sentence? If yes, it's too generic.",
  },
  {
    num: 2,
    title: "The Architectural Detail",
    subtitle: "How you'd explain it in a design review",
    prompt: "Now add the specific architectural choices. What data structures? What topology? What protocol? What makes your approach different from the textbook version?",
    placeholder: "e.g. We use a two-tier cache — L1 in-process with LFU eviction, L2 in Redis with TTL-based expiry — where L1 keys are promoted based on access frequency weighted by recency.",
    tag: "MAYBE PATENTABLE",
    tagColor: "#C69214",
    guidance: "You're getting warmer. There's specificity here, but we need to check: has anyone published this exact combination before? Is there a reason someone skilled in the art wouldn't naturally arrive here?",
    test: "Would a senior engineer at another company say 'interesting, we didn't think of that'? If yes, keep going.",
  },
  {
    num: 3,
    title: "The Inventive Mechanism",
    subtitle: "The part you were quietly proud of building",
    prompt: "Now describe the novel mechanism — the clever bit. The part where you solved a contradiction in a way that wasn't taught in any textbook, blog post, or StackOverflow answer. Be specific about how it works, not what it achieves.",
    placeholder: "e.g. The eviction policy per cache key is dynamically selected by a lightweight gradient-boosted classifier trained on access-pattern features (frequency, burstiness, temporal locality score). The classifier is retrained incrementally every 10 minutes using the cache-miss stream as ground truth labels, creating a closed-loop adaptive system where eviction strategy per-key converges to optimal without manual tuning or workload-specific configuration.",
    tag: "INVENTION CANDIDATE",
    tagColor: "#2E6F4E",
    guidance: "This is where patents live. The mechanism is specific, the combination is non-obvious, and it produces a measurable technical improvement. The TRIZ principle gave you the direction — this is the destination.",
    test: "Can you point to a specific technical improvement (latency reduced by X, memory saved by Y, fewer network calls)? If yes, you have Alice-safe anchoring.",
  },
];

const ALICE_QUESTIONS = [
  { q: "Does this improve a technical process (not just a business outcome)?", help: "Good: 'reduces p99 latency by 40%'. Bad: 'increases revenue'." },
  { q: "Is the improvement tied to a specific mechanism (not an abstract idea)?", help: "Good: 'by dynamically partitioning the hash ring based on load signals'. Bad: 'by using AI to optimize'." },
  { q: "Would this require a specific technical implementation to work?", help: "If someone can't build it from your description alone, add more detail. If they can build it 10 different ways, you might be too abstract." },
  { q: "Is there something unconventional about how components interact?", help: "Novelty often hides in the wiring between known components, not in the components themselves." },
];

const EXAMPLES = [
  {
    title: "Rate Limiter with Adaptive Fairness",
    contradiction: "Throughput vs. Security",
    layers: [
      "We use rate limiting to prevent abuse.",
      "We use a token bucket rate limiter with per-user quotas stored in Redis, with sliding window counters to handle burst patterns.",
      "Each user's token replenishment rate is dynamically adjusted based on a behavioral trust score computed from request entropy (URL diversity, temporal distribution, payload variance). High-entropy users get higher limits automatically; low-entropy users (bot-like patterns) get progressively throttled. The trust score is updated per-request using an exponentially weighted moving average, so legitimate users who occasionally burst aren't penalized but sustained bot patterns converge toward zero throughput within minutes — without any manual blocklist.",
    ],
  },
  {
    title: "ML Feature Store with Temporal Consistency",
    contradiction: "Data Freshness vs. Consistency",
    layers: [
      "We store features for our ML models in a feature store.",
      "We use a dual-write feature store where online features go to Redis and offline features go to a Parquet-based lake, with a reconciliation job that checks for drift.",
      "Feature reads for inference are point-in-time consistent by attaching a logical timestamp (derived from the triggering event's Kafka offset) to every feature request. The store maintains a per-feature versioned log and serves the latest version that precedes the request timestamp, ensuring that a prediction made about event E only uses features that were knowable at the time E occurred. Backfill operations replay the same timestamp logic, guaranteeing train-serve parity without duplicating storage — the same versioned log serves both online inference and offline training dataset generation.",
    ],
  },
];

function TextArea({ value, onChange, placeholder, rows, c }: {
  value: string; onChange: (val: string) => void; placeholder: string; rows?: number; c: ColorScheme;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows || 4}
      style={{
        width: "100%", padding: "12px 14px", borderRadius: "8px", fontSize: "13px",
        background: c.bg, color: c.text1, border: `1px solid ${c.grid}`,
        resize: "vertical", outline: "none", lineHeight: "1.6",
        fontFamily: "'Inter', system-ui, sans-serif", boxSizing: "border-box",
      }}
      onFocus={e => e.target.style.borderColor = c.series[0]}
      onBlur={e => e.target.style.borderColor = c.grid}
    />
  );
}

export default function PatentDrillWorksheet() {
  const [dark, setDark] = useState(false);
  const c = dark ? DARK : LIGHT;

  const [systemName, setSystemName] = useState("");
  const [improving, setImproving] = useState("");
  const [worsening, setWorsening] = useState("");
  const [layers, setLayers] = useState(["", "", ""]);
  const [aliceChecks, setAliceChecks] = useState([false, false, false, false]);
  const [technicalImprovement, setTechnicalImprovement] = useState("");
  const [priorArtNotes, setPriorArtNotes] = useState("");
  const [activeTab, setActiveTab] = useState("worksheet"); // worksheet | examples | export

  const setLayer = useCallback((idx: number, val: string) => {
    setLayers(prev => { const n = [...prev]; n[idx] = val; return n; });
  }, []);

  const toggleAlice = useCallback((idx: number) => {
    setAliceChecks(prev => { const n = [...prev]; n[idx] = !n[idx]; return n; });
  }, []);

  const aliceScore = aliceChecks.filter(Boolean).length;
  const completionScore = [
    systemName, improving, worsening, layers[0], layers[1], layers[2], technicalImprovement
  ].filter(v => v.trim().length > 10).length;

  const exportText = () => {
    const text = `PATENT IDEATION WORKSHEET
========================
System: ${systemName}
Contradiction: Improve ${improving} vs. Worsens ${worsening}

LAYER 1 — Obvious Description:
${layers[0]}

LAYER 2 — Architectural Detail:
${layers[1]}

LAYER 3 — Inventive Mechanism:
${layers[2]}

Technical Improvement: ${technicalImprovement}
Prior Art Notes: ${priorArtNotes}
Alice Score: ${aliceScore}/4
`;
    navigator.clipboard.writeText(text).catch(() => {});
    alert("Copied to clipboard");
  };

  return (
    <div style={{ background: c.bg, color: c.text1, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${c.grid}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Patent Ideation Drill
          </h1>
          <p style={{ fontSize: "13px", color: c.text2, margin: "4px 0 0" }}>
            Three-layer worksheet: from obvious to invention
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {["worksheet", "examples", "export"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                background: activeTab === tab ? c.series[0] + "18" : c.panel,
                color: activeTab === tab ? c.series[0] : c.text1,
                border: `1px solid ${activeTab === tab ? c.series[0] + "44" : c.grid}`,
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={() => setDark(!dark)}
            style={{
              padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              background: c.panel, color: c.text1, border: `1px solid ${c.grid}`,
            }}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "24px" }}>

        {activeTab === "examples" ? (
          /* ─── Examples Tab ─── */
          <div>
            <p style={{ fontSize: "14px", color: c.text2, margin: "0 0 20px", lineHeight: "1.6" }}>
              Two worked examples showing how the same system looks at each layer. 
              Notice how Layer 3 is the only one with enough specificity to be an invention.
            </p>
            {EXAMPLES.map((ex, ei) => (
              <div key={ei} style={{
                marginBottom: "24px", padding: "20px", borderRadius: "10px",
                background: c.panel, border: `1px solid ${c.grid}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>{ex.title}</h3>
                  <span style={{
                    fontSize: "11px", padding: "3px 10px", borderRadius: "4px",
                    background: c.series[3] + "22", color: c.series[3], fontWeight: 600,
                  }}>
                    {ex.contradiction}
                  </span>
                </div>
                {ex.layers.map((text, li) => (
                  <div key={li} style={{ marginBottom: li < 2 ? "12px" : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{
                        fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                        background: LAYER_META[li].tagColor + "22", color: LAYER_META[li].tagColor,
                      }}>
                        LAYER {li + 1}
                      </span>
                      <span style={{ fontSize: "11px", color: c.text2, fontWeight: 600 }}>{LAYER_META[li].title}</span>
                    </div>
                    <p style={{
                      fontSize: "13px", color: c.text2, margin: 0, lineHeight: "1.6",
                      padding: "10px 14px", borderRadius: "6px",
                      background: dark ? "#0B1220" : "#FFFFFF",
                      borderLeft: `3px solid ${LAYER_META[li].tagColor}`,
                    }}>
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : activeTab === "export" ? (
          /* ─── Export Tab ─── */
          <div>
            <div style={{
              padding: "20px", borderRadius: "10px", background: c.panel,
              border: `1px solid ${c.grid}`, marginBottom: "16px",
            }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 12px" }}>Worksheet Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ padding: "12px", borderRadius: "6px", background: dark ? "#0B1220" : "#FFFFFF", border: `1px solid ${c.grid}` }}>
                  <p style={{ fontSize: "11px", color: c.text2, margin: "0 0 4px", fontWeight: 600 }}>Completion</p>
                  <p style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: completionScore >= 5 ? c.series[4] : c.series[5] }}>
                    {completionScore}/7
                  </p>
                </div>
                <div style={{ padding: "12px", borderRadius: "6px", background: dark ? "#0B1220" : "#FFFFFF", border: `1px solid ${c.grid}` }}>
                  <p style={{ fontSize: "11px", color: c.text2, margin: "0 0 4px", fontWeight: 600 }}>Alice Score</p>
                  <p style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: aliceScore >= 3 ? c.series[4] : aliceScore >= 2 ? c.series[5] : c.series[6] }}>
                    {aliceScore}/4
                  </p>
                </div>
              </div>

              {systemName && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: c.text2, margin: "0 0 4px" }}>SYSTEM</p>
                  <p style={{ fontSize: "13px", margin: 0 }}>{systemName}</p>
                </div>
              )}
              {improving && worsening && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: c.text2, margin: "0 0 4px" }}>CONTRADICTION</p>
                  <p style={{ fontSize: "13px", margin: 0 }}>Improve {improving} vs. Worsens {worsening}</p>
                </div>
              )}
              {layers.map((text, i) => text.trim() && (
                <div key={i} style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: LAYER_META[i].tagColor, margin: "0 0 4px" }}>
                    LAYER {i + 1}: {LAYER_META[i].title.toUpperCase()}
                  </p>
                  <p style={{ fontSize: "13px", margin: 0, color: c.text2, lineHeight: "1.6" }}>{text}</p>
                </div>
              ))}
              {technicalImprovement.trim() && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: c.series[4], margin: "0 0 4px" }}>TECHNICAL IMPROVEMENT</p>
                  <p style={{ fontSize: "13px", margin: 0, color: c.text2, lineHeight: "1.6" }}>{technicalImprovement}</p>
                </div>
              )}
            </div>

            <button
              onClick={exportText}
              style={{
                width: "100%", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: 700,
                cursor: "pointer", background: c.series[0], color: "#FFFFFF", border: "none",
              }}
            >
              Copy to Clipboard
            </button>
          </div>
        ) : (
          /* ─── Worksheet Tab ─── */
          <div>
            {/* Progress bar */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: c.text2, fontWeight: 600 }}>Progress</span>
                <span style={{ fontSize: "11px", color: c.text2 }}>{completionScore}/7 sections</span>
              </div>
              <div style={{ height: "4px", borderRadius: "2px", background: c.grid }}>
                <div style={{
                  height: "100%", borderRadius: "2px", background: c.series[0],
                  width: `${(completionScore / 7) * 100}%`, transition: "width 0.3s ease",
                }} />
              </div>
            </div>

            {/* System & Contradiction */}
            <div style={{
              padding: "20px", borderRadius: "10px", background: c.panel,
              border: `1px solid ${c.grid}`, marginBottom: "16px",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px" }}>Your System</h3>
              <p style={{ fontSize: "12px", color: c.text2, margin: "0 0 12px" }}>
                Name the system or feature you built that you think might contain an invention.
              </p>
              <TextArea value={systemName} onChange={setSystemName}
                placeholder="e.g. Adaptive request router for our ML inference pipeline" rows={2} c={c} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: c.series[4], display: "block", marginBottom: "6px" }}>
                    IMPROVING (what gets better)
                  </label>
                  <select value={improving} onChange={e => setImproving(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: "6px", fontSize: "13px",
                      background: c.bg, color: c.text1, border: `1px solid ${c.grid}`, outline: "none",
                    }}>
                    <option value="">Select parameter...</option>
                    {PARAMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: c.series[6], display: "block", marginBottom: "6px" }}>
                    WORSENING (what degrades)
                  </label>
                  <select value={worsening} onChange={e => setWorsening(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: "6px", fontSize: "13px",
                      background: c.bg, color: c.text1, border: `1px solid ${c.grid}`, outline: "none",
                    }}>
                    <option value="">Select parameter...</option>
                    {PARAMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Three Layers */}
            {LAYER_META.map((layer, i) => (
              <div key={i} style={{
                padding: "20px", borderRadius: "10px", background: c.panel,
                border: `1px solid ${c.grid}`, marginBottom: "16px",
                borderLeft: `4px solid ${layer.tagColor}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{
                        fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px",
                        background: layer.tagColor + "22", color: layer.tagColor,
                      }}>
                        LAYER {layer.num}
                      </span>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>{layer.title}</h3>
                    </div>
                    <p style={{ fontSize: "12px", color: c.text2, margin: "0 0 4px", fontStyle: "italic" }}>{layer.subtitle}</p>
                  </div>
                  <span style={{
                    fontSize: "10px", fontWeight: 800, padding: "3px 10px", borderRadius: "4px",
                    background: layer.tagColor + "15", color: layer.tagColor,
                    whiteSpace: "nowrap",
                  }}>
                    {layer.tag}
                  </span>
                </div>

                <p style={{ fontSize: "12px", color: c.text2, margin: "8px 0 12px", lineHeight: "1.5" }}>
                  {layer.prompt}
                </p>

                <TextArea value={layers[i]} onChange={val => setLayer(i, val)}
                  placeholder={layer.placeholder} rows={i === 2 ? 6 : 3} c={c} />

                <div style={{
                  display: "flex", gap: "16px", marginTop: "10px", fontSize: "11px",
                }}>
                  <div style={{
                    flex: 1, padding: "8px 10px", borderRadius: "6px",
                    background: dark ? "#0B1220" : "#FFFFFF", color: c.text2, lineHeight: "1.5",
                  }}>
                    <span style={{ fontWeight: 700, color: c.text1 }}>Gut check: </span>{layer.test}
                  </div>
                </div>

                {layers[i].trim().length > 0 && (
                  <div style={{
                    marginTop: "10px", padding: "8px 10px", borderRadius: "6px",
                    background: layer.tagColor + "0A", fontSize: "11px", color: c.text2, lineHeight: "1.5",
                    borderLeft: `3px solid ${layer.tagColor}`,
                  }}>
                    {layer.guidance}
                  </div>
                )}
              </div>
            ))}

            {/* Alice Pre-Screen */}
            <div style={{
              padding: "20px", borderRadius: "10px", background: c.panel,
              border: `1px solid ${c.grid}`, marginBottom: "16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px" }}>Alice / Section 101 Pre-Screen</h3>
                  <p style={{ fontSize: "12px", color: c.text2, margin: 0 }}>
                    Quick check: is your Layer 3 anchored to a technical improvement?
                  </p>
                </div>
                <span style={{
                  fontSize: "18px", fontWeight: 800, padding: "4px 12px", borderRadius: "6px",
                  background: aliceScore >= 3 ? c.series[4] + "22" : aliceScore >= 2 ? c.series[5] + "22" : c.series[6] + "22",
                  color: aliceScore >= 3 ? c.series[4] : aliceScore >= 2 ? c.series[5] : c.series[6],
                }}>
                  {aliceScore}/4
                </span>
              </div>

              {ALICE_QUESTIONS.map((aq, i) => (
                <div
                  key={i}
                  onClick={() => toggleAlice(i)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px",
                    borderRadius: "6px", marginBottom: "8px", cursor: "pointer",
                    background: aliceChecks[i] ? c.series[4] + "0A" : dark ? "#0B1220" : "#FFFFFF",
                    border: `1px solid ${aliceChecks[i] ? c.series[4] + "33" : c.grid}`,
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "4px", flexShrink: 0, marginTop: "1px",
                    border: `2px solid ${aliceChecks[i] ? c.series[4] : c.axis}`,
                    background: aliceChecks[i] ? c.series[4] : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}>
                    {aliceChecks[i] && <span style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: 800 }}>Y</span>}
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 2px", color: c.text1 }}>{aq.q}</p>
                    <p style={{ fontSize: "11px", color: c.text2, margin: 0, lineHeight: "1.5" }}>{aq.help}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Improvement & Prior Art */}
            <div style={{
              padding: "20px", borderRadius: "10px", background: c.panel,
              border: `1px solid ${c.grid}`, marginBottom: "16px",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px" }}>Anchor Your Invention</h3>
              <p style={{ fontSize: "12px", color: c.text2, margin: "0 0 12px" }}>
                What specific, measurable technical improvement does your Layer 3 mechanism produce?
              </p>
              <TextArea value={technicalImprovement} onChange={setTechnicalImprovement}
                placeholder="e.g. Cache hit rate improved from 72% to 94% on production traffic without any manual tuning of eviction policy, while memory usage remained constant. Cold-start convergence time: ~8 minutes vs. infinite (never converges) for static LRU/LFU." rows={3} c={c} />

              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "20px 0 4px" }}>Prior Art Notes</h3>
              <p style={{ fontSize: "12px", color: c.text2, margin: "0 0 12px" }}>
                What existing solutions come closest? Why is your approach different?
              </p>
              <TextArea value={priorArtNotes} onChange={setPriorArtNotes}
                placeholder="e.g. Redis supports LRU/LFU natively but policy is global, not per-key. Academic work on adaptive caching (ARC, LIRS) uses fixed heuristics rather than learned models. No prior art combines per-key learned eviction with online retraining from the miss stream." rows={3} c={c} />
            </div>

            {/* Readiness assessment */}
            {completionScore >= 5 && (
              <div style={{
                padding: "20px", borderRadius: "10px",
                background: aliceScore >= 3 ? c.series[4] + "0A" : c.series[5] + "0A",
                border: `1px solid ${aliceScore >= 3 ? c.series[4] + "33" : c.series[5] + "33"}`,
              }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 8px",
                  color: aliceScore >= 3 ? c.series[4] : c.series[5],
                }}>
                  {aliceScore >= 3
                    ? "Strong invention candidate. Take this to your patent attorney."
                    : aliceScore >= 2
                    ? "Promising, but strengthen the technical anchoring before filing."
                    : "Needs more specificity in Layer 3. The mechanism is still too abstract."
                  }
                </h3>
                <p style={{ fontSize: "12px", color: c.text2, margin: 0, lineHeight: "1.6" }}>
                  {aliceScore >= 3
                    ? "Your Layer 3 mechanism is specific, your Alice anchoring is solid, and you have a measurable technical improvement. Export this worksheet and bring it to your next invention disclosure meeting."
                    : "Review the Alice questions you haven't checked. Each unchecked item is a vulnerability in your patent application. Can you rewrite Layer 3 to address them?"
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
