import { CK_PROMPTS, SIT_TEMPLATES, SPRINT_PHASES } from "../../../../lib/constants";

function extractResponseText(responseJson) {
  if (!responseJson) return "";
  if (typeof responseJson.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }
  let out = "";
  for (const item of responseJson.output || []) {
    for (const c of item.content || []) {
      if (c.type === "output_text" && typeof c.text === "string") out += c.text;
    }
  }
  return out.trim();
}

function compact(str, max = 1600) {
  const s = String(str || "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function stageGuidance(ideaPhase) {
  if (ideaPhase === "foundation") {
    return [
      "Tone: exploratory, inventive, high-level but concrete.",
      "Goal: generate many plausible directions; focus on novelty and contradictions.",
      "Avoid: over-claiming; keep assumptions explicit.",
    ].join("\n");
  }
  if (ideaPhase === "validation") {
    return [
      "Tone: practical and testable.",
      "Goal: clarify hypotheses, metrics, constraints, and what to validate.",
      "Avoid: vague claims; include measurable outcomes where possible.",
    ].join("\n");
  }
  if (ideaPhase === "filing") {
    return [
      "Tone: precise, technical, patent-ready.",
      "Goal: capture the inventive mechanism and what makes it non-obvious.",
      "Avoid: marketing fluff; use clear components and steps.",
    ].join("\n");
  }
  return "Tone: clear and specific.";
}

function fieldInstruction({ framework, fieldKey, template }) {
  // Core fields
  const core = {
    title: "Generate a crisp, specific title (max 12 words). No quotes.",
    summary: "Write 1–2 sentences summarizing the invention and its key benefit. No quotes.",
    problem: "Write 2–4 sentences describing the problem + contradiction/gap and why existing approaches fall short.",
    target: "Write 1–2 sentences describing the target user/market and primary use case.",
    differentiator: "Write 3–6 bullet points of novelty/differentiation vs. likely prior art (technical, not marketing).",
    keywords: "Return 8–15 comma-separated keywords for patent search (no extra text).",
    patentClaim: "Draft one independent patent claim in clear, formal language (single claim).",
    redTeamNotes: "List 6–10 Red Team attacks/risks in bullets and 1 mitigation idea each (short).",
    notes: "Add a short set of prior-art search queries and references to investigate (bullets).",
  };

  if (framework === "triz") {
    if (fieldKey === "triz_improving") return "Suggest a single TRIZ improving parameter phrase (short).";
    if (fieldKey === "triz_worsening") return "Suggest a single TRIZ worsening parameter phrase (short).";
    if (fieldKey === "triz_resolution") return "Write 4–8 sentences describing a plausible mechanism that resolves the contradiction (technical).";
  }

  if (framework === "sit") {
    const name = template?.name || "SIT template";
    const prompt = template?.prompt || "";
    return [
      `Generate a SIT idea variant using: ${name}.`,
      prompt ? `Template prompt: ${prompt}` : null,
      "Output 2–5 sentences describing the variant and why it’s novel.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (framework === "ck") {
    if (fieldKey === "ck_concepts") {
      return [
        "Write 6–10 bullets for Concept Space (C): imaginative claims we can’t yet prove true/false.",
        `Prompt: ${CK_PROMPTS.concept}`,
      ].join("\n");
    }
    if (fieldKey === "ck_knowledge") {
      return [
        "Write Knowledge Space (K) as three sections: ✅ Proven, 🟡 Emerging, ❌ Gaps (bullets).",
        `Prompt: ${CK_PROMPTS.knowledge}`,
      ].join("\n");
    }
    if (fieldKey === "ck_opportunity") {
      return [
        "Write 3–6 bullets describing the patent opportunity at the C↔K boundary (what knowledge to create / test).",
        `Prompt: ${CK_PROMPTS.expansion}`,
      ].join("\n");
    }
  }

  return core[fieldKey] || "Generate improved text for this field.";
}

function buildPrompt({ framework, fieldKey, templateId, teamSprintPhase, idea }) {
  const template = templateId
    ? SIT_TEMPLATES.find((t) => t.id === templateId) || null
    : null;

  const teamStage = teamSprintPhase
    ? SPRINT_PHASES.find((p) => p.key === teamSprintPhase) || null
    : null;
  const ideaStage = SPRINT_PHASES.find((p) => p.key === idea?.phase) || null;

  const instruction = fieldInstruction({ framework, fieldKey, template });

  const existing =
    framework === "sit"
      ? idea?.sit?.[templateId] || ""
      : idea?.[fieldKey] || "";

  return [
    "You are an expert patent ideation coach. Improve or generate the requested field for a single idea.",
    "Return only the field content (no surrounding commentary).",
    "",
    "Stage guidance:",
    stageGuidance(idea?.phase),
    "",
    `Team stage: ${teamStage ? teamStage.label : "—"}`,
    `Idea stage: ${ideaStage ? ideaStage.label : idea?.phase || "—"}`,
    "",
    "TASK:",
    instruction,
    "",
    "IDEA CONTEXT:",
    `Title: ${compact(idea?.title)}`,
    `Keywords: ${compact(idea?.keywords)}`,
    `Summary: ${compact(idea?.summary)}`,
    `Problem: ${compact(idea?.problem)}`,
    `Target: ${compact(idea?.target)}`,
    `Differentiator: ${compact(idea?.differentiator)}`,
    "",
    "FRAMEWORK CONTEXT:",
    `TRIZ improving: ${compact(idea?.triz_improving, 400)}`,
    `TRIZ worsening: ${compact(idea?.triz_worsening, 400)}`,
    `TRIZ resolution: ${compact(idea?.triz_resolution, 600)}`,
    "",
    `C-K concepts: ${compact(idea?.ck_concepts, 600)}`,
    `C-K knowledge: ${compact(idea?.ck_knowledge, 600)}`,
    `C-K opportunity: ${compact(idea?.ck_opportunity, 600)}`,
    "",
    template
      ? `SIT template: ${template.name} — ${template.prompt}`
      : null,
    "",
    existing
      ? ["EXISTING DRAFT (refine it):", compact(existing, 1600)].join("\n")
      : "EXISTING DRAFT: (empty — generate from scratch)",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req) {
  const openaiKey = req.headers.get("x-openai-key") || "";
  if (!openaiKey.trim()) {
    return Response.json({ error: "Missing OpenAI API key" }, { status: 400 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { framework, fieldKey, templateId, teamSprintPhase, idea } = payload || {};
  if (!framework || !fieldKey || !idea) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = buildPrompt({
    framework,
    fieldKey,
    templateId: templateId || null,
    teamSprintPhase: teamSprintPhase || null,
    idea,
  });

  const model = "gpt-4o-mini";

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey.trim()}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.7,
      max_output_tokens: 450,
    }),
  });

  const json = await r.json().catch(() => null);
  if (!r.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      "OpenAI request failed";
    return Response.json({ error: msg }, { status: r.status });
  }

  const text = extractResponseText(json);
  if (!text) {
    return Response.json(
      { error: "No text returned from model" },
      { status: 502 }
    );
  }

  return Response.json({ text });
}
