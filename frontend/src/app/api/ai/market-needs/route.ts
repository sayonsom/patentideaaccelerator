import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveAIConfig, generateAIResponse, parseJSONFromResponse, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

const SYSTEM_PROMPT = `You are a technology market analyst and patent strategist specializing in software intellectual property valuation and commercialization. You combine deep technical understanding with market intelligence to evaluate inventions' commercial potential.

Your task is to analyze the market needs and commercial potential of the given invention. Provide data-driven insights where possible.

Consider:
1. What is the addressable market for this technology?
2. Who are the target users/companies that would benefit?
3. What existing pain points does this solve?
4. What is the competitive landscape?
5. What are the licensing and monetization opportunities?

Respond with JSON matching this EXACT schema:
{
  "marketSize": "Estimated addressable market with reasoning (e.g., 'The global API management market is valued at $5.1B and growing at 32% CAGR...')",
  "targetSegments": ["Specific market segments and user personas"],
  "painPointsSolved": ["Concrete business problems this invention addresses"],
  "competitiveLandscape": "Analysis of existing solutions and their limitations (3-5 sentences)",
  "commercializationPotential": "Assessment of commercial viability (3-5 sentences)",
  "licensingOpportunities": ["Potential licensing strategies and targets"],
  "strategicValue": "Strategic IP portfolio value assessment (2-3 sentences)"
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
  const { title, problemStatement, proposedSolution, technicalApproach, techStack } = body;

  if (!title && !proposedSolution) {
    return NextResponse.json(
      { error: "At least title or proposedSolution is required" },
      { status: 400 }
    );
  }

  const techStackStr = Array.isArray(techStack) && techStack.length > 0
    ? techStack.join(", ")
    : "Not specified";

  const userPrompt = `Analyze the market needs and commercial potential of this software invention:

**Title:** ${title || "Untitled"}
**Problem Statement:** ${problemStatement || "Not specified"}
**Proposed Solution:** ${proposedSolution || "Not specified"}
**Technical Approach:** ${technicalApproach || "Not specified"}
**Tech Stack:** ${techStackStr}

Provide a comprehensive market analysis with specific, data-driven insights.`;

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
