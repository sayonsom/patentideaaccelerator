import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

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

  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { problemStatement, techStack, framework, existingApproach, numIdeas } = body;

  if (!problemStatement) {
    return NextResponse.json(
      { error: "problemStatement is required" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = `Generate ${numIdeas || 3} inventive patent ideas for the following:

**Problem:** ${problemStatement}
**Existing Approach:** ${existingApproach || "Not specified"}
**Tech Stack:** ${(techStack || []).join(", ") || "General software"}
**Framework:** ${framework || "open"}

Generate creative, technically specific ideas. Each must resolve a real engineering contradiction and be defensible under Alice/Section 101.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
