import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIResponse, resolveAIConfig, parseJSONFromResponse, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

const SYSTEM_PROMPT = `You are an AI patent ideation assistant for software engineering teams.
Your job is to generate inventive concepts that are:
1. Technically specific (not abstract business methods)
2. Alice/Section 101 aware — emphasize concrete technological improvements
3. Novel — not obvious combinations of existing techniques
4. Patentable — suitable for method, system, and CRM claims

When given a problem, framework, and tech stack, generate creative, defensible patent ideas.
Each idea should resolve a real engineering contradiction.

For each idea, provide:
- title: A concise, patent-style title
- problemReframed: The problem restated as a technical challenge
- proposedSolution: The inventive solution (2-3 sentences)
- technicalApproach: Specific architecture/algorithm details (3-5 sentences)
- contradictionResolved: What trade-off this overcomes
- inventivePrincipleUsed: Which inventive principle applies (if any)
- estimatedCpcClass: Likely CPC classification (e.g., G06F, G06N, H04L)
- aliceRiskHint: "low", "medium", or "high" risk of Alice rejection

Respond with valid JSON only, matching this schema:
{
  "ideas": [<array of idea objects>],
  "frameworkUsed": "<framework name>"
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "API key not configured" },
      { status: 500 }
    );
  }

  const preferences = await resolvePromptPreferences(session.user.id);

  const body = await req.json();
  const { problemStatement, techStack, framework, existingApproach, numIdeas } = body;

  if (!problemStatement) {
    return NextResponse.json(
      { error: "problemStatement is required" },
      { status: 400 }
    );
  }

  const userPrompt = `Generate ${numIdeas || 3} inventive patent ideas for the following:

**Problem:** ${problemStatement}
**Existing Approach:** ${existingApproach || "Not specified"}
**Tech Stack:** ${(techStack || []).join(", ") || "General software"}
**Framework:** ${framework || "open"}

Generate creative, technically specific ideas. Each must resolve a real engineering contradiction and be defensible under Alice/Section 101.`;

  try {
    const systemPrompt = buildSystemPrompt(SYSTEM_PROMPT, preferences);
    const { text } = await generateAIResponse(config, systemPrompt, userPrompt, 4096);

    const parsed = parseJSONFromResponse(text);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
