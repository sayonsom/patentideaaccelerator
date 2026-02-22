import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveAIConfig, generateAIResponse, parseJSONFromResponse, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

const SYSTEM_PROMPT = `You are a senior patent attorney at a leading intellectual property law firm with 20+ years of experience in software and technology patent prosecution before the USPTO, EPO, and WIPO. You specialize in identifying and articulating inventive steps in software inventions.

Your task is to analyze the given invention and identify its inventive step(s) — the non-obvious technical contributions that make this invention patentable.

Consider:
1. What is the closest prior art? What exists before this invention?
2. What specific technical problem does this solve that prior art cannot?
3. Why would a "person skilled in the art" NOT arrive at this solution through routine experimentation?
4. What are the concrete technical advantages over prior approaches?

Respond with JSON matching this EXACT schema:
{
  "primaryInventiveStep": "The core non-obvious technical contribution (2-3 sentences)",
  "secondarySteps": ["Additional inventive aspects (1-2 sentences each)"],
  "nonObviousnessArgument": "Detailed argument for why this is non-obvious (3-5 sentences)",
  "closestPriorArt": ["Description of closest prior art approaches"],
  "differentiatingFactors": ["Specific technical differences from prior art"],
  "technicalAdvantage": "Concrete, measurable technical advantage (2-3 sentences)"
}`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let config;
  try {
    config = resolveAIConfig(req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "API key not configured";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const preferences = await resolvePromptPreferences(session.user.id);

  const body = await req.json();
  const { title, problemStatement, proposedSolution, technicalApproach, existingApproach } = body;

  if (!title && !proposedSolution) {
    return NextResponse.json(
      { error: "At least title or proposedSolution is required" },
      { status: 400 }
    );
  }

  const userPrompt = `Analyze the inventive step(s) of this software invention:

**Title:** ${title || "Untitled"}
**Problem Statement:** ${problemStatement || "Not specified"}
**Proposed Solution:** ${proposedSolution || "Not specified"}
**Technical Approach:** ${technicalApproach || "Not specified"}
**Existing Approach / Prior Art:** ${existingApproach || "Not specified"}

Identify what makes this invention non-obvious and patentable. Be thorough and specific.`;

  try {
    const systemPrompt = buildSystemPrompt(SYSTEM_PROMPT, preferences);
    const response = await generateAIResponse(config, systemPrompt, userPrompt, 4096);
    const parsed = parseJSONFromResponse(response.text);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
